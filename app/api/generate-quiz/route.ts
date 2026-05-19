import { generateObject, generateText, type RepairTextFunction } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Schema Zod — más lenient para permitir variaciones
const quizSchema = z.object({
  questions: z.array(z.object({
    id: z.string().optional(),
    topic: z.string().optional(),
    topicName: z.string().optional(),
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string()
  }))
}).transform(data => ({
  questions: data.questions.map((q, idx) => ({
    id: q.id || `q${idx + 1}`,
    topic: q.topic || 'unknown',
    topicName: q.topicName || 'Unknown Topic',
    question: q.question,
    options: q.options,
    correctAnswer: Number(q.correctAnswer),
    explanation: q.explanation
  }))
}))

// Curriculum oficial inyectado en el contexto de Gemini
const ALGEBRA_CURRICULUM = `
PROGRAMA OFICIAL DE ÁLGEBRA I:

Unidad I: Lógica Proposicional
- Proposición, Conectivos lógicos, Tablas de verdad, Tautologías
- Leyes lógicas (De Morgan, Conmutativas, Asociativas, Distributivas)
- Cuantificadores universales y existenciales
- Métodos de demostración: Directo, Indirecto, Contraejemplo, Inducción

Unidad II: Ecuaciones e Inecuaciones
- Ecuaciones polinómicas, Fórmula cuadrática, Discriminante
- Números complejos: forma binómica, conjugado, módulo, operaciones
- Ecuaciones racionales, con radicales, exponenciales y logarítmicas
- Inecuaciones polinómicas, racionales, con valor absoluto

Unidad III: Matrices y Sistemas
- Operaciones con matrices, Matriz inversa
- Determinantes: cálculo y propiedades
- Sistemas de ecuaciones: Método de Gauss (ESTÁNDAR DE LA CÁTEDRA)
- Teorema de Rouché-Frobenius, Regla de Cramer

Unidad IV: Combinatoria y Vectores
- Sumatoria, Productorio, Factorial
- Números combinatorios, Binomio de Newton
- Permutaciones, Variaciones, Combinaciones
- Vectores en R2 y R3, Producto escalar y vectorial
`

const ANALISIS_CURRICULUM = `
PROGRAMA OFICIAL DE ANÁLISIS MATEMÁTICO I:

Unidad I: Límites y Continuidad
- Límites: definición, propiedades, límites laterales
- Límites notables, Asíntotas
- Continuidad y tipos de discontinuidad

Unidad II: Derivadas
- Definición de derivada, Interpretación geométrica
- Reglas de derivación: suma, producto, cociente, cadena
- Aplicaciones: máximos, mínimos, concavidad
- Regla de L'Hôpital

Unidad III: Integrales
- Integral indefinida, Métodos de integración
- Integral definida, Teorema Fundamental del Cálculo
- Cálculo de áreas y volúmenes

Unidad IV: Series
- Sucesiones y series numéricas
- Criterios de convergencia
- Series de Taylor y Maclaurin
`

const PROBABILIDAD_CURRICULUM = `
PROGRAMA OFICIAL DE PROBABILIDAD Y ESTADÍSTICA:

Unidad I: Estadística Descriptiva
- Medidas de tendencia central: media, mediana, moda
- Medidas de dispersión: varianza, desviación estándar
- Representaciones gráficas

Unidad II: Probabilidad
- Espacio muestral, eventos, técnicas de conteo
- Probabilidad clásica, condicional
- Teorema de Bayes, Independencia

Unidad III: Variables Aleatorias
- Variables discretas: Binomial, Poisson
- Variables continuas: Normal, Exponencial
- Esperanza y varianza

Unidad IV: Inferencia Estadística
- Intervalos de confianza
- Pruebas de hipótesis
- Regresión lineal, Correlación
`

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const repairQuizJson: RepairTextFunction = async ({ text }) => {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  
  // First, try to find and extract the JSON object
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) {
    console.warn('[repairQuizJson] No JSON structure found')
    return null
  }

  let candidate = match[0]
  
  // Remove trailing commas before } or ]
  candidate = candidate.replace(/,\s*([}\]])/g, '$1')
  
  // Fix common escaping issues
  // Single backslash followed by non-escape character becomes double backslash
  candidate = candidate.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
  
  // Fix unescaped quotes inside strings (common issue)
  // This is tricky - try to fix common patterns
  candidate = candidate.replace(/: "([^"]*)"([^,}\]])/g, (match, content, next) => {
    // If content has unescaped quotes, escape them
    const fixed = content.replace(/([^\\])"/g, '$1\\"')
    return `: "${fixed}"${next}`
  })

  console.log('[repairQuizJson] Repairs applied, length:', candidate.length)
  return candidate
}

