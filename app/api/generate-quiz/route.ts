import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Schema Zod — obliga a Gemini a devolver un objeto válido
const quizSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    topic: z.string(),
    topicName: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string()
  }))
})

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

export async function POST(req: Request) {
  const { subject, topics, mode, previousQuestionIds } = await req.json()

  const questionCount = mode === 'teorico' ? 20 : 10
  const topicsText = topics.map((t: { id: string; name: string }) => `- ${t.name}`).join('\n')

  // Seleccionar el curriculum apropiado
  let curriculum = ALGEBRA_CURRICULUM
  if (subject.toLowerCase().includes('análisis') || subject.toLowerCase().includes('analisis')) {
    curriculum = ANALISIS_CURRICULUM
  } else if (subject.toLowerCase().includes('probabilidad') || subject.toLowerCase().includes('estadística')) {
    curriculum = PROBABILIDAD_CURRICULUM
  }

  const modeDescription = mode === 'teorico'
    ? 'MODO TEÓRICO: Preguntas conceptuales sobre definiciones, teoremas y propiedades. Sin cálculos numéricos complejos.'
    : 'MODO PRÁCTICO: Ejercicios de cálculo y resolución de problemas numéricos.'

  const previousNote = previousQuestionIds?.length > 0
    ? 'Genera preguntas diferentes a las anteriores.'
    : ''

  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: quizSchema,
      system: `Eres un generador de exámenes universitarios de matemáticas. Devuelves preguntas de opción múltiple en formato JSON puro.

REGLAS DE ORO PARA LaTeX:
- Usa delimitadores $...$ para TODO el contenido matemático.
- OBLIGATORIO: Usa DOBLE backslash (\\\\) en todos los comandos LaTeX.
- Ejemplo: "$\\\\frac{x^2}{\\\\sqrt{y}}$"

EJEMPLO DE FORMATO REQUERIDO:
{
  "questions": [
    {
      "id": "q1",
      "topic": "gauss",
      "topicName": "Método de Gauss",
      "question": "¿Cuál es el valor de $\\\\alpha$?",
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "correctAnswer": 0,
      "explanation": "Porque $\\\\alpha$ es constante."
    }
  ]
}`,
      prompt: `Genera ${questionCount} preguntas de opción múltiple para un examen universitario de ${subject}.

CURRICULUM:
${curriculum}

CONTEXTO:
${modeDescription}

TEMAS A EVALUAR: 
${topicsText}

${previousNote}

REQUISITOS:
- Cada pregunta debe tener entre 4 y 6 opciones.
- 'correctAnswer' es el índice numérico (0, 1, 2...).
- Usa el curriculum para asegurar que el nivel es universitario.
- Distribuye las preguntas equitativamente entre los temas proporcionados.`,
      maxOutputTokens: 8000,
      temperature: 0.7,
    })

    console.log('[generateObject] Success! Parsed questions:', object.questions.length)

    return Response.json({ questions: object.questions })
  } catch (error: any) {
    console.error('[generateObject] DETAILED ERROR:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
      stack: error.stack,
      data: error.data // Algunos proveedores incluyen datos extras aqui
    })
    return Response.json({ 
      questions: [], 
      error: error.message || 'Error interno al generar el quiz'
    }, { status: 500 })
  }
}
