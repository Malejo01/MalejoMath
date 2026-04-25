import type { Subject, Question } from './types'

// Curriculum oficial de Algebra I - Estructura exacta de la catedra
export const algebraCurriculum = {
  subject: "Álgebra I",
  units: [
    {
      id: 1,
      title: "Lógica Proposicional",
      topics: [
        { id: "1.1", name: "Proposición, Conectivos, Implicaciones, Leyes" },
        { id: "1.2", name: "Formas proposicionales, Cuantificadores, Conjunto de verdad" },
        { id: "1.3", name: "Métodos de demostración (Directo, Indirecto, Contraejemplo, Inducción)" }
      ]
    },
    {
      id: 2,
      title: "Ecuaciones e Inecuaciones",
      topics: [
        { id: "2.1", name: "Ecuaciones polinómicas (grado 1 y 2) y Números complejos" },
        { id: "2.2", name: "Ecuaciones racionales, radicales, valor absoluto, exponenciales y logarítmicas" },
        { id: "2.3", name: "Inecuaciones (polinómicas, racionales, radicales, valor absoluto)" }
      ]
    },
    {
      id: 3,
      title: "Matrices y Sistemas de Ecuaciones Lineales",
      topics: [
        { id: "3.1", name: "Operaciones con matrices y Propiedades" },
        { id: "3.2", name: "Matrices cuadradas, Invertibles y Determinantes" },
        { id: "3.3", name: "Sistemas lineales, Método de Gauss y Teorema de Rouche-Frobenius" }
      ]
    },
    {
      id: 4,
      title: "Análisis Combinatorio y Vectores",
      topics: [
        { id: "4.1", name: "Sumatoria, Productorio y Factorial" },
        { id: "4.2", name: "Números combinatorios, Binomio de Newton, Permutación y Variación" },
        { id: "4.3", name: "Vectores en R2 y R3 y sus operaciones" }
      ]
    }
  ]
}

export const subjects: Subject[] = [
  {
    id: 'algebra',
    name: 'Álgebra I',
    icon: 'algebra',
    color: 'primary',
    progress: 0,
    units: [
      {
        id: 'algebra-u1',
        name: 'Unidad I: Lógica Proposicional',
        topics: [
          { id: '1.1', name: 'Proposición, Conectivos, Implicaciones, Leyes', completed: false },
          { id: '1.2', name: 'Formas proposicionales, Cuantificadores, Conjunto de verdad', completed: false },
          { id: '1.3', name: 'Métodos de demostración (Directo, Indirecto, Contraejemplo, Inducción)', completed: false },
        ]
      },
      {
        id: 'algebra-u2',
        name: 'Unidad II: Ecuaciones e Inecuaciones',
        topics: [
          { id: '2.1', name: 'Ecuaciones polinómicas (grado 1 y 2) y Números complejos', completed: false },
          { id: '2.2', name: 'Ecuaciones racionales, radicales, valor absoluto, exponenciales y logarítmicas', completed: false },
          { id: '2.3', name: 'Inecuaciones (polinómicas, racionales, radicales, valor absoluto)', completed: false },
        ]
      },
      {
        id: 'algebra-u3',
        name: 'Unidad III: Matrices y Sistemas',
        topics: [
          { id: '3.1', name: 'Operaciones con matrices y Propiedades', completed: false },
          { id: '3.2', name: 'Matrices cuadradas, Invertibles y Determinantes', completed: false },
          { id: '3.3', name: 'Sistemas lineales, Método de Gauss y Teorema de Rouche-Frobenius', completed: false },
        ]
      },
      {
        id: 'algebra-u4',
        name: 'Unidad IV: Combinatoria y Vectores',
        topics: [
          { id: '4.1', name: 'Sumatoria, Productorio y Factorial', completed: false },
          { id: '4.2', name: 'Números combinatorios, Binomio de Newton, Permutación y Variación', completed: false },
          { id: '4.3', name: 'Vectores en R2 y R3 y sus operaciones', completed: false },
        ]
      }
    ]
  },
  {
    id: 'analisis',
    name: 'Análisis Matemático I',
    icon: 'analysis',
    color: 'accent',
    progress: 0,
    units: [
      {
        id: 'analisis-u1',
        name: 'Unidad I: Límites y Continuidad',
        topics: [
          { id: 'lim-1', name: 'Concepto de límite y propiedades', completed: false },
          { id: 'lim-2', name: 'Límites laterales e infinitos', completed: false },
          { id: 'lim-3', name: 'Continuidad de funciones', completed: false },
        ]
      },
      {
        id: 'analisis-u2',
        name: 'Unidad II: Derivadas',
        topics: [
          { id: 'der-1', name: 'Definición y reglas de derivación', completed: false },
          { id: 'der-2', name: 'Derivadas de funciones compuestas', completed: false },
          { id: 'der-3', name: 'Aplicaciones de la derivada', completed: false },
        ]
      },
      {
        id: 'analisis-u3',
        name: 'Unidad III: Integrales',
        topics: [
          { id: 'int-1', name: 'Integral indefinida y primitivas', completed: false },
          { id: 'int-2', name: 'Integral definida y Teorema Fundamental', completed: false },
          { id: 'int-3', name: 'Técnicas de integración', completed: false },
        ]
      },
      {
        id: 'analisis-u4',
        name: 'Unidad IV: Series y Sucesiones',
        topics: [
          { id: 'ser-1', name: 'Sucesiones numéricas', completed: false },
          { id: 'ser-2', name: 'Series numéricas y convergencia', completed: false },
          { id: 'ser-3', name: 'Series de potencias', completed: false },
        ]
      }
    ]
  },
  {
    id: 'probabilidad',
    name: 'Probabilidad y Estadística',
    icon: 'probability',
    color: 'warning',
    progress: 0,
    units: [
      {
        id: 'prob-u1',
        name: 'Unidad I: Estadística Descriptiva',
        topics: [
          { id: 'est-1', name: 'Medidas de tendencia central', completed: false },
          { id: 'est-2', name: 'Medidas de dispersión', completed: false },
          { id: 'est-3', name: 'Representaciones gráficas', completed: false },
        ]
      },
      {
        id: 'prob-u2',
        name: 'Unidad II: Probabilidad',
        topics: [
          { id: 'prob-1', name: 'Combinatoria y conteo', completed: false },
          { id: 'prob-2', name: 'Probabilidad clásica y axiomas', completed: false },
          { id: 'prob-3', name: 'Probabilidad condicional y Bayes', completed: false },
        ]
      },
      {
        id: 'prob-u3',
        name: 'Unidad III: Variables Aleatorias',
        topics: [
          { id: 'va-1', name: 'Variables aleatorias discretas', completed: false },
          { id: 'va-2', name: 'Variables aleatorias continuas', completed: false },
          { id: 'va-3', name: 'Distribuciones especiales (Normal, Binomial, Poisson)', completed: false },
        ]
      },
      {
        id: 'prob-u4',
        name: 'Unidad IV: Inferencia Estadística',
        topics: [
          { id: 'inf-1', name: 'Estimación puntual y por intervalos', completed: false },
          { id: 'inf-2', name: 'Pruebas de hipótesis', completed: false },
          { id: 'inf-3', name: 'Regresión y correlación', completed: false },
        ]
      }
    ]
  }
]

