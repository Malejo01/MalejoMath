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
    name: 'Algebra I',
    icon: 'algebra',
    color: 'primary',
    progress: 0,
    units: [
      {
        id: 'algebra-u1',
        name: 'Unidad I: Logica proposicional',
        topics: [
          { id: 'alg-1.1-proposicion', name: 'Proposicion', group: '1.1 Proposicion, conectivos, implicaciones, leyes', completed: false },
          { id: 'alg-1.1-conectivos', name: 'Conectivos', group: '1.1 Proposicion, conectivos, implicaciones, leyes', completed: false },
          { id: 'alg-1.1-implicaciones', name: 'Implicaciones', group: '1.1 Proposicion, conectivos, implicaciones, leyes', completed: false },
          { id: 'alg-1.1-leyes', name: 'Leyes', group: '1.1 Proposicion, conectivos, implicaciones, leyes', completed: false },

          { id: 'alg-1.2-formas-proposicionales', name: 'Formas proposicionales', group: '1.2 Formas proposicionales, cuantificadores, conjunto de verdad', completed: false },
          { id: 'alg-1.2-cuantificadores', name: 'Cuantificadores', group: '1.2 Formas proposicionales, cuantificadores, conjunto de verdad', completed: false },
          { id: 'alg-1.2-conjunto-verdad', name: 'Conjunto de verdad', group: '1.2 Formas proposicionales, cuantificadores, conjunto de verdad', completed: false },

          { id: 'alg-1.3-metodo-directo', name: 'Metodo directo', group: '1.3 Metodos de demostracion', completed: false },
          { id: 'alg-1.3-metodo-indirecto', name: 'Metodo indirecto', group: '1.3 Metodos de demostracion', completed: false },
          { id: 'alg-1.3-metodo-contraejemplo', name: 'Metodo de contraejemplo', group: '1.3 Metodos de demostracion', completed: false },
          { id: 'alg-1.3-metodo-induccion', name: 'Metodo de induccion', group: '1.3 Metodos de demostracion', completed: false },
        ]
      },
      {
        id: 'algebra-u2',
        name: 'Unidad II: Ecuaciones e inecuaciones',
        topics: [
          { id: 'alg-2.1-ecuaciones-polinomicas-grado-1-2-numeros-complejos', name: 'Ecuaciones polinomicas (grado 1 y 2) y numeros complejos', group: '2.1 Ecuaciones polinomicas y numeros complejos', completed: false },

          { id: 'alg-2.2-ecuaciones-racionales', name: 'Ecuaciones racionales', group: '2.2 Ecuaciones racionales, radicales, valor absoluto, exponenciales y logaritmicas', completed: false },
          { id: 'alg-2.2-ecuaciones-radicales', name: 'Ecuaciones radicales', group: '2.2 Ecuaciones racionales, radicales, valor absoluto, exponenciales y logaritmicas', completed: false },
          { id: 'alg-2.2-ecuaciones-valor-absoluto', name: 'Ecuaciones con valor absoluto', group: '2.2 Ecuaciones racionales, radicales, valor absoluto, exponenciales y logaritmicas', completed: false },
          { id: 'alg-2.2-ecuaciones-exponenciales-logaritmicas', name: 'Ecuaciones exponenciales y logaritmicas', group: '2.2 Ecuaciones racionales, radicales, valor absoluto, exponenciales y logaritmicas', completed: false },

          { id: 'alg-2.3-inecuaciones-polinomicas', name: 'Inecuaciones polinomicas', group: '2.3 Inecuaciones polinomicas, racionales, radicales, valor absoluto', completed: false },
          { id: 'alg-2.3-inecuaciones-racionales', name: 'Inecuaciones racionales', group: '2.3 Inecuaciones polinomicas, racionales, radicales, valor absoluto', completed: false },
          { id: 'alg-2.3-inecuaciones-radicales', name: 'Inecuaciones radicales', group: '2.3 Inecuaciones polinomicas, racionales, radicales, valor absoluto', completed: false },
          { id: 'alg-2.3-inecuaciones-valor-absoluto', name: 'Inecuaciones con valor absoluto', group: '2.3 Inecuaciones polinomicas, racionales, radicales, valor absoluto', completed: false },
        ]
      },
      {
        id: 'algebra-u3',
        name: 'Unidad III: Matrices y sistemas de ecuaciones lineales',
        topics: [
          { id: 'alg-3.1-operaciones-matrices-propiedades', name: 'Operaciones con matrices y propiedades', group: '3.1 Operaciones con matrices y propiedades', completed: false },

          { id: 'alg-3.2-matrices-cuadradas', name: 'Matrices cuadradas', group: '3.2 Matrices cuadradas, invertibles y determinantes', completed: false },
          { id: 'alg-3.2-matrices-invertibles-determinantes', name: 'Matrices invertibles y determinantes', group: '3.2 Matrices cuadradas, invertibles y determinantes', completed: false },

          { id: 'alg-3.3-sistemas-lineales', name: 'Sistemas lineales', group: '3.3 Sistemas lineales, metodo de Gauss y teorema de Rouche-Frobenius', completed: false },
          { id: 'alg-3.3-metodo-gauss-teorema-rouche-frobenius', name: 'Metodo de Gauss y Teorema de Rouche-Frobenius', group: '3.3 Sistemas lineales, metodo de Gauss y teorema de Rouche-Frobenius', completed: false },
        ]
      },
      {
        id: 'algebra-u4',
        name: 'Unidad IV: Analisis combinatorio y vectores',
        topics: [
          { id: 'alg-4.1-sumatoria', name: 'Sumatoria', group: '4.1 Sumatoria, productorio y factorial', completed: false },
          { id: 'alg-4.1-productorio-factorial', name: 'Productorio y factorial', group: '4.1 Sumatoria, productorio y factorial', completed: false },

          { id: 'alg-4.2-numeros-combinatorios', name: 'Numeros combinatorios', group: '4.2 Numeros combinatorios, Binomio de Newton, permutacion y variacion', completed: false },
          { id: 'alg-4.2-binomio-newton', name: 'Binomio de Newton', group: '4.2 Numeros combinatorios, Binomio de Newton, permutacion y variacion', completed: false },
          { id: 'alg-4.2-permutacion-variacion', name: 'Permutacion y variacion', group: '4.2 Numeros combinatorios, Binomio de Newton, permutacion y variacion', completed: false },

          { id: 'alg-4.3-vectores-r2-r3-operaciones', name: 'Vectores en R2 y R3 y sus operaciones', group: '4.3 Vectores en R2 y R3 y sus operaciones', completed: false },
        ]
      }
    ]
  },
  {
    id: 'analisis',
    name: 'Analisis Matematico I',
    icon: 'analysis',
    color: 'accent',
    progress: 0,
    units: [
      {
        id: 'analisis-u1',
        name: 'Unidad I: Funcion de variable real',
        topics: [
          { id: 'ana-1.1-funcion-variable-real-dominio-imagen', name: 'Funcion de variable real, Dominio e Imagen', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-grafica-funciones', name: 'Grafica de funciones', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funcion-constante', name: 'Funcion constante', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funcion-lineal', name: 'Funcion lineal', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funcion-cuadratica', name: 'Funcion cuadratica', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funcion-valor-absoluto', name: 'Funcion valor absoluto', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funciones-definidas-por-tramos', name: 'Funciones definidas por tramos', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funciones-crecientes-decrecientes', name: 'Funciones crecientes y decrecientes', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-transformaciones-funciones', name: 'Transformaciones de funciones', group: '1.1 Concepto de funcion', completed: false },
          { id: 'ana-1.1-funciones-par-impar', name: 'Funciones par e impar', group: '1.1 Concepto de funcion', completed: false },

          { id: 'ana-1.2-suma-funciones', name: 'Suma de funciones', group: '1.2 Operaciones con funciones', completed: false },
          { id: 'ana-1.2-producto-funciones', name: 'Producto de funciones', group: '1.2 Operaciones con funciones', completed: false },
          { id: 'ana-1.2-cociente-funciones', name: 'Cociente de funciones', group: '1.2 Operaciones con funciones', completed: false },
          { id: 'ana-1.2-composicion-funciones', name: 'Composicion de funciones', group: '1.2 Operaciones con funciones', completed: false },
          { id: 'ana-1.2-funciones-biunivocas-uno-a-uno', name: 'Funciones biunivocas (uno a uno)', group: '1.2 Operaciones con funciones', completed: false },
          { id: 'ana-1.2-funcion-inversa', name: 'Funcion inversa', group: '1.2 Operaciones con funciones', completed: false },

          { id: 'ana-1.3-funciones-exponenciales', name: 'Funciones exponenciales', group: '1.3 Funciones exponenciales', completed: false },
          { id: 'ana-1.3-funciones-logaritmicas', name: 'Funciones logaritmicas', group: '1.3 Funciones exponenciales', completed: false },
          { id: 'ana-1.3-modelos-crecimiento-poblacion', name: 'Modelos de crecimiento de poblacion', group: '1.3 Funciones exponenciales', completed: false },
        ]
      },
      {
        id: 'analisis-u2',
        name: 'Unidad II: Limite y continuidad',
        topics: [
          { id: 'ana-2.1-definicion-limite-funcion-punto', name: 'Definicion del limite de una funcion en un punto', group: '2.1 Limite', completed: false },
          { id: 'ana-2.1-limites-laterales', name: 'Limites laterales', group: '2.1 Limite', completed: false },
          { id: 'ana-2.1-grafico-tablas-limites', name: 'Grafico por tablas de limites', group: '2.1 Limite', completed: false },
          { id: 'ana-2.1-propiedades-algebraicas-limites', name: 'Propiedades algebraicas de los limites', group: '2.1 Limite', completed: false },
          { id: 'ana-2.1-tecnicas-cancelacion-racionalizacion', name: 'Tecnicas de cancelacion y racionalizacion', group: '2.1 Limite', completed: false },

          { id: 'ana-2.2-infinitesimos-equivalentes', name: 'Infinitesimos equivalentes', group: '2.2 Limites notables', completed: false },
          { id: 'ana-2.2-limite-infinito', name: 'Limite en el infinito', group: '2.2 Limites notables', completed: false },
          { id: 'ana-2.2-limites-infinitos', name: 'Limites infinitos', group: '2.2 Limites notables', completed: false },
          { id: 'ana-2.2-asintotas-verticales', name: 'Asintotas verticales', group: '2.2 Limites notables', completed: false },
          { id: 'ana-2.2-asintotas-horizontales', name: 'Asintotas horizontales', group: '2.2 Limites notables', completed: false },
          { id: 'ana-2.2-asintotas-oblicuas', name: 'Asintotas oblicuas', group: '2.2 Limites notables', completed: false },

          { id: 'ana-2.3-definicion-continuidad-funcion-punto', name: 'Definicion de continuidad de una funcion en un punto', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-discontinuidad-evitable-esencial', name: 'Discontinuidad evitable y esencial', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-propiedades-funciones-continuas', name: 'Propiedades de las funciones continuas', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-continuidad-funciones-elementales', name: 'Continuidad de funciones elementales', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-dominio-continuidad-funcion', name: 'Dominio de continuidad de una funcion', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-teorema-valor-intermedio', name: 'Teorema del valor intermedio', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-teorema-bolzano', name: 'Teorema de Bolzano', group: '2.3 Continuidad', completed: false },
          { id: 'ana-2.3-problemas-aplicacion', name: 'Problemas de aplicacion', group: '2.3 Continuidad', completed: false },
        ]
      },
      {
        id: 'analisis-u3',
        name: 'Unidad III: El calculo diferencial',
        topics: [
          { id: 'ana-3.1-definicion-derivada-funcion-punto', name: 'Definicion de la derivada de una funcion en un punto', group: '3.1 Derivada', completed: false },
          { id: 'ana-3.1-interpretacion-geometrica-derivada', name: 'Interpretacion geometrica de la derivada', group: '3.1 Derivada', completed: false },
          { id: 'ana-3.1-recta-tangente-normal', name: 'Recta tangente y normal a una curva en un punto', group: '3.1 Derivada', completed: false },
          { id: 'ana-3.1-razon-cambio-aplicaciones', name: 'Razon de cambio: problemas de aplicacion', group: '3.1 Derivada', completed: false },
          { id: 'ana-3.1-funcion-derivada', name: 'Funcion derivada', group: '3.1 Derivada', completed: false },

          { id: 'ana-3.2-suma-derivadas', name: 'Suma de derivadas', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-producto-derivadas', name: 'Producto de derivadas', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-cociente-derivadas', name: 'Cociente de derivadas', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-derivada-composicion-funciones', name: 'Derivada de la composicion de funciones', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-regla-cadena', name: 'Regla de la cadena', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-derivadas-orden-superior', name: 'Derivadas de orden superior', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-significado-fisico-primera-segunda-derivada', name: 'Significado fisico de la primera y segunda derivada', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-diferenciacion-implicita', name: 'Diferenciacion implicita', group: '3.2 Reglas de derivacion', completed: false },
          { id: 'ana-3.2-diferenciacion-logaritmica', name: 'Diferenciacion logaritmica', group: '3.2 Reglas de derivacion', completed: false },

          { id: 'ana-3.3-concepto-interpretacion-diferencial', name: 'Concepto e interpretacion geometrica del diferencial', group: '3.3 Diferencial', completed: false },
          { id: 'ana-3.3-aproximacion-lineal', name: 'Aproximacion lineal', group: '3.3 Diferencial', completed: false },
          { id: 'ana-3.3-formas-indeterminadas', name: 'Formas indeterminadas', group: '3.3 Diferencial', completed: false },
          { id: 'ana-3.3-regla-l-hospital', name: 'Regla de L Hospital', group: '3.3 Diferencial', completed: false },
        ]
      }
    ]
  },
  {
    id: 'probabilidad',
    name: 'Probabilidad y Estadistica',
    icon: 'probability',
    color: 'warning',
    progress: 0,
    units: [
      {
        id: 'prob-u1',
        name: 'Unidad I: Estadistica. Analisis de datos univariado',
        topics: [
          { id: 'prob-1-estadistica-descriptiva-conceptos', name: 'Conceptos de estadistica', group: 'Estadistica descriptiva', completed: false },
          { id: 'prob-1-estadistica-descriptiva-metodo', name: 'Metodo estadistico', group: 'Estadistica descriptiva', completed: false },
          { id: 'prob-1-estadistica-descriptiva-etapas-estudio', name: 'Etapas del estudio estadistico', group: 'Estadistica descriptiva', completed: false },
          { id: 'prob-1-estadistica-descriptiva-poblacion-individuo', name: 'Concepto de poblacion e individuo', group: 'Estadistica descriptiva', completed: false },

          { id: 'prob-1-variables-cualitativas', name: 'Variables cualitativas', group: 'Variables cualitativas y cuantitativas', completed: false },
          { id: 'prob-1-variables-cuantitativas', name: 'Variables cuantitativas', group: 'Variables cualitativas y cuantitativas', completed: false },

          { id: 'prob-1-distribucion-frecuencias-simples', name: 'Distribucion de frecuencias simples', group: 'Distribucion de frecuencias simples y agrupadas', completed: false },
          { id: 'prob-1-distribucion-frecuencias-agrupadas', name: 'Distribucion de frecuencias agrupadas', group: 'Distribucion de frecuencias simples y agrupadas', completed: false },

          { id: 'prob-1-representacion-datos-graficas-barras', name: 'Graficas estadisticas de barras', group: 'Representacion de datos', completed: false },
          { id: 'prob-1-representacion-datos-grafica-circular', name: 'Grafica circular', group: 'Representacion de datos', completed: false },
          { id: 'prob-1-representacion-datos-histograma', name: 'Histograma', group: 'Representacion de datos', completed: false },
          { id: 'prob-1-representacion-datos-poligono-frecuencia', name: 'Poligono de frecuencia', group: 'Representacion de datos', completed: false },
          { id: 'prob-1-representacion-datos-ojiva', name: 'Ojiva', group: 'Representacion de datos', completed: false },
          { id: 'prob-1-representacion-datos-usos', name: 'Usos', group: 'Representacion de datos', completed: false },

          { id: 'prob-1-sumatoria-definicion', name: 'Definicion', group: 'Sumatoria', completed: false },
          { id: 'prob-1-sumatoria-propiedades', name: 'Propiedades', group: 'Sumatoria', completed: false },

          { id: 'prob-1-centralizacion-media', name: 'Media aritmetica', group: 'Medidas de centralizacion', completed: false },
          { id: 'prob-1-centralizacion-mediana', name: 'Mediana', group: 'Medidas de centralizacion', completed: false },
          { id: 'prob-1-centralizacion-moda', name: 'Moda', group: 'Medidas de centralizacion', completed: false },
          { id: 'prob-1-centralizacion-analisis', name: 'Analisis de cada una', group: 'Medidas de centralizacion', completed: false },
          { id: 'prob-1-centralizacion-conveniencia-uso', name: 'Conveniencia de su uso', group: 'Medidas de centralizacion', completed: false },
          { id: 'prob-1-centralizacion-calculos-agrupados', name: 'Calculos con datos agrupados', group: 'Medidas de centralizacion', completed: false },
          { id: 'prob-1-centralizacion-calculos-sin-agrupar', name: 'Calculos con datos sin agrupar', group: 'Medidas de centralizacion', completed: false },

          { id: 'prob-1-dispersion-rango', name: 'Rango', group: 'Medidas de dispersion', completed: false },
          { id: 'prob-1-dispersion-varianza', name: 'Varianza', group: 'Medidas de dispersion', completed: false },
          { id: 'prob-1-dispersion-desviacion-tipica', name: 'Desviacion tipica', group: 'Medidas de dispersion', completed: false },
          { id: 'prob-1-dispersion-deciles', name: 'Deciles', group: 'Medidas de dispersion', completed: false },
          { id: 'prob-1-dispersion-percentiles', name: 'Percentiles', group: 'Medidas de dispersion', completed: false },
          { id: 'prob-1-dispersion-coeficiente-variacion', name: 'Coeficiente de variacion', group: 'Medidas de dispersion', completed: false },
          { id: 'prob-1-dispersion-coeficiente-asimetria', name: 'Coeficiente de asimetria', group: 'Medidas de dispersion', completed: false },

          { id: 'prob-1-problemas-estadisticos', name: 'Problemas estadisticos', group: 'Problemas estadisticos', completed: false },
        ]
      },
      {
        id: 'prob-u2',
        name: 'Unidad II: Analisis de datos bivariado',
        topics: [
          { id: 'prob-2-series-dos-variables', name: 'Series estadisticas de dos variables', group: 'Series estadisticas de dos variables', completed: false },

          { id: 'prob-2-dependencia-funcional', name: 'Dependencia funcional', group: 'Dependencia funcional y dependencia estadistica', completed: false },
          { id: 'prob-2-dependencia-estadistica', name: 'Dependencia estadistica', group: 'Dependencia funcional y dependencia estadistica', completed: false },

          { id: 'prob-2-covarianza', name: 'Covarianza', group: 'Covarianza', completed: false },

          { id: 'prob-2-regresion-lineal-simple', name: 'Regresion lineal simple', group: 'Regresion lineal simple', completed: false },
          { id: 'prob-2-regresion-linea-estimacion', name: 'Estimacion mediante la linea de regresion', group: 'Regresion lineal simple', completed: false },
          { id: 'prob-2-regresion-minimos-cuadrados', name: 'Metodos de minimos cuadrados', group: 'Regresion lineal simple', completed: false },
          { id: 'prob-2-regresion-error-estimacion', name: 'Error de estimacion', group: 'Regresion lineal simple', completed: false },

          { id: 'prob-2-correlacion-lineal-simple', name: 'Correlacion lineal simple', group: 'Correlacion lineal simple', completed: false },
          { id: 'prob-2-correlacion-medidas-describir', name: 'Medidas para describir la correlacion', group: 'Correlacion lineal simple', completed: false },
          { id: 'prob-2-correlacion-coeficiente-determinacion', name: 'Coeficiente de determinacion', group: 'Correlacion lineal simple', completed: false },
          { id: 'prob-2-correlacion-coeficiente-correlacion', name: 'Coeficiente de correlacion', group: 'Correlacion lineal simple', completed: false },

          { id: 'prob-2-correlacion-por-rangos', name: 'Correlacion por rangos', group: 'Correlacion por rangos', completed: false },
          { id: 'prob-2-aplicacion-excel-bivariado', name: 'Aplicacion en Excel del metodo bivariado', group: 'Aplicacion en Excel del metodo bivariado', completed: false },
        ]
      },
      {
        id: 'prob-u3',
        name: 'Unidad III: Probabilidad',
        topics: [
          { id: 'prob-3-experimentos-deterministicos', name: 'Experimentos deterministicos', group: 'Probabilidad', completed: false },
          { id: 'prob-3-experimentos-probabilisticos', name: 'Experimentos probabilisticos', group: 'Probabilidad', completed: false },
          { id: 'prob-3-experimentos-aleatorios', name: 'Experimentos aleatorios', group: 'Probabilidad', completed: false },
          { id: 'prob-3-sucesos', name: 'Sucesos', group: 'Probabilidad', completed: false },
          { id: 'prob-3-espacios-muestrales', name: 'Espacios muestrales', group: 'Probabilidad', completed: false },
          { id: 'prob-3-clases-sucesos', name: 'Clases de sucesos', group: 'Probabilidad', completed: false },
          { id: 'prob-3-operaciones-sucesos', name: 'Operaciones de sucesos', group: 'Probabilidad', completed: false },
          { id: 'prob-3-probabilidad-laplace', name: 'Probabilidad de Laplace o probabilidad clasica', group: 'Probabilidad', completed: false },
          { id: 'prob-3-definicion-axiomatica', name: 'Definicion axiomatica de probabilidad', group: 'Probabilidad', completed: false },
          { id: 'prob-3-propiedades', name: 'Propiedades', group: 'Probabilidad', completed: false },
          { id: 'prob-3-probabilidad-condicionada', name: 'Probabilidad condicionada', group: 'Probabilidad', completed: false },
          { id: 'prob-3-sucesos-independientes', name: 'Sucesos independientes', group: 'Probabilidad', completed: false },
          { id: 'prob-3-teorema-probabilidad-total', name: 'Teorema de la probabilidad total', group: 'Probabilidad', completed: false },
          { id: 'prob-3-teorema-bayes', name: 'Teorema de Bayes', group: 'Probabilidad', completed: false },
        ]
      },
      {
        id: 'prob-u4',
        name: 'Unidad IV: Variables aleatorias - distribucion de probabilidades',
        topics: [
          { id: 'prob-4-variables-aleatorias', name: 'Variables aleatorias', group: 'Variables aleatorias', completed: false },
          { id: 'prob-4-funciones-distribucion', name: 'Funciones de distribucion', group: 'Variables aleatorias', completed: false },
          { id: 'prob-4-caracteristicas', name: 'Caracteristicas', group: 'Variables aleatorias', completed: false },

          { id: 'prob-4-distribuciones-bernoulli', name: 'Discretos: Bernoulli', group: 'Modelos teoricos de distribucion de probabilidades', completed: false },
          { id: 'prob-4-distribuciones-binomial', name: 'Discretos: Binomial', group: 'Modelos teoricos de distribucion de probabilidades', completed: false },
          { id: 'prob-4-distribuciones-normal', name: 'Continuos: Normal', group: 'Modelos teoricos de distribucion de probabilidades', completed: false },
          { id: 'prob-4-tablas-estadisticas', name: 'Tablas estadisticas', group: 'Modelos teoricos de distribucion de probabilidades', completed: false },
        ]
      }
    ]
  }
]

