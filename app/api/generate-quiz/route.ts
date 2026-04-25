import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

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
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Genera ${questionCount} preguntas de opción múltiple para un examen universitario.

${curriculum}

${modeDescription}

MATERIA: ${subject}
TEMAS: 
${topicsText}

${previousNote}

FORMATO JSON REQUERIDO:
{
  "questions": [
    {
      "id": "q1",
      "topic": "tema_id",
      "topicName": "Nombre del Tema",
      "question": "Texto de la pregunta con LaTeX si es necesario usando $formula$",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": 0,
      "explanation": "Explicación breve de por qué es correcta"
    }
  ]
}

REGLAS:
- Cada pregunta tiene 4-6 opciones
- correctAnswer es el índice (0-based) de la opción correcta
- Usa LaTeX para fórmulas: $x^2$, $\\frac{a}{b}$
- Distribuye las preguntas entre los temas seleccionados

Responde SOLO con el JSON, sin texto adicional.`,
      maxOutputTokens: 8000,
      temperature: 0.8,
    })

    console.log('[v0] Raw response length:', text?.length || 0)
    
    // Parsear el JSON de la respuesta
    let questions = []
    try {
      // Limpiar la respuesta - puede venir con markdown code blocks
      let jsonText = text || ''
      
      // Remover code blocks si existen
      if (jsonText.includes('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.replace(/```\n?/g, '')
      }
      
      jsonText = jsonText.trim()
      
      // Sanitizar caracteres de escape problematicos en LaTeX
      // Gemini a veces genera \frac como escape sequence invalido
      jsonText = jsonText
        .replace(/\\f(?!alse)/g, '\\\\f')  // \f -> \\f (except \false)
        .replace(/\\n(?!ull)/g, '\\\\n')   // \n -> \\n (except \null) pero solo fuera de strings reales
        .replace(/\\t(?!rue)/g, '\\\\t')   // \t -> \\t (except \true)
        .replace(/\\r/g, '\\\\r')          // \r -> \\r
        .replace(/\\b(?!ase)/g, '\\\\b')   // \b -> \\b (except \base)
      
      const parsed = JSON.parse(jsonText)
      questions = parsed.questions || []
      console.log('[v0] Parsed questions:', questions.length)
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError)
      console.error('[v0] Raw text:', text?.substring(0, 500))
      
      // Intento alternativo: extraer preguntas manualmente con regex
      try {
        const questionsMatch = text?.match(/"questions"\s*:\s*\[([\s\S]*)\]/)?.[1]
        if (questionsMatch) {
          // Intentar parsear objeto por objeto
          const objectMatches = questionsMatch.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
          if (objectMatches) {
            questions = objectMatches.map((obj, index) => {
              try {
                return JSON.parse(obj.replace(/\\f/g, '\\\\f').replace(/\\n/g, '\\\\n'))
              } catch {
                return {
                  id: `q${index + 1}`,
                  topic: 'general',
                  topicName: 'General',
                  question: 'Error al parsear pregunta',
                  options: ['A', 'B', 'C', 'D'],
                  correctAnswer: 0,
                  explanation: 'Error de formato'
                }
              }
            }).filter(q => q.question !== 'Error al parsear pregunta')
            console.log('[v0] Recovered questions via regex:', questions.length)
          }
        }
      } catch (regexError) {
        console.error('[v0] Regex recovery failed:', regexError)
      }
    }
    
    return Response.json({ questions })
  } catch (error) {
    console.error('[v0] Error generating quiz:', error)
    return Response.json({ questions: [], error: String(error) }, { status: 500 })
  }
}