function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\$+/g, '')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLogicalNotation(text: string): string {
  return text
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\wedge/g, '∧')
    .replace(/\\vee/g, '∨')
    .replace(/\\neg\s*/g, '¬')
    // Recover already-corrupted tokens like "egp" or "eg(q∨r)".
    .replace(/(^|[\s(])eg(?=[a-zA-Z(])/gi, '$1¬')
}

function normalizeQuestionSetLogicalNotation(questions: any[]) {
  return questions.map((question) => ({
    ...question,
    question: normalizeLogicalNotation(String(question.question || '')),
    explanation: normalizeLogicalNotation(String(question.explanation || '')),
    options: Array.isArray(question.options)
      ? question.options.map((option: unknown) => normalizeLogicalNotation(String(option)))
      : [],
  }))
}

function cleanGeminiResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  
  // Remove "json" prefix if it appears at the start
  cleaned = cleaned.replace(/^json\s*/i, '')
  
  // Remove common prefixes/suffixes Gemini adds
  cleaned = cleaned.replace(/^Here.*?:?\s*/i, '')
  cleaned = cleaned.replace(/^Response.*?:?\s*/i, '')
  
  // Remove trailing text after the last }
  const lastBrace = cleaned.lastIndexOf('}')
  if (lastBrace !== -1) {
    cleaned = cleaned.substring(0, lastBrace + 1)
  }
  
  return cleaned.trim()
}

function extractFirstJsonObject(text: string): string | null {
  // Try direct brace match first
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  
  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace === -1) {
    console.warn('[extractFirstJsonObject] No opening brace found')
    return null
  }

  let braceCount = 0
  let lastValidBrace = -1
  
  for (let i = firstBrace; i < cleaned.length; i++) {
    if (cleaned[i] === '{') braceCount++
    else if (cleaned[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        lastValidBrace = i
        break
      }
    }
  }

  if (lastValidBrace === -1) {
    console.warn('[extractFirstJsonObject] Mismatched braces, braceCount ended at:', braceCount)
    return null
  }

  const extracted = cleaned.substring(firstBrace, lastValidBrace + 1)
  console.log('[extractFirstJsonObject] Extracted JSON length:', extracted.length)
  return extracted
}

