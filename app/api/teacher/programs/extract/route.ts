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

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const parsed = await pdfParse(buffer)
  return (parsed.text || '').trim()
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

    const clippedText = extractedText.slice(0, 25000)

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: parsedProgramSchema,
      schemaName: 'programStructure',
      schemaDescription: 'Estructura curricular con unidades, temas y subtemas',
      system: 'Eres un asistente academico. Extrae una estructura curricular jerarquica precisa.',
      prompt: `Analiza este programa de asignatura y devuelve solo la estructura curricular.

Debes responder unidades, temas y subtemas.
No inventes unidades ni temas que no aparezcan en el contenido.

Contenido del documento:
${clippedText}`,
      temperature: 0.2,
      maxOutputTokens: 2500,
    })

    const normalizedUnits = normalizeUnits(object)

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
