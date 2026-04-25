import { generateText, Output } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

// Curriculum oficial inyectado en el contexto de Gemini
const ALGEBRA_CURRICULUM = `
PROGRAMA OFICIAL DE ÁLGEBRA I:

Unidad I: Lógica Proposicional
- Proposición, Conectivos lógicos (conjunción, disyunción, negación, implicación, bicondicional)
- Tablas de verdad, Tautologías, Contradicciones, Contingencias
- Leyes lógicas fundamentales (De Morgan, Conmutativas, Asociativas, Distributivas)
- Formas proposicionales, Cuantificadores universales y existenciales
- Conjunto de verdad de una proposición abierta
- Métodos de demostración: Directo, Indirecto (Contradicción), Contrarecíproco, Contraejemplo, Inducción Completa

Unidad II: Ecuaciones e Inecuaciones
- Ecuaciones polinómicas de grado 1 y 2, Fórmula cuadrática, Discriminante
- Números complejos: forma binómica, conjugado, módulo, operaciones
- Ecuaciones racionales con parámetros
- Ecuaciones con radicales y valor absoluto
- Ecuaciones exponenciales y logarítmicas (propiedades de logaritmos)
- Inecuaciones polinómicas (método de signos)
- Inecuaciones racionales, con radicales y valor absoluto

Unidad III: Matrices y Sistemas de Ecuaciones Lineales
- Operaciones con matrices: suma, producto por escalar, producto matricial
- Propiedades del álgebra de matrices
- Matrices cuadradas especiales: identidad, diagonal, triangular, simétrica
- Matriz inversa: definición, cálculo, propiedades
- Determinantes: definición, propiedades, cálculo por cofactores
- Sistemas de ecuaciones lineales: clasificación (compatible determinado/indeterminado, incompatible)
- Método de Gauss (escalonamiento) - ESTÁNDAR DE LA CÁTEDRA
- Teorema de Rouché-Frobenius: rango de matriz, rango de matriz ampliada
- Regla de Cramer (solo para sistemas con solución única)

Unidad IV: Análisis Combinatorio y Vectores
- Sumatoria: propiedades, fórmulas de sumas notables
- Productorio y Factorial
- Números combinatorios: definición, propiedades, Triángulo de Pascal
- Binomio de Newton: desarrollo, término general
- Permutaciones (con y sin repetición)
- Variaciones (con y sin repetición)
- Combinaciones
- Vectores en R2 y R3: definición, componentes, representación gráfica
- Operaciones con vectores: suma, resta, producto por escalar
- Producto escalar (punto): definición, propiedades, ángulo entre vectores
- Producto vectorial (en R3): definición, propiedades
`

const ANALISIS_CURRICULUM = `
PROGRAMA OFICIAL DE ANÁLISIS MATEMÁTICO I:

Unidad I: Límites y Continuidad
- Concepto intuitivo y formal de límite (epsilon-delta)
- Propiedades de los límites
- Límites laterales
- Límites infinitos y al infinito
- Asíntotas horizontales y verticales
- Límites notables: lim(sin(x)/x), lim((1+1/x)^x)
- Continuidad: definición, tipos de discontinuidad
- Teoremas sobre funciones continuas (Bolzano, Weierstrass)

Unidad II: Derivadas
- Definición de derivada como límite
- Interpretación geométrica: recta tangente
- Reglas de derivación: suma, producto, cociente
- Derivada de funciones compuestas (regla de la cadena)
- Derivadas de funciones elementales (polinómicas, trigonométricas, exponenciales, logarítmicas)
- Derivadas de orden superior
- Aplicaciones: máximos y mínimos, puntos de inflexión, concavidad
- Teorema de Rolle y del Valor Medio
- Regla de L'Hôpital

Unidad III: Integrales
- Integral indefinida: primitiva, constante de integración
- Propiedades de la integral indefinida
- Métodos de integración: sustitución, partes, fracciones parciales
- Integral definida: definición de Riemann
- Teorema Fundamental del Cálculo
- Cálculo de áreas y volúmenes
- Integrales impropias

Unidad IV: Series y Sucesiones
- Sucesiones numéricas: definición, convergencia
- Series numéricas: definición, suma parcial
- Criterios de convergencia: comparación, razón, raíz
- Series alternadas, convergencia absoluta y condicional
- Series de potencias: radio e intervalo de convergencia
- Series de Taylor y Maclaurin
`