async function generateQuizBatchWithFallback({
  subject,
  curriculum,
  modeDescription,
  topicsText,
  questionCount,
  previousNote,
  pedagogyNote,
  specialistRole,
}: {
  subject: string
  curriculum: string
  modeDescription: string
  topicsText: string
  questionCount: number
  previousNote: string
  pedagogyNote: string
  specialistRole: string
}) {
  const systemPrompt = `${specialistRole}
Tu única tarea es generar un objeto JSON que contenga un array de preguntas.

INSTRUCCIONES CRÍTICAS:
1. Genera EXACTAMENTE ${questionCount} preguntas.
2. Responde SOLO con JSON válido. Sin markdown, sin explicaciones, sin comentarios.
3. Estructura: { "questions": [ { id, topic, topicName, question, options, correctAnswer, explanation }, ... ] }

FORMATO ESTRICTO PARA CONTENIDO MATEMÁTICO (si aplica):
- TODO contenido matemático debe estar entre $...$
- Usa LaTeX estándar: \\frac{a}{b}, \\sqrt{x}, x^2, etc.
- Operadores lógicos: $p \\wedge q$ (y), $p \\vee q$ (o), $\\neg p$ (no), $p \\rightarrow q$ (si...entonces), $p \\leftrightarrow q$ (si y solo si)
- Escapa backslashes: \\\\frac, \\\\sqrt, \\\\wedge (dos barras en JSON)

CAMPOS OBLIGATORIOS POR PREGUNTA:
- id: string (ej: "q1", "q2")
- topic: string (ID del tema)
- topicName: string (nombre del tema)
- question: string (enunciado con LaTeX entre $)
- options: array de strings (4-6 opciones)
- correctAnswer: number (0-based index)
- explanation: string (2-4 frases, con LaTeX entre $)`

  const userPrompt = `Genera ${questionCount} preguntas para: ${subject}

CURRICULUM:
${curriculum}

MODO: ${modeDescription}

TEMAS: ${topicsText}

${previousNote}
${pedagogyNote}

IMPORTANTE: Responde SOLO JSON válido comenzando con { y terminando con }`

  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: quizSchema,
      schemaName: 'quizQuestions',
      schemaDescription: `Objeto JSON con exactamente ${questionCount} preguntas, cada una con id, topic, topicName, question, options (array), correctAnswer (0-based), explanation.`,
      experimental_repairText: repairQuizJson,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 8000,
      temperature: 0.3,
    })

    console.log('[generateObject] Success! Questions:', object.questions.length)
    return normalizeQuestionSetLogicalNotation(object.questions)
  } catch (primaryError: any) {
    console.warn('[generateObject] Primary parse failed, retrying with generateText:', primaryError?.message)

    let rawText = ''
    for (let retryAttempt = 0; retryAttempt < 2; retryAttempt++) {
      try {
        const response = await generateText({
          model: google('gemini-2.5-flash'),
          system: systemPrompt,
          prompt: userPrompt,
          maxOutputTokens: 8000,
          temperature: 0.2,
        })
        rawText = response.text
        console.log(`[generateText] Attempt ${retryAttempt + 1} succeeded, length: ${rawText.length}`)
        break
      } catch (textGenErr) {
        console.warn(`[generateText] Attempt ${retryAttempt + 1} failed:`, textGenErr)
        if (retryAttempt === 1) throw textGenErr
      }
    }

    const text = cleanGeminiResponse(rawText)
    console.log('[cleanGeminiResponse] Before:', rawText.length, 'After:', text.length)
    console.log('[cleanGeminiResponse] First 300 chars:', text.substring(0, 300))

    const repaired = await repairQuizJson({ text })
    console.log('[repairQuizJson] Result:', repaired ? `Success (${repaired.length} chars)` : 'Failed')

    const jsonCandidate = repaired ?? extractFirstJsonObject(text)
    
    if (!jsonCandidate) {
      console.error('[fallback] Could not extract JSON after repair and extraction')
      console.error('[fallback] Cleaned response:', text.substring(0, 800))
      throw new Error('No object generated: could not parse the response.')
    }

    console.log('[jsonCandidate] Length:', jsonCandidate.length, 'Starts:', jsonCandidate.substring(0, 50))

    let parsed: any
    try {
      parsed = JSON.parse(jsonCandidate)
      console.log('[JSON.parse] ✓ Success, type:', typeof parsed)
      console.log('[JSON.parse] Top-level keys:', Object.keys(parsed).join(', '))
    } catch (parseErr: any) {
      console.error('[JSON.parse] ✗ Failed:', parseErr.message)
      console.error('[JSON.parse] Error at position:', parseErr.pos)
      console.error('[JSON.parse] Around error:', jsonCandidate.substring(Math.max(0, (parseErr.pos || 0) - 50), (parseErr.pos || 0) + 50))
      throw new Error('No object generated: could not parse the response.')
    }

    // Lenient validation - ensure we have a questions array
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      console.error('[validation] ✗ Missing or invalid questions array')
      throw new Error('No object generated: invalid quiz schema.')
    }

    console.log('[validation] ✓ Found questions array with', parsed.questions.length, 'items')

    if (parsed.questions.length === 0) {
      console.error('[validation] ✗ Empty questions array')
      throw new Error('No object generated: empty questions array.')
    }

    // Validate with lenient schema
    const validated = quizSchema.safeParse(parsed)
    if (!validated.success) {
      const errors = validated.error.issues.map(i => `${i.path.join('.')} - ${i.message}`).join('; ')
      console.error('[Zod validation] ✗ Failed on', validated.error.issues.length, 'issue(s)')
      console.error('[Zod validation] Errors:', errors.substring(0, 500))
      
      // If only some questions are invalid, try to use valid ones
      if (parsed.questions && Array.isArray(parsed.questions)) {
        const validQuestions = parsed.questions.filter((q: any) => {
          const isValid = q.question && Array.isArray(q.options) && 
                 typeof q.correctAnswer === 'number' && q.explanation && q.options.length > 0
          return isValid
        })
        
        if (validQuestions.length > 0) {
          console.warn(`[Zod validation] ⚠ Using ${validQuestions.length}/${parsed.questions.length} valid questions`)
          // Manually map to ensure all required fields exist
          const normalizedValidQuestions = validQuestions.map((q: any, idx: number) => ({
            id: q.id || `q${idx + 1}`,
            topic: q.topic || 'unknown',
            topicName: q.topicName || 'Unknown Topic',
            question: q.question,
            options: q.options,
            correctAnswer: Number(q.correctAnswer),
            explanation: q.explanation
          }))

          return normalizeQuestionSetLogicalNotation(normalizedValidQuestions)
        }
      }
      
      throw new Error('No object generated: invalid quiz schema.')
    }

    console.log('[generateObject fallback] ✓ Success! Returning', validated.data.questions.length, 'questions')
    return normalizeQuestionSetLogicalNotation(validated.data.questions)
  }
}

