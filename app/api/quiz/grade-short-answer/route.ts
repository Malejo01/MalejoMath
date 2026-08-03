import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { getEducationContext } from '@/lib/education-context'
import { guardAiCall } from '@/lib/ai-guard'
import { captureAiSchemaFailure } from '@/lib/observability'

const gradeSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string(),
})

export async function POST(req: Request) {
  const { question, acceptedAnswers, studentAnswer, nivel, grado } = await req.json()

  if (typeof question !== 'string' || !Array.isArray(acceptedAnswers) || typeof studentAnswer !== 'string') {
    return Response.json({ error: 'Parametros invalidos' }, { status: 400 })
  }

  const guard = await guardAiCall({ bucket: 'grading', nivel })
  if (!guard.ok) return guard.response

  const eduCtx = getEducationContext(nivel, grado, 'la materia')

  try {
    const { object, usage } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: gradeSchema,
      schemaName: 'shortAnswerGrade',
      schemaDescription: 'Evaluacion de una respuesta corta de un estudiante: si es correcta y un feedback breve.',
      system: `${eduCtx.rolDocente}.
Tu tarea es corregir la respuesta de un estudiante a una pregunta de respuesta corta.
Se flexible con errores de tipeo, orden de palabras o sinónimos — evalúa el CONTENIDO conceptual, no la redacción exacta.
${eduCtx.registroLinguistico}`,
      prompt: `PREGUNTA: ${question}

RESPUESTAS ACEPTADAS (referencia, el estudiante no tiene que igualarlas textualmente): ${acceptedAnswers.join(' / ')}

RESPUESTA DEL ESTUDIANTE: "${studentAnswer}"

Indica si la respuesta del estudiante es conceptualmente correcta (isCorrect) y da un feedback breve (1-2 frases), cálido, en el tono de ${eduCtx.instruccionesExplicacion.slice(0, 200)}.`,
      temperature: 0.2,
      maxOutputTokens: 500,
    })

    await guard.finish(usage)
    return Response.json(object)
  } catch (error) {
    await guard.fail()
    // Sin fallback: si la IA no corrige, el alumno se queda sin nota en esa
    // pregunta. Es el que más directo impacta en lo que ve un estudiante.
    captureAiSchemaFailure(error, {
      endpoint: '/api/quiz/grade-short-answer',
      fallback: 'none',
      nivel,
    })
    console.error('[grade-short-answer] Error:', error)
    return Response.json(
      { error: 'No se pudo corregir la respuesta', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