const PROBABILIDAD_CURRICULUM = `
PROGRAMA OFICIAL DE PROBABILIDAD Y ESTADÍSTICA:

Unidad I: Estadística Descriptiva
- Población y muestra
- Variables estadísticas: cualitativas y cuantitativas
- Medidas de tendencia central: media, mediana, moda
- Medidas de dispersión: varianza, desviación estándar, coeficiente de variación
- Medidas de posición: cuartiles, percentiles
- Representaciones gráficas: histogramas, polígonos de frecuencia, diagramas de caja

Unidad II: Probabilidad
- Experimento aleatorio, espacio muestral, eventos
- Técnicas de conteo: principio de multiplicación
- Permutaciones y combinaciones
- Definición clásica de probabilidad
- Axiomas de Kolmogorov
- Probabilidad condicional
- Teorema de Bayes
- Eventos independientes

Unidad III: Variables Aleatorias
- Variable aleatoria discreta: función de probabilidad
- Esperanza y varianza de v.a. discretas
- Distribuciones discretas: Bernoulli, Binomial, Poisson
- Variable aleatoria continua: función de densidad
- Esperanza y varianza de v.a. continuas
- Distribución Normal: propiedades, estandarización, tabla Z
- Distribución Exponencial y Uniforme

Unidad IV: Inferencia Estadística
- Distribuciones muestrales
- Estimación puntual: propiedades de estimadores
- Intervalos de confianza para media y proporción
- Pruebas de hipótesis: conceptos fundamentales
- Test de hipótesis para media y proporción
- Errores tipo I y II, nivel de significancia, p-valor
- Regresión lineal simple: modelo, estimación por mínimos cuadrados
- Coeficiente de correlación de Pearson
`

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
  
  // Seleccionar el curriculum apropiado
  let curriculum = ALGEBRA_CURRICULUM
  if (subject.toLowerCase().includes('análisis') || subject.toLowerCase().includes('analisis')) {
    curriculum = ANALISIS_CURRICULUM
  } else if (subject.toLowerCase().includes('probabilidad') || subject.toLowerCase().includes('estadística')) {
    curriculum = PROBABILIDAD_CURRICULUM
  }
  
  const modeDescription = mode === 'teorico' 
    ? `MODO TEÓRICO: Enfócate en conceptos teóricos, definiciones formales, propiedades, teoremas y demostraciones. 
       Las preguntas deben evaluar la comprensión conceptual profunda, no cálculos numéricos.
       Ejemplos: "¿Cuál es la definición de...?", "¿Qué propiedad establece que...?", "¿Cuál de las siguientes afirmaciones es verdadera?"`
    : `MODO PRÁCTICO: Enfócate en ejercicios prácticos y problemas de cálculo que requieran aplicar fórmulas y resolver problemas numéricos.
       Los ejercicios deben ser de dificultad universitaria de primer año.
       Ejemplos: "Resuelve la ecuación...", "Calcula el determinante de...", "Encuentra la derivada de..."`

  const previousIdsNote = previousQuestionIds?.length > 0 
    ? `\n\nIMPORTANTE: Las siguientes preguntas ya fueron usadas anteriormente. Genera preguntas COMPLETAMENTE DIFERENTES en contenido y estructura:\n${previousQuestionIds.join(', ')}`
    : ''

  // Instrucciones especiales según la unidad
  let specialInstructions = ''
  const topicIds = topics.map((t: { id: string }) => t.id)
  
  if (topicIds.some((id: string) => id.startsWith('3.'))) {
    specialInstructions = `
INSTRUCCIÓN ESPECIAL PARA UNIDAD III (Matrices y Sistemas):
- Los ejercicios de sistemas de ecuaciones lineales DEBEN usar el Método de Gauss (escalonamiento) como método estándar de la cátedra.
- Para clasificar sistemas, usa el Teorema de Rouché-Frobenius comparando rg(A) con rg(A|b).
- La Regla de Cramer solo debe mencionarse para sistemas con solución única.
`
  }

  try {
    const { output } = await generateText({
      model: google('gemini-1.5-flash'),
      output: Output.object({
        schema: questionSchema,
      }),
      messages: [
        {
          role: 'user',
          content: `Eres un profesor universitario experto en matemáticas de primer año. Tu tarea es generar exactamente ${questionCount} preguntas de opción múltiple para un cuestionario universitario.

${curriculum}

${modeDescription}

MATERIA: ${subject}
TEMAS SELECCIONADOS POR EL ALUMNO:
${topicsText}
${previousIdsNote}
${specialInstructions}

REGLAS ESTRICTAS:
1. Genera las preguntas basándote ESTRICTAMENTE en el programa proporcionado arriba.
2. NO inventes temas que no estén en el programa.
3. Cada pregunta debe tener entre 4 y 6 opciones de respuesta.
4. Solo UNA opción es correcta (correctAnswer es el índice 0-based).
5. Usa notación LaTeX para TODAS las fórmulas matemáticas (ej: $x^2$, $\\frac{a}{b}$, $\\int_0^1 f(x)dx$, $\\lim_{x \\to 0}$).
6. La explicación debe ser concisa (2-3 oraciones) explicando POR QUÉ la respuesta correcta es correcta.
7. Las opciones incorrectas deben ser plausibles (errores comunes de estudiantes).
8. Distribuye las preguntas equitativamente entre los temas seleccionados.
9. Varía la dificultad: 30% fácil, 50% media, 20% difícil.
10. Genera IDs únicos descriptivos para cada pregunta (ej: "q-logica-prop-1", "q-matrices-gauss-2").

Genera las ${questionCount} preguntas ahora en formato JSON.`
        }
      ],
      maxOutputTokens: 8000,
      temperature: 0.8,
    })

    console.log('[v0] Generated questions:', output?.questions?.length || 0)
    return Response.json({ questions: output?.questions || [] })
  } catch (error) {
    console.error('[v0] Error generating quiz:', error)
    return Response.json({ questions: [], error: String(error) }, { status: 500 })
  }
}