async function generateQuizBatch({
  subject,
  curriculum,
  modeDescription,
  topicsText,
  questionCount,
  previousNote,
  pedagogyNote,
  specialistRole,
}: {
  subject: string
  curriculum: string
  modeDescription: string
  topicsText: string
  questionCount: number
  previousNote: string
  pedagogyNote: string
  specialistRole: string
}) {
  return generateQuizBatchWithFallback({
    subject,
    curriculum,
    modeDescription,
    topicsText,
    questionCount,
    previousNote,
    pedagogyNote,
    specialistRole,
  })
}

function interleaveQuestions(teoricoQuestions: any[], practicoQuestions: any[], total: number) {
  const mixed = []
  const maxLength = Math.max(teoricoQuestions.length, practicoQuestions.length)

  for (let i = 0; i < maxLength && mixed.length < total; i++) {
    if (teoricoQuestions[i]) mixed.push(teoricoQuestions[i])
    if (practicoQuestions[i] && mixed.length < total) mixed.push(practicoQuestions[i])
  }

  return mixed.slice(0, total)
}

function buildCurriculumFromUnits(subject: string, units: any[]): string {
  if (!units || units.length === 0) {
    return `Materia: ${subject}`
  }

  const unitsText = units
    .map((unit: any) => {
      const topicsText = unit.topics
        ?.map((topic: any) => `  - ${topic.name}`)
        .join('\n') || ''
      return `${unit.name}:\n${topicsText}`
    })
    .join('\n\n')

  return `PROGRAMA DE ${subject.toUpperCase()}:\n\n${unitsText}`
}

function getSpecialistRole(subject: string, source: string): string {
  if (source === 'core') {
    return 'Eres un experto generador de exámenes de matemáticas universitarias.'
  }

  const subjectLower = subject.toLowerCase()
  if (subjectLower.includes('programación') || subjectLower.includes('informatica') || subjectLower.includes('computación')) {
    return `Eres un experto generador de exámenes de programación e informática especializado en ${subject}.`
  }
  if (subjectLower.includes('física') || subjectLower.includes('mecanica')) {
    return `Eres un experto generador de exámenes de física especializado en ${subject}.`
  }
  if (subjectLower.includes('química') || subjectLower.includes('quimica')) {
    return `Eres un experto generador de exámenes de química especializado en ${subject}.`
  }
  if (subjectLower.includes('historia') || subjectLower.includes('geografía')) {
    return `Eres un experto generador de exámenes de historia y geografía especializado en ${subject}.`
  }
  if (subjectLower.includes('idioma') || subjectLower.includes('lengua') || subjectLower.includes('english') || subjectLower.includes('español')) {
    return `Eres un experto generador de exámenes de idiomas especializado en ${subject}.`
  }
  if (subjectLower.includes('derecho') || subjectLower.includes('leyes')) {
    return `Eres un experto generador de exámenes de derecho especializado en ${subject}.`
  }
  
  return `Eres un experto generador de exámenes universitarios especializado en ${subject}.`
}

