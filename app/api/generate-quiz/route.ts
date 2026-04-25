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
    
    // Funcion para sanitizar JSON con LaTeX
    function sanitizeJsonWithLatex(jsonStr: string): string {
      let result = jsonStr
      
      // Remover code blocks de markdown
      result = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
      result = result.trim()
      
      // Escapar backslashes dentro de strings JSON para LaTeX
      // Esto maneja \frac, \sqrt, \int, etc que no son escapes JSON validos
      const latexEscapes = ['frac', 'sqrt', 'int', 'sum', 'prod', 'lim', 'infty', 'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'pi', 'sigma', 'omega', 'cdot', 'times', 'div', 'pm', 'mp', 'leq', 'geq', 'neq', 'approx', 'equiv', 'subset', 'supset', 'cup', 'cap', 'in', 'notin', 'forall', 'exists', 'neg', 'land', 'lor', 'to', 'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'partial', 'nabla', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'binom', 'text', 'mathbb', 'mathbf', 'mathrm', 'left', 'right', 'begin', 'end']
      
      for (const cmd of latexEscapes) {
        // Reemplazar \cmd con \\cmd (escapar el backslash)
        const regex = new RegExp(`\\\\${cmd}(?![a-zA-Z])`, 'g')
        result = result.replace(regex, `\\\\${cmd}`)
      }
      
      // Manejar escapes JSON especiales que podrian confundirse
      // \n, \t, \r, \f, \b dentro de strings LaTeX
      result = result.replace(/\\n(?![a-zA-Z])/g, (match, offset) => {
        // Verificar si estamos dentro de un string JSON (despues de : ")
        const before = result.substring(Math.max(0, offset - 20), offset)
        if (before.includes('"') && !before.includes('correctAnswer')) {
          return '\\\\n'
        }
        return match
      })
      
      return result
    }
    
    // Parsear el JSON de la respuesta
    let questions = []
    try {
      const jsonText = sanitizeJsonWithLatex(text || '')
      const parsed = JSON.parse(jsonText)
      questions = parsed.questions || []
      console.log('[v0] Parsed questions:', questions.length)
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError)
      
      // Intento alternativo: usar eval con JSON5-like parsing
      try {
        let cleanText = text || ''
        cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        
        // Extraer el array de questions usando un enfoque mas simple
        const startIdx = cleanText.indexOf('"questions"')
        if (startIdx !== -1) {
          const arrayStart = cleanText.indexOf('[', startIdx)
          if (arrayStart !== -1) {
            let depth = 0
            let arrayEnd = arrayStart
            for (let i = arrayStart; i < cleanText.length; i++) {
              if (cleanText[i] === '[') depth++
              if (cleanText[i] === ']') depth--
              if (depth === 0) {
                arrayEnd = i
                break
              }
            }
            
            const questionsArray = cleanText.substring(arrayStart, arrayEnd + 1)
            // Sanitizar y parsear
            const sanitized = sanitizeJsonWithLatex(questionsArray)
            questions = JSON.parse(sanitized)
            console.log('[v0] Recovered questions via extraction:', questions.length)
          }
        }
      } catch (recoveryError) {
        console.error('[v0] Recovery failed:', recoveryError)
        
        // Ultimo recurso: generar preguntas de fallback
        questions = [{
          id: 'fallback-1',
          topic: 'general',
          topicName: 'General',
          question: 'Error al generar preguntas. Por favor, intenta nuevamente.',
          options: ['Reintentar', 'Volver al inicio', 'Contactar soporte', 'Reportar error'],
          correctAnswer: 0,
          explanation: 'Hubo un problema de comunicacion con el servidor de IA.'
        }]
      }
    }
    
    return Response.json({ questions })
  } catch (error) {
    console.error('[v0] Error generating quiz:', error)
    return Response.json({ questions: [], error: String(error) }, { status: 500 })
  }
}