// Sample questions for demonstration (fallback if AI is not available)
export const sampleQuestions: Record<string, Question[]> = {
  'alg-1.1-conectivos': [
    {
      id: 'q-log-1',
      topic: 'alg-1.1-conectivos',
      topicName: 'Conectivos',
      question: 'Sea $p$: "Llueve" y $q$: "Hace frío". La expresión "Si llueve, entonces hace frío" se simboliza como:',
      options: ['$p \\Rightarrow q$', '$p \\wedge q$', '$p \\vee q$', '$p \\Leftrightarrow q$'],
      correctAnswer: 0,
      explanation: 'La implicación "Si p entonces q" se simboliza con la flecha $\\Rightarrow$. Es el conectivo condicional.'
    }
  ],
  'alg-1.1-leyes': [
    {
      id: 'q-log-2',
      topic: 'alg-1.1-leyes',
      topicName: 'Leyes',
      question: 'La negación de $p \\wedge q$ según las Leyes de De Morgan es:',
      options: ['$\\neg p \\vee \\neg q$', '$\\neg p \\wedge \\neg q$', '$p \\vee q$', '$\\neg(p \\vee q)$'],
      correctAnswer: 0,
      explanation: 'Por la Ley de De Morgan: $\\neg(p \\wedge q) \\equiv \\neg p \\vee \\neg q$. La negación de una conjunción es la disyunción de las negaciones.'
    }
  ],
  'alg-3.3-metodo-gauss-teorema-rouche-frobenius': [
    {
      id: 'q-mat-1',
      topic: 'alg-3.3-metodo-gauss-teorema-rouche-frobenius',
      topicName: 'Metodo de Gauss y Teorema de Rouche-Frobenius',
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
  'alg-4.2-binomio-newton': [
    {
      id: 'q-comb-1',
      topic: 'alg-4.2-binomio-newton',
      topicName: 'Binomio de Newton',
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
  const questionCount = 10
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