function buildLocalFallbackQuestions({
  subject,
  topics,
  mode,
  questionCount,
}: {
  subject: string
  topics: Array<{ id?: string; name?: string }>
  mode: 'teorico' | 'practico' | 'mixto'
  questionCount: number
}) {
  const safeTopics = Array.isArray(topics) && topics.length > 0
    ? topics
    : [{ id: 'general', name: 'Tema general' }]

  const isAlgebra = subject.toLowerCase().includes('algebra') || subject.toLowerCase().includes('álgebra')
  const questions = []

  for (let i = 0; i < questionCount; i++) {
    const topic = safeTopics[i % safeTopics.length]
    const topicName = topic.name || 'Tema general'
    const topicId = topic.id || `topic-${i + 1}`
    const topicLower = topicName.toLowerCase()

    let question = `Sobre ${topicName}, selecciona la afirmación correcta.`
    let options = [
      'La afirmación principal es correcta en el caso planteado.',
      'La afirmación principal es falsa en el caso planteado.',
      'No se puede decidir con la información dada.',
      'Depende de una condición adicional no indicada.'
    ]
    let correctAnswer = 0
    let explanation = 'La opción correcta se obtiene aplicando la definición y las reglas del tema indicado.'

    if (isAlgebra && (mode === 'practico' || mode === 'mixto')) {
      if (topicLower.includes('lógica') || topicLower.includes('propos')) {
        question = 'Si $p$ y $q$ son verdaderas, ¿cuál es el valor de $p \\leftrightarrow q$?'
        options = ['Verdadero', 'Falso', 'Indeterminado', 'Depende del contexto']
        correctAnswer = 0
        explanation = 'El bicondicional $p \\leftrightarrow q$ es verdadero cuando $p$ y $q$ tienen el mismo valor de verdad.'
      } else if (topicLower.includes('de morgan')) {
        question = '¿Qué expresión es equivalente a $\\neg(p \\wedge q)$?'
        options = ['$\\neg p \\vee \\neg q$', '$\\neg p \\wedge \\neg q$', '$p \\vee q$', '$p \\wedge q$']
        correctAnswer = 0
        explanation = 'Por la ley de De Morgan: $\\neg(p \\wedge q) \\equiv \\neg p \\vee \\neg q$.'
      } else if (topicLower.includes('tautolog')) {
        question = '¿Cuál de las siguientes proposiciones es una tautología?'
        options = ['$p \\vee \\neg p$', '$p \\wedge \\neg p$', '$p \\rightarrow q$', '$p \\leftrightarrow q$']
        correctAnswer = 0
        explanation = 'La proposición $p \\vee \\neg p$ es siempre verdadera para cualquier valor de $p$.'
      } else {
        question = `En ${topicName}, si $p$ es verdadera y $q$ es falsa, ¿cuál es el valor de $p \\wedge q$?`
        options = ['Falso', 'Verdadero', 'Indeterminado', 'Depende del orden']
        correctAnswer = 0
        explanation = 'La conjunción $p \\wedge q$ solo es verdadera cuando ambas proposiciones son verdaderas.'
      }
    } else if (mode === 'teorico') {
      question = `En ${topicName}, ¿cuál describe mejor el objetivo central del tema?`
      options = [
        'Definir conceptos base y sus relaciones formales.',
        'Evitar cualquier formalismo y trabajar solo con ejemplos.',
        'Usar únicamente memorización de resultados sin justificación.',
        'Reemplazar la teoría por cálculo numérico no relacionado.'
      ]
      correctAnswer = 0
      explanation = 'El enfoque teórico busca comprensión conceptual y relación entre definiciones, propiedades y resultados.'
    }

    questions.push({
      id: `fallback-${i + 1}`,
      topic: topicId,
      topicName,
      question,
      options,
      correctAnswer,
      explanation,
    })
  }

  return questions
}

