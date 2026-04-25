import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  const { question, selectedAnswer, correctAnswer, options, topic, subject } = await req.json()
  
  // Contexto especifico segun la materia
  let subjectContext = ''
  if (subject?.toLowerCase().includes('álgebra') || subject?.toLowerCase().includes('algebra')) {
    subjectContext = `
CONTEXTO DEL PROGRAMA DE ÁLGEBRA I:
- Para sistemas de ecuaciones, el método estándar es Gauss (escalonamiento)
- El Teorema de Rouché-Frobenius se usa para clasificar sistemas
- Los métodos de demostración incluyen: Directo, Indirecto, Contraejemplo, Inducción
- Para números complejos, considera forma binómica y operaciones
`
  } else if (subject?.toLowerCase().includes('análisis') || subject?.toLowerCase().includes('analisis')) {
    subjectContext = `
CONTEXTO DEL PROGRAMA DE ANÁLISIS MATEMÁTICO I:
- Los límites se calculan usando propiedades, límites notables o L'Hôpital cuando aplique
- Las derivadas siguen las reglas estándar: suma, producto, cociente, cadena
- Para integrales, considera los métodos de sustitución, partes o fracciones parciales
`
  }
  
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    messages: [
      {
        role: 'user',
        content: `Eres un tutor de matemáticas universitarias de primer año, paciente y didáctico. Un estudiante respondió incorrectamente la siguiente pregunta:
${subjectContext}
TEMA: ${topic}
MATERIA: ${subject || 'Matemáticas'}

PREGUNTA:
${question}

OPCIONES:
${options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

RESPUESTA DEL ESTUDIANTE: ${String.fromCharCode(65 + selectedAnswer)}) ${options[selectedAnswer]}
RESPUESTA CORRECTA: ${String.fromCharCode(65 + correctAnswer)}) ${options[correctAnswer]}

Explica de forma estructurada y clara:

## 1. ¿Dónde está el error?
Identifica el error conceptual o de cálculo que cometió el estudiante al elegir su respuesta.

## 2. Resolución paso a paso
Muestra cómo se resuelve correctamente el problema, detallando cada paso con claridad.

## 3. ¿Por qué es correcta?
Explica brevemente por qué la respuesta correcta es la única válida.

## 4. Consejo para recordar
Da un tip práctico o regla mnemotécnica para no cometer este error en el futuro.

IMPORTANTE:
- Usa notación LaTeX para TODAS las fórmulas matemáticas (ej: $x^2$, $\\frac{a}{b}$, $\\int f(x)dx$)
- Sé claro y conciso, como un buen profesor que explica a un estudiante confundido
- No seas condescendiente, el estudiante está aprendiendo`
      }
    ],
    maxOutputTokens: 2500,
    temperature: 0.7,
  })

  return Response.json({ explanation: text })
}
