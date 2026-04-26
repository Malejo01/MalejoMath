import { generateObject, type RepairTextFunction } from 'ai'
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

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const repairQuizJson: RepairTextFunction = async ({ text }) => {
  const withoutFences = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const match = withoutFences.match(/\{[\s\S]*\}/)
  if (!match) return null

  const candidate = match[0].replace(/,\s*([}\]])/g, '$1')
  const escaped = candidate.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')

  return escaped
}

export async function POST(req: Request) {
  const { subject, topics, mode, previousQuestionIds } = await req.json()

  const questionCount = 10
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
      model: google('gemini-2.5-flash'), // Volvemos al modelo compatible con tu API
      schema: quizSchema,
      schemaName: 'quizQuestions',
      schemaDescription: 'Objeto JSON con exactamente 10 preguntas, cada una con opciones y correctAnswer 0-based.',
      experimental_repairText: repairQuizJson,
      system: `Eres un experto generador de exámenes matemáticos universitarios. 
    Tu única tarea es generar un objeto JSON que contenga un array de preguntas.

    REQUISITOS DEL CUESTIONARIO:
    - Genera exactamente 10 preguntas, sin importar el modo.

    FORMATO ESTRICTO:
    - Responde solo con JSON válido (sin markdown, sin comentarios).
    - Escapa los backslashes en LaTeX usando \\ dentro de strings JSON.

REGLAS DE ORO PARA MATEMÁTICAS (LaTeX):
    - Usa símbolos matemáticos estándar: ^ para potencias, \\wedge para conjunción (y), \\vee para disyunción (o).
- TODO el contenido matemático (variables p, q, x, fórmulas, símbolos) debe ir OBLIGATORIAMENTE entre símbolos $.
    - Ejemplo: "$p \\wedge q$", "$x^2$", "$\\frac{a}{b}$".
    - EVITA comandos de texto como \\textasciicircum. Usa el símbolo directo o el comando matemático.
- No incluyas texto explicativo fuera del JSON.`,
      prompt: `Genera ${questionCount} preguntas de opción múltiple de nivel universitario para la materia ${subject}.

CURRICULUM DE REFERENCIA:
${curriculum}

MODO DE EXAMEN:
${modeDescription}

TEMAS ESPECÍFICOS A CUBRIR: 
${topicsText}

ENFOQUE DE CALIDAD:
- Como son solo ${questionCount} preguntas, prioriza la calidad, claridad y variedad.
- Maximiza la cobertura de subtemas seleccionados y evita repeticiones.
- Mantén las explicaciones concisas (2-4 frases) para evitar respuestas demasiado largas.

REQUISITOS ADICIONALES:
${previousNote}
- 4-6 opciones por pregunta.
- 'correctAnswer' es el índice 0-based.
- La explicación debe ser clara y detallada.`,
      maxOutputTokens: 8000,
      temperature: 0.5, // Menor temperatura para mas consistencia en el formato
    })

    console.log('[generateObject] Success! Questions:', object.questions.length)
    const shuffledQuestions = object.questions.map((q) => {
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
    console.error('[generateObject] ERROR:', error.message)
    return Response.json({ 
      questions: [], 
      error: error.message || 'Error interno al generar el quiz'
    }, { status: 500 })
  }
}