export async function POST(req: Request) {
  const { subject, subjectSource = 'core', subjectUnits = [], topics, mode, previousQuestionIds, previousQuestions, pedagogyContext, questionCount: rawQuestionCount } = await req.json()
  const parsedQuestionCount = Number(rawQuestionCount)
  const questionCount = Number.isInteger(parsedQuestionCount) ? parsedQuestionCount : 10

  if (questionCount < 5 || questionCount > 50) {
    return Response.json({
      questions: [],
      error: 'La cantidad de preguntas debe estar entre 5 y 50.'
    }, { status: 400 })
  }

  const topicsText = topics.map((t: { id: string; name: string }) => `- ${t.name}`).join('\n')
  const previousQuestionList = Array.isArray(previousQuestions) ? previousQuestions : []
  const previousQuestionTexts = previousQuestionList
    .map((question: { question?: string }) => question.question)
    .filter((question: string | undefined): question is string => Boolean(question))
  const previousQuestionFingerprints = new Set(previousQuestionTexts.map(normalizeQuestionText))

  // Seleccionar o generar el curriculum apropiado
  let curriculum = ALGEBRA_CURRICULUM
  
  if (subjectSource === 'teacher') {
    // Para materias subidas, construir curriculum dinámicamente
    curriculum = buildCurriculumFromUnits(subject, subjectUnits)
  } else {
    // Para materias core, usar curriculums predefinidos
    if (subject.toLowerCase().includes('análisis') || subject.toLowerCase().includes('analisis')) {
      curriculum = ANALISIS_CURRICULUM
    } else if (subject.toLowerCase().includes('probabilidad') || subject.toLowerCase().includes('estadística')) {
      curriculum = PROBABILIDAD_CURRICULUM
    }
  }

  const specialistRole = getSpecialistRole(subject, subjectSource)

  const modeDescription = mode === 'teorico'
    ? 'MODO TEÓRICO: Preguntas conceptuales sobre definiciones, teoremas y propiedades. Sin cálculos numéricos complejos.'
    : mode === 'practico'
      ? 'MODO PRÁCTICO: Ejercicios de cálculo y resolución de problemas numéricos.'
      : 'MODO MIXTO: Equilibrar preguntas teoricas y practicas.'

  const previousNote = previousQuestionTexts.length > 0
    ? `NO repitas ni reformules estas preguntas previas:\n${previousQuestionTexts.map((question: string, index: number) => `${index + 1}. ${question}`).join('\n')}`
    : previousQuestionIds?.length > 0
      ? 'Genera preguntas diferentes a las anteriores.'
    : ''

  const pedagogyNote = typeof pedagogyContext === 'string' && pedagogyContext.trim().length > 0
    ? `\nPREFERENCIAS PEDAGOGICAS DEL DOCENTE:\n${pedagogyContext}`
    : ''

  try {
    const collectedQuestions = []

    if (mode === 'mixto') {
      const teoricoCount = Math.ceil(questionCount / 2)
      const practicoCount = Math.floor(questionCount / 2)
      let teoricoCollected: any[] = []
      let practicoCollected: any[] = []

      for (let attempt = 0; attempt < 3 && (teoricoCollected.length < teoricoCount || practicoCollected.length < practicoCount); attempt++) {
        if (teoricoCollected.length < teoricoCount) {
          const teoricoBatch = await generateQuizBatch({
            subject,
            curriculum,
            modeDescription: 'MODO TEÓRICO: Preguntas conceptuales sobre definiciones, teoremas y propiedades. Sin cálculos numéricos complejos.',
            topicsText,
            questionCount: teoricoCount,
            previousNote,
            pedagogyNote,
            specialistRole,
          })

          for (const question of teoricoBatch) {
            const fingerprint = normalizeQuestionText(question.question)
            if (!fingerprint || previousQuestionFingerprints.has(fingerprint)) continue
            previousQuestionFingerprints.add(fingerprint)
            teoricoCollected.push(question)
            if (teoricoCollected.length === teoricoCount) break
          }
        }

        if (practicoCollected.length < practicoCount) {
          const practicoBatch = await generateQuizBatch({
            subject,
            curriculum,
            modeDescription: 'MODO PRÁCTICO: Ejercicios de cálculo y resolución de problemas numéricos.',
            topicsText,
            questionCount: practicoCount,
            previousNote,
            pedagogyNote,
            specialistRole,
          })

          for (const question of practicoBatch) {
            const fingerprint = normalizeQuestionText(question.question)
            if (!fingerprint || previousQuestionFingerprints.has(fingerprint)) continue
            previousQuestionFingerprints.add(fingerprint)
            practicoCollected.push(question)
            if (practicoCollected.length === practicoCount) break
          }
        }
      }

      if (teoricoCollected.length < teoricoCount || practicoCollected.length < practicoCount) {
        return Response.json({
          questions: [],
          error: 'No se pudo generar un cuestionario mixto con suficiente variedad. Intenta otra vez.'
        }, { status: 409 })
      }

      const mixedQuestions = interleaveQuestions(teoricoCollected, practicoCollected, questionCount)

      const shuffledMixedQuestions = mixedQuestions.map((q) => {
        const optionsWithIndex = q.options.map((text: string, index: number) => ({ text, index }))
        shuffleInPlace(optionsWithIndex)

        const newOptions = optionsWithIndex.map((o: { text: string }) => o.text)
        const newCorrectAnswer = optionsWithIndex.findIndex((o: { index: number }) => o.index === q.correctAnswer)

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrectAnswer
        }
      })

      return Response.json({ questions: shuffledMixedQuestions })
    }

    for (let attempt = 0; attempt < 3 && collectedQuestions.length < questionCount; attempt++) {
      const generatedQuestions = await generateQuizBatch({
        subject,
        curriculum,
        modeDescription,
        topicsText,
        questionCount,
        previousNote,
        pedagogyNote,
        specialistRole,
      })

      console.log('[generateObject] Success! Questions:', generatedQuestions.length)

      for (const question of generatedQuestions) {
        const fingerprint = normalizeQuestionText(question.question)

        if (!fingerprint || previousQuestionFingerprints.has(fingerprint)) {
          continue
        }

        previousQuestionFingerprints.add(fingerprint)
        collectedQuestions.push(question)

        if (collectedQuestions.length === questionCount) {
          break
        }
      }
    }

    if (collectedQuestions.length < questionCount) {
      return Response.json({
        questions: [],
        error: 'No se pudo generar un nuevo cuestionario completamente distinto. Intenta otra vez.'
      }, { status: 409 })
    }

    const shuffledQuestions = collectedQuestions.map((q) => {
      const optionsWithIndex = q.options.map((text, index) => ({ text, index }))
      shuffleInPlace(optionsWithIndex)

      const newOptions = optionsWithIndex.map((o) => o.text)
      const newCorrectAnswer = optionsWithIndex.findIndex(
        (o) => o.index === q.correctAnswer
      )

      return {
        ...q,
        options: newOptions,
        correctAnswer: newCorrectAnswer
      }
    })

    return Response.json({ questions: shuffledQuestions })
  } catch (error: any) {
    console.error('[POST] Final error:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause,
      stack: error?.stack?.substring(0, 500)
    })

    const fallbackQuestions = buildLocalFallbackQuestions({
      subject,
      topics,
      mode,
      questionCount,
    })

    console.warn('[POST] Returning local fallback questions:', fallbackQuestions.length)

    return Response.json({
      questions: fallbackQuestions,
      warning: 'Se uso un generador local de respaldo por un problema temporal con IA.',
      error: error?.message || 'Error interno al generar el quiz'
    })
  }
}