// Sample questions for demonstration (fallback if AI is not available)
export const sampleQuestions: Record<string, Question[]> = {
  '1.1': [
    {
      id: 'q-log-1',
      topic: '1.1',
      topicName: 'Proposición, Conectivos, Implicaciones, Leyes',
      question: 'Sea $p$: "Llueve" y $q$: "Hace frío". La expresión "Si llueve, entonces hace frío" se simboliza como:',
      options: ['$p \\Rightarrow q$', '$p \\wedge q$', '$p \\vee q$', '$p \\Leftrightarrow q$'],
      correctAnswer: 0,
      explanation: 'La implicación "Si p entonces q" se simboliza con la flecha $\\Rightarrow$. Es el conectivo condicional.'
    },
    {
      id: 'q-log-2',
      topic: '1.1',
      topicName: 'Proposición, Conectivos, Implicaciones, Leyes',
      question: 'La negación de $p \\wedge q$ según las Leyes de De Morgan es:',
      options: ['$\\neg p \\vee \\neg q$', '$\\neg p \\wedge \\neg q$', '$p \\vee q$', '$\\neg(p \\vee q)$'],
      correctAnswer: 0,
      explanation: 'Por la Ley de De Morgan: $\\neg(p \\wedge q) \\equiv \\neg p \\vee \\neg q$. La negación de una conjunción es la disyunción de las negaciones.'
    }
  ],
  '3.3': [
    {
      id: 'q-mat-1',
      topic: '3.3',
      topicName: 'Sistemas lineales, Método de Gauss y Teorema de Rouche-Frobenius',
      question: 'Un sistema de ecuaciones lineales tiene infinitas soluciones cuando:',
      options: [
        '$rg(A) = rg(A|b) < n$ (número de incógnitas)',
        '$rg(A) = rg(A|b) = n$',
        '$rg(A) \\neq rg(A|b)$',
        '$rg(A) > n$'
      ],
      correctAnswer: 0,
      explanation: 'Por el Teorema de Rouché-Frobenius, si los rangos son iguales pero menores que el número de incógnitas, el sistema es compatible indeterminado (infinitas soluciones).'
    }
  ],
  '4.2': [
    {
      id: 'q-comb-1',
      topic: '4.2',
      topicName: 'Números combinatorios, Binomio de Newton, Permutación y Variación',
      question: 'El desarrollo del Binomio de Newton $(a+b)^3$ es:',
      options: [
        '$a^3 + 3a^2b + 3ab^2 + b^3$',
        '$a^3 + b^3$',
        '$a^3 + 2a^2b + 2ab^2 + b^3$',
        '$a^3 - 3a^2b + 3ab^2 - b^3$'
      ],
      correctAnswer: 0,
      explanation: 'Aplicando el Binomio de Newton: $(a+b)^3 = \\binom{3}{0}a^3 + \\binom{3}{1}a^2b + \\binom{3}{2}ab^2 + \\binom{3}{3}b^3 = a^3 + 3a^2b + 3ab^2 + b^3$.'
    }
  ]
}

// Helper function to get questions for selected topics
export function getQuestionsForTopics(topicIds: string[], mode: 'teorico' | 'practico'): Question[] {
  const questionCount = mode === 'teorico' ? 20 : 10
  const allQuestions: Question[] = []
  
  topicIds.forEach(topicId => {
    const topicQuestions = sampleQuestions[topicId] || []
    allQuestions.push(...topicQuestions)
  })
  
  // If we don't have enough questions, duplicate and shuffle
  while (allQuestions.length < questionCount && allQuestions.length > 0) {
    const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)]
    allQuestions.push({ ...randomQuestion, id: `${randomQuestion.id}-${allQuestions.length}` })
  }
  
  // Shuffle and take required number
  return allQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, questionCount)
}
