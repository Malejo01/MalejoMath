import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'

const parsedProgramSchema = z.object({
  units: z.array(
    z.object({
      name: z.string().min(1),
      topics: z.array(
        z.object({
          name: z.string().min(1),
          subtopics: z.array(z.string().min(1)).min(1),
        })
      ).min(1),
    })
  ).min(1),
})

type ParsedProgram = z.infer<typeof parsedProgramSchema>

function normalizeLine(line: string): string {
  return line
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function extractCurriculumSection(rawText: string): string {
  const lines = rawText.split(/\r?\n/).map(normalizeLine)

  const startMatchers = [
    /contenidos?\s+de\s+la\s+materia/i,
    /contenidos?\s+del\s+programa/i,
    /contenidos?\s+m[ií]nimos/i,
    /programa\s+anal[ií]tico/i,
    /temario/i,
    /unidades?\s+tem[aá]ticas?/i,
    /^contenidos?$/i,
  ]

  const endMatchers = [
    /^bibliograf[ií]a/i,
    /^evaluaci[oó]n/i,
    /^metodolog[ií]a/i,
    /^cronograma/i,
    /^objetivos?/i,
    /^correlativas?/i,
  ]

  let startIndex = lines.findIndex((line) => startMatchers.some((matcher) => matcher.test(line)))
  if (startIndex < 0) {
    startIndex = 0
  }

  let endIndex = lines.length
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (endMatchers.some((matcher) => matcher.test(lines[i]))) {
      endIndex = i
      break
    }
  }

  const section = lines.slice(startIndex, endIndex).join('\n').trim()
  return section.length > 0 ? section : rawText.slice(0, 12000)
}

function isLikelyUnitLine(line: string): boolean {
  return /^(unidad|unit|m[oó]dulo|modulo|eje|bloque)\s*\d*/i.test(line)
}

function splitTopicAndSubtopics(line: string): { topicName: string; subtopics: string[] } {
  const cleaned = line.replace(/^[\-•*\d\.\)\s]+/, '').trim()
  if (cleaned.length === 0) {
    return { topicName: 'Tema', subtopics: ['Contenido principal'] }
  }

  const parts = cleaned
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  if (parts.length <= 1) {
    return { topicName: cleaned, subtopics: [cleaned] }
  }

  return {
    topicName: parts[0],
    subtopics: parts,
  }
}

