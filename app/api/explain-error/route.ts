import { generateText } from 'ai'

export async function POST(req: Request) {
  const { question, selectedAnswer, correctAnswer, options, topic } = await req.json()
  
  const { text } = await generateText({
    model: 'google/gemini-2.0-flash',
    messages: [
      {
        role: 'user',
        content: `Eres un tutor de matematicas universitarias paciente y didactico. Un estudiante respondio incorrectamente la siguiente pregunta:

TEMA: ${topic}

PREGUNTA:
${question}

OPCIONES:
${options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

RESPUESTA DEL ESTUDIANTE: ${String.fromCharCode(65 + selectedAnswer)}) ${options[selectedAnswer]}
RESPUESTA CORRECTA: ${String.fromCharCode(65 + correctAnswer)}) ${options[correctAnswer]}

Explica paso a paso:
1. Por que la respuesta elegida por el estudiante es INCORRECTA (identifica el error conceptual o de calculo)
2. Como se resuelve correctamente el problema, mostrando cada paso
3. Por que la respuesta correcta ES la correcta
4. Un tip o consejo para evitar este error en el futuro

Usa notacion LaTeX para las formulas matematicas (ej: $x^2$, $\\frac{a}{b}$).
Se claro, conciso y didactico. El estudiante debe entender su error y como corregirlo.`
      }
    ],
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  return Response.json({ explanation: text })
}
