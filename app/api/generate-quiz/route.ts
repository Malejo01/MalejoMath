import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

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
      model: google('gemini-1.5-flash'),
      schema: quizSchema,
      system: `Eres un generador de exámenes universitarios de matemáticas. Devuelves preguntas de opción múltiple en formato estructurado.

REGLAS CRÍTICAS PARA LaTeX:
- Usa notación LaTeX para TODAS las fórmulas matemáticas.
- Usa delimitadores $...$ para fórmulas inline.
- Usa doble backslash para comandos LaTeX: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\int, \\\\sum, \\\\lim, \\\\infty, etc.
- Esto es OBLIGATORIO: cada comando LaTeX debe llevar doble backslash (\\\\) para que el JSON sea válido.
- Ejemplo correcto: "$\\\\frac{1}{2} + \\\\sqrt{3}$"
- Ejemplo incorrecto: "$\\frac{1}{2} + \\sqrt{3}$"`,
      prompt: `Genera ${questionCount} preguntas de opción múltiple para un examen universitario.

${curriculum}

${modeDescription}

MATERIA: ${subject}
TEMAS: 
${topicsText}

${previousNote}

REGLAS:
- Cada pregunta tiene 4-6 opciones
- correctAnswer es el índice (0-based) de la opción correcta
- Distribuye las preguntas entre los temas seleccionados
- El campo "id" debe ser "q1", "q2", etc.
- El campo "topic" debe coincidir con el id del tema
- El campo "topicName" debe ser el nombre legible del tema`,
      maxOutputTokens: 8000,
      temperature: 0.8,
    })

    console.log('[generateObject] Parsed questions:', object.questions.length)

    return Response.json({ questions: object.questions })
  } catch (error) {
    console.error('[generateObject] Error generating quiz:', error)
    return Response.json({ questions: [], error: String(error) }, { status: 500 })
  }
}