function parseHeuristicProgram(rawText: string): ParsedProgram {
  const section = extractCurriculumSection(rawText)
  const lines = section
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => line.length > 2)
    .slice(0, 220)

  const units: ParsedProgram['units'] = []
  let currentUnit: ParsedProgram['units'][number] | null = null

  for (const line of lines) {
    if (isLikelyUnitLine(line)) {
      currentUnit = {
        name: line.replace(/[:\-\s]+$/, '').trim(),
        topics: [],
      }
      units.push(currentUnit)
      continue
    }

    if (!currentUnit) {
      currentUnit = {
        name: 'Unidad 1',
        topics: [],
      }
      units.push(currentUnit)
    }

    const { topicName, subtopics } = splitTopicAndSubtopics(line)
    currentUnit.topics.push({
      name: topicName,
      subtopics,
    })
  }

  const sanitizedUnits = units
    .map((unit, index) => ({
      name: unit.name || `Unidad ${index + 1}`,
      topics: unit.topics.filter((topic) => topic.name.trim().length > 0),
    }))
    .filter((unit) => unit.topics.length > 0)

  if (sanitizedUnits.length > 0) {
    return { units: sanitizedUnits }
  }

  const cleaned = Array.from(new Set(lines)).slice(0, 20)

  const subtopics = cleaned
    .slice(0, 12)
    .map((line) => line.replace(/^[\-*\d\.\)\s]+/, '').trim())
    .filter((line) => line.length > 0)

  return {
    units: [
      {
        name: 'Unidad 1',
        topics: [
          {
            name: 'Temas extraidos del programa',
            subtopics: subtopics.length > 0 ? subtopics : ['Contenido principal'],
          },
        ],
      },
    ],
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfModule = await import('pdf-parse')
  const legacyParse = (pdfModule as unknown as { default?: (data: Buffer) => Promise<{ text?: string }> }).default

  // Backward compatibility for older pdf-parse versions that export a function.
  if (typeof legacyParse === 'function') {
    const parsed = await legacyParse(buffer)
    return (parsed?.text || '').trim()
  }

  const PDFParseClass = (pdfModule as unknown as { PDFParse?: new (params: { data: Buffer }) => { getText: () => Promise<{ text?: string }>; destroy?: () => Promise<void> } }).PDFParse

  if (typeof PDFParseClass !== 'function') {
    throw new Error('PDF parser no disponible: exportacion invalida de pdf-parse')
  }

  const parserWithWorker = pdfModule as unknown as {
    PDFParse?: {
      new (params: { data: Buffer }): { getText: () => Promise<{ text?: string }>; destroy?: () => Promise<void> }
      setWorker?: (workerSrc?: string) => string
    }
  }

  if (typeof parserWithWorker.PDFParse?.setWorker === 'function') {
    parserWithWorker.PDFParse.setWorker('pdfjs-dist/legacy/build/pdf.worker.mjs')
  }

  const parser = new PDFParseClass({ data: buffer })
  try {
    const parsed = await parser.getText()
    return (parsed?.text || '').trim()
  } finally {
    if (typeof parser.destroy === 'function') {
      await parser.destroy()
    }
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return (result.value || '').trim()
}

async function requireTeacher(userId: string) {
  const rows = await sql`
    SELECT COALESCE(role, 'student') AS role
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  return rows.length > 0 && rows[0].role === 'teacher'
}

function normalizeUnits(parsed: ParsedProgram) {
  return parsed.units.map((unit, unitIndex) => ({
    id: `tp-u-${unitIndex + 1}`,
    name: unit.name,
    topics: unit.topics.map((topic, topicIndex) => ({
      id: `tp-u-${unitIndex + 1}-t-${topicIndex + 1}`,
      name: topic.name,
      subtopics: topic.subtopics.map((subtopic, subIndex) => ({
        id: `tp-u-${unitIndex + 1}-t-${topicIndex + 1}-s-${subIndex + 1}`,
        name: subtopic,
      })),
    })),
  }))
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const isTeacher = await requireTeacher(userId)
    if (!isTeacher) {
      return NextResponse.json({ error: 'Solo docentes pueden subir programas' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Debes subir un archivo' }, { status: 400 })
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se aceptan PDF y DOCX' }, { status: 400 })
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'El archivo supera el limite de 5MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    let extractedText = ''
    if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPdf(fileBuffer)
    } else {
      extractedText = await extractTextFromDocx(fileBuffer)
    }

    if (!extractedText || extractedText.length < 100) {
      return NextResponse.json(
        { error: 'No se pudo extraer contenido util del archivo. Intenta con otro documento.' },
        { status: 422 }
      )
    }

    const curriculumSection = extractCurriculumSection(extractedText)
    const clippedText = extractedText.slice(0, 25000)
    const clippedSection = curriculumSection.slice(0, 15000)

    let parsedProgram: ParsedProgram

    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: parsedProgramSchema,
        schemaName: 'programStructure',
        schemaDescription: 'Estructura curricular con unidades, temas y subtemas',
        system: 'Eres un asistente academico. Extrae una estructura curricular jerarquica precisa.',
        prompt: `Analiza el programa y devuelve la estructura curricular en este orden de prioridad:
1) Unidades
2) Temas dentro de cada unidad
3) Subtemas (si un tema tiene items separados por coma, usar esos items como subtemas)

Busca primero la seccion equivalente a: "Contenidos de la Materia", "Contenidos del Programa", "Temario" o "Unidades Tematicas".
Si hay conflicto entre secciones, prioriza la seccion de contenidos.
No inventes unidades ni temas que no aparezcan en el documento.

Seccion prioritaria detectada:
${clippedSection}

Documento completo (respaldo):
${clippedText}`,
        temperature: 0.2,
        maxOutputTokens: 2500,
      })

      parsedProgram = parsedProgramSchema.parse(object)
    } catch {
      parsedProgram = parseHeuristicProgram(clippedText)
    }

    try {
      await sql`
        INSERT INTO teacher_program_uploads (
          user_id,
          file_name,
          mime_type,
          file_size_bytes,
          file_data,
          created_at,
          expires_at
        )
        VALUES (
          ${userId},
          ${file.name},
          ${file.type},
          ${file.size},
          ${fileBuffer},
          NOW(),
          NOW() + INTERVAL '24 hours'
        )
      `
    } catch (uploadError) {
      console.error('No se pudo persistir temporalmente el archivo del programa', uploadError)
    }

    const normalizedUnits = normalizeUnits(parsedProgram)

    return NextResponse.json({
      sourceFileName: file.name,
      sourceMimeType: file.type,
      sourceFileSizeBytes: file.size,
      units: normalizedUnits,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudo procesar el archivo',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
