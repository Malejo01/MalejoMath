import { generateObject, generateText, type RepairTextFunction } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { buildEducationSystemPrompt } from '@/lib/education-context'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

const singleQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string(),
})

const repairJson: RepairTextFunction = async ({ text }) => {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

export async function POST(req: Request) {
  try {
    const {
      question: originalQuestion,
      selectedAnswer,
      correctAnswer,
      options,
      topic,
      topicName,
      subject,
      nivel,
      grado,
      misconceptionText,
    } = await req.json()

    const educationPrompt = buildEducationSystemPrompt({
      nivel,
      grado,
      materia: subject || 'la materia',
      difficulty: 'intermedio',
    })

    const selectedText = Array.isArray(options) && selectedAnswer !== undefined ? options[selectedAnswer] : ''
    const correctText = Array.isArray(options) && correctAnswer !== undefined ? options[correctAnswer] : ''

    const systemPrompt = `${educationPrompt}

MODO REVANCHA (DESAFÍO ÚNICO E INMEDIATO):
Tu tarea es generar EXACTAMENTE 1 pregunta de revancha sobre el tema "${topicName || subject}".

CONTEXTO DE LA CONFUSIÓN PREVIA DEL ESTUDIANTE:
- Pregunta anterior: "${originalQuestion || ''}"
- Opción que eligió por error: "${selectedText}"
- Respuesta correcta: "${correctText}"
${misconceptionText ? `- Diagnóstico de la duda: ${misconceptionText}` : ''}

OBJETIVO PEDAGÓGICO:
1. Diseña la nueva pregunta sobre el MISMO concepto pedagógico pero AMBIENTADA EN UN ESCENARIO COMPLETAMENTE DISTINTO (ej: cambiar los objetos, la historia o la situación práctica).
2. La pregunta debe verificar de forma directa si el estudiante superó esa confusión específica.
3. Responde SOLO con un objeto JSON válido con las claves: "question", "options" (exactamente 4 opciones), "correctAnswer" (índice 0-3), "explanation" (explicación breve, cálida y festiva).`

    const userPrompt = `Genera 1 pregunta de revancha para ${subject || 'la materia'} - Tema: ${topicName || topic || 'General'}.`

    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: singleQuestionSchema,
        schemaName: 'revanchaQuestion',
        schemaDescription: 'Una única pregunta de revancha con question, options (4), correctAnswer (0-based) y explanation.',
        experimental_repairText: repairJson,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2000,
        temperature: 0.4,
      })

      return Response.json({
        question: {
          id: `revancha-${Date.now()}`,
          topic: topic || 'revancha',
          topicName: topicName || subject || 'Revancha',
          question: object.question,
          options: object.options,
          correctAnswer: object.correctAnswer,
          explanation: object.explanation,
        }
      })
    } catch (primaryErr) {
      console.warn('[revancha] Primary parse failed, using generateText fallback:', primaryErr)
      const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2000,
        temperature: 0.3,
      })

      const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No se pudo estructurar la pregunta de revancha.')

      const parsed = JSON.parse(match[0])
      return Response.json({
        question: {
          id: `revancha-${Date.now()}`,
          topic: topic || 'revancha',
          topicName: topicName || subject || 'Revancha',
          question: parsed.question,
          options: parsed.options,
          correctAnswer: Number(parsed.correctAnswer),
          explanation: parsed.explanation,
        }
      })
    }
  } catch (error: any) {
    console.error('[POST /api/quiz/revancha] Error:', error)
    return Response.json({ error: error?.message || 'Error al generar pregunta de revancha' }, { status: 500 })
  }
}
