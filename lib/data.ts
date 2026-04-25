import type { Subject, Question } from './types'

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
        name: 'Unidad 1: Números y Conjuntos',
        topics: [
          { id: 'conjuntos', name: 'Teoría de Conjuntos', completed: false },
          { id: 'numeros-reales', name: 'Números Reales', completed: false },
          { id: 'numeros-complejos', name: 'Números Complejos', completed: false },
        ]
      },
      {
        id: 'algebra-u2',
        name: 'Unidad 2: Polinomios',
        topics: [
          { id: 'polinomios-ops', name: 'Operaciones con Polinomios', completed: false },
          { id: 'factorizacion', name: 'Factorización', completed: false },
          { id: 'raices', name: 'Raíces de Polinomios', completed: false },
        ]
      },
      {
        id: 'algebra-u3',
        name: 'Unidad 3: Matrices y Sistemas',
        topics: [
          { id: 'matrices', name: 'Matrices y Determinantes', completed: false },
          { id: 'sistemas-lineales', name: 'Sistemas de Ecuaciones Lineales', completed: false },
          { id: 'espacios-vectoriales', name: 'Espacios Vectoriales', completed: false },
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
        name: 'Unidad 1: Límites',
        topics: [
          { id: 'limites-intro', name: 'Introducción a Límites', completed: false },
          { id: 'limites-laterales', name: 'Límites Laterales', completed: false },
          { id: 'limites-infinito', name: 'Límites al Infinito', completed: false },
        ]
      },
      {
        id: 'analisis-u2',
        name: 'Unidad 2: Derivadas',
        topics: [
          { id: 'derivadas-def', name: 'Definición de Derivada', completed: false },
          { id: 'reglas-derivacion', name: 'Reglas de Derivación', completed: false },
          { id: 'derivadas-aplicaciones', name: 'Aplicaciones de Derivadas', completed: false },
        ]
      },
      {
        id: 'analisis-u3',
        name: 'Unidad 3: Integrales',
        topics: [
          { id: 'integrales-indef', name: 'Integrales Indefinidas', completed: false },
          { id: 'integrales-def', name: 'Integrales Definidas', completed: false },
          { id: 'tecnicas-integracion', name: 'Técnicas de Integración', completed: false },
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
        name: 'Unidad 1: Probabilidad Básica',
        topics: [
          { id: 'combinatoria', name: 'Combinatoria', completed: false },
          { id: 'probabilidad-clasica', name: 'Probabilidad Clásica', completed: false },
          { id: 'prob-condicional', name: 'Probabilidad Condicional', completed: false },
        ]
      },
      {
        id: 'prob-u2',
        name: 'Unidad 2: Variables Aleatorias',
        topics: [
          { id: 'va-discretas', name: 'Variables Aleatorias Discretas', completed: false },
          { id: 'va-continuas', name: 'Variables Aleatorias Continuas', completed: false },
          { id: 'distribuciones', name: 'Distribuciones de Probabilidad', completed: false },
        ]
      },
      {
        id: 'prob-u3',
        name: 'Unidad 3: Estadística Inferencial',
        topics: [
          { id: 'estimacion', name: 'Estimación de Parámetros', completed: false },
          { id: 'pruebas-hipotesis', name: 'Pruebas de Hipótesis', completed: false },
          { id: 'regresion', name: 'Regresión Lineal', completed: false },
        ]
      }
    ]
  }
]

// Sample questions for demonstration
export const sampleQuestions: Record<string, Question[]> = {
  'conjuntos': [
    {
      id: 'q1',
      topic: 'conjuntos',
      question: 'Sea $A = \\{1, 2, 3\\}$ y $B = \\{2, 3, 4\\}$. ¿Cuál es $A \\cap B$?',
      options: ['$\\{2, 3\\}$', '$\\{1, 2, 3, 4\\}$', '$\\{1, 4\\}$', '$\\{2\\}$'],
      correctAnswer: 0,
      explanation: 'La intersección $A \\cap B$ contiene los elementos que pertenecen a ambos conjuntos. En este caso, 2 y 3 están en A y en B.'
    },
    {
      id: 'q2',
      topic: 'conjuntos',
      question: 'Si $|A| = 5$ y $|B| = 3$, y $A \\cap B = \\emptyset$, entonces $|A \\cup B| = $',
      options: ['$8$', '$5$', '$3$', '$15$'],
      correctAnswer: 0,
      explanation: 'Cuando los conjuntos son disjuntos ($A \\cap B = \\emptyset$), la cardinalidad de la unión es la suma de las cardinalidades: $|A \\cup B| = |A| + |B| = 5 + 3 = 8$.'
    }
  ],
  'limites-intro': [
    {
      id: 'q3',
      topic: 'limites-intro',
      question: '¿Cuál es el valor de $\\lim_{x \\to 2} (3x + 1)$?',
      options: ['$7$', '$6$', '$5$', '$8$'],
      correctAnswer: 0,
      explanation: 'Para funciones polinómicas, el límite se calcula por sustitución directa: $\\lim_{x \\to 2} (3x + 1) = 3(2) + 1 = 7$.'
    },
    {
      id: 'q4',
      topic: 'limites-intro',
      question: 'El límite $\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$ es igual a:',
      options: ['$1$', '$0$', '$\\infty$', 'No existe'],
      correctAnswer: 0,
      explanation: 'Este es un límite notable fundamental. $\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$ es un resultado que se demuestra usando el teorema del sandwich.'
    }
  ],
  'derivadas-def': [
    {
      id: 'q5',
      topic: 'derivadas-def',
      question: 'La derivada de $f(x) = x^3$ es:',
      options: ['$3x^2$', '$x^2$', '$3x^3$', '$2x^3$'],
      correctAnswer: 0,
      explanation: 'Aplicando la regla de la potencia: $\\frac{d}{dx}(x^n) = nx^{n-1}$. Para $x^3$: $\\frac{d}{dx}(x^3) = 3x^2$.'
    }
  ],
  'combinatoria': [
    {
      id: 'q6',
      topic: 'combinatoria',
      question: '¿De cuántas formas se pueden ordenar 4 libros diferentes en una estantería?',
      options: ['$24$', '$16$', '$12$', '$4$'],
      correctAnswer: 0,
      explanation: 'Es una permutación de 4 elementos: $P_4 = 4! = 4 \\times 3 \\times 2 \\times 1 = 24$.'
    }
  ],
  'matrices': [
    {
      id: 'q7',
      topic: 'matrices',
      question: 'Sea $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. El determinante de $A$ es:',
      options: ['$-2$', '$2$', '$10$', '$-10$'],
      correctAnswer: 0,
      explanation: 'El determinante de una matriz 2x2 se calcula como $det(A) = ad - bc = (1)(4) - (2)(3) = 4 - 6 = -2$.'
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
