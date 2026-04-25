import { generateText, Output } from 'ai'
import { z } from 'zod'

const questionSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    topic: z.string(),
    topicName: z.string(),
    question: z.string(),
    options: z.array(z.string()).min(4).max(6),
    correctAnswer: z.number(),
    explanation: z.string(),
  }))
})

export async function POST(req: Request) {
  const { subject, topics, mode, previousQuestionIds } = await req.json()
  
  const questionCount = mode === 'teorico' ? 20 : 10
  const topicsText = topics.map((t: { id: string; name: string }) => `- ${t.name} (id: ${t.id})`).join('\n')
  
  const modeDescription = mode === 'teorico' 
    ? 'Enfocate en conceptos teoricos, definiciones, propiedades y demostraciones. Las preguntas deben evaluar la comprension conceptual profunda.'
    : 'Enfocate en ejercicios practicos y problemas de calculo. Las preguntas deben requerir aplicar formulas y resolver problemas numericos.'

  const previousIdsNote = previousQuestionIds?.length > 0 
    ? `\n\nIMPORTANTE: Las siguientes preguntas ya fueron usadas anteriormente, genera preguntas DIFERENTES:\n${previousQuestionIds.join(', ')}`
    : ''

  const { output } = await generateText({
    model: 'google/gemini-2.0-flash',
    output: Output.object({
      schema: questionSchema,
    }),
    messages: [
      {
        role: 'user',
        content: `Eres un profesor universitario experto en ${subject}. Genera exactamente ${questionCount} preguntas de opcion multiple para un cuestionario universitario.

MATERIA: ${subject}
MODO: ${mode === 'teorico' ? 'TEORICO' : 'PRACTICO'}
${modeDescription}

TEMAS A EVALUAR:
${topicsText}
${previousIdsNote}

INSTRUCCIONES:
1. Cada pregunta debe tener entre 4 y 6 opciones de respuesta
2. Solo UNA opcion es correcta (correctAnswer es el indice 0-based)
3. Usa notacion LaTeX para formulas matematicas (ej: $x^2$, $\\frac{a}{b}$, $\\int_0^1$)
4. La explicacion debe ser concisa (2-3 oraciones) explicando POR QUE la respuesta correcta es correcta
5. Las opciones incorrectas deben ser plausibles (errores comunes de estudiantes)
6. Distribuye las preguntas equitativamente entre los temas seleccionados
7. Varia la dificultad: algunas faciles, medias y dificiles
8. Genera IDs unicos para cada pregunta (ej: "q-algebra-1", "q-limites-2")

Genera las ${questionCount} preguntas en formato JSON.`
      }
    ],
    maxOutputTokens: 8000,
    temperature: 0.8,
  })

  return Response.json({ questions: output?.questions || [] })
}
