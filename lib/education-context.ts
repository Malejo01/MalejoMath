export interface EducationContext {
  nivel: 'Primario' | 'Secundario' | 'Superior'
  grado: string
  edadMin: number
  edadMax: number
  etapaDesarrollo: string
  rolDocente: string
  registroLinguistico: string
  maxOpcionesPalabras: number
  instruccionesExplicacion: string
  contextualizacion: string
  estrategiaMateria: string
}

function parseNumeroGrado(gradoStr?: string): number {
  if (!gradoStr) return 1
  const match = gradoStr.match(/\d+/)
  return match ? parseInt(match[0], 10) : 1
}

function getSubjectStrategy(materia: string): string {
  const m = materia.toLowerCase()
  if (m.includes('matemát') || m.includes('matemat') || m.includes('álgebra') || m.includes('algebra') || m.includes('análisis') || m.includes('analisis') || m.includes('geometría') || m.includes('probabilidad')) {
    return `ESTRATEGIA MATEMÁTICA:
- Prioriza ejemplos concretos, problemas contextualizados y representaciones claras.
- Distractores diagnósticos: Errores de operación inversa, confusión de propiedades, fallas de conteo/signo o aplicación de fórmulas fuera de contexto.`
  }
  if (m.includes('natural') || m.includes('biolog') || m.includes('física') || m.includes('química') || m.includes('quimica') || m.includes('fisica')) {
    return `ESTRATEGIA CIENCIAS NATURALES:
- Basada en la observación directa de la naturaleza, seres vivos, cuerpo humano y fenómenos del entorno cotidiano.
- Distractores diagnósticos: Confusiones frecuentes entre procesos biológicos/físicos paralelos (ej: fotosíntesis vs respiración, fusión vs evaporación, masa vs peso).`
  }
  if (m.includes('social') || m.includes('histor') || m.includes('geograf') || m.includes('econ') || m.includes('formación') || m.includes('ética')) {
    return `ESTRATEGIA CIENCIAS SOCIALES:
- Enfocada en narrativas claras, procesos históricos de causa-efecto, comprensión del espacio geográfico y la vida en sociedad.
- Distractores diagnósticos: Confusiones de causalidad (confundir causa con consecuencia), anacronismos o mezcla de actores sociales.`
  }
  if (m.includes('lengua') || m.includes('literat') || m.includes('español') || m.includes('idioma') || m.includes('english')) {
    return `ESTRATEGIA LENGUA Y COMUNICACIÓN:
- Enfocada en comprensión lectora, funciones de la palabra, tipos de texto y comunicación cotidiana.
- Distractores diagnósticos: Interpretaciones literales de textos figurados, confusión de funciones gramaticales o de intención comunicativa.`
  }
  return `ESTRATEGIA GENERAL DISCIPLINAR:
- Plantea preguntas claras con relación directa a los temas curriculares.
- Distractores diagnósticos: Confusiones conceptuales típicas del tema.`
}

export function getEducationContext(
  nivelStr?: string,
  gradoStr?: string,
  materia: string = 'la materia'
): EducationContext {
  const nivel = (nivelStr === 'Primario' || nivelStr === 'Secundario' || nivelStr === 'Superior')
    ? nivelStr
    : 'Secundario'

  const numGrado = parseNumeroGrado(gradoStr)
  const estrategiaMateria = getSubjectStrategy(materia)

  if (nivel === 'Primario') {
    const gradoNum = Math.min(Math.max(numGrado, 1), 7)
    const edadMin = 5 + gradoNum // 1er -> 6, 3er -> 8, 7mo -> 12
    const edadMax = edadMin + 1   // 1er -> 7, 3er -> 9, 7mo -> 13

    let etapaDesarrollo = 'Infancia temprana'
    let maxPalabras = 10
    let emojiInstruction = ''
    if (gradoNum <= 5) {
      etapaDesarrollo = 'Infancia media'
      maxPalabras = 14
      emojiInstruction = `
USO PEDAGÓGICO DE EMOJIS (PRIMARIA):
- Incluye emojis sutiles, simpáticos e ilustrativos al lado de palabras clave en el enunciado y en las opciones (ej: pollitos 🐥, tortugas 🐢, pájaros 🐦, huevo 🥚, agua 💧, sol ☀️, plantas 🌱, números 🔢).
- Coloca 1 emoji relevante por opción y 1-2 en la pregunta para enriquecer la lectura visual de los niños sin recargar ni distraer.`
    } else {
      etapaDesarrollo = 'Preadolescencia / Transición'
      maxPalabras = 18
      emojiInstruction = `
USO DE EMOJIS:
- Usa emojis de forma muy mínima (solo 1 por pregunta si aporta claridad visual a un concepto clave).`
    }

    return {
      nivel: 'Primario',
      grado: `${gradoNum}º Grado`,
      edadMin,
      edadMax,
      etapaDesarrollo,
      rolDocente: `Maestro/a de Grado especialista en ${materia} para Nivel Primario`,
      registroLinguistico: `LENGUAJE PARA NIÑOS DE ${edadMin} A ${edadMax} AÑOS:
- Usa oraciones breves, simples y directas (máximo 15-20 palabras por oración).
- Utiliza vocabulario cotidiano, amigable y comprensible para niños de ${edadMin}-${edadMax} años.
- Si usas un término técnico necesario, explica su significado de forma inmediata y sencilla ("esto significa que...").
- PROHIBICIÓN ABSOLUTA DE LENGUAJE TÉCNICO DE SECUNDARIA: Para ${gradoNum}º Grado (${edadMin}-${edadMax} años), queda ESTRICTAMENTE PROHIBIDO utilizar términos científicos complejos o universitarios (como "hidrodinámico", "aeroterrestre", "adaptaciones perfectas", "fotosintético", "organismos heterótrofos"). Expresa absolutamente todo con palabras sencillas y cotidianas para un niño de esa edad (ej: "agua", "tierra", "aire", "nadar", "volar", "comida", "sol").
- Contextualiza las situaciones con la vida cotidiana infantil (la escuela, la familia, la naturaleza, animales, juegos).
${emojiInstruction}`,
      maxOpcionesPalabras: maxPalabras,
      instruccionesExplicacion: `TONO DE EXPLICACIÓN (PRIMARIO):
- Tono súper cálido, amigable, empático y festivo (voseo/tuteo respetuoso).
- Desdramatiza los errores con frases entusiastas: "¡Casi! Estás muy cerca..." o "¡Muy buena prueba! Mirémoslo juntos:".
- CRÍTICO: NUNCA felicites al alumno diciendo "¡Excelente!" o "¡Lo hiciste genial!" cuando esté leyendo la explicación de una respuesta que respondió MAL. Marca el detalle con amabilidad y explica el concepto de forma directa.`,
      contextualizacion: 'Contextualiza las situaciones dentro de entornos locales y cotidianos de Argentina, usando la región o provincia correspondiente al estudiante cuando sea relevante.',
      estrategiaMateria,
    }
  }

  if (nivel === 'Secundario') {
    const anioNum = Math.min(Math.max(numGrado, 1), 6)
    const edadMin = 11 + anioNum // 1er -> 12, 6to -> 17
    const edadMax = edadMin + 1   // 1er -> 13, 6to -> 18

    let etapaDesarrollo = 'Adolescencia temprana'
    if (anioNum >= 3 && anioNum <= 4) {
      etapaDesarrollo = 'Adolescencia media'
    } else if (anioNum >= 5) {
      etapaDesarrollo = 'Adolescencia tardía (Pre-universitaria)'
    }

    return {
      nivel: 'Secundario',
      grado: `${anioNum}º Año`,
      edadMin,
      edadMax,
      etapaDesarrollo,
      rolDocente: `Profesor/a de ${materia} del Nivel Secundario`,
      registroLinguistico: `LENGUAJE PARA ADOLESCENTES DE ${edadMin} A ${edadMax} AÑOS:
- Usa vocabulario disciplinar propio de ${materia} acorde a ${anioNum}º Año de secundaria.
- Las oraciones pueden ser compuestas y requerir relaciones de causa-efecto o análisis crítico.
- Evita el infantilismo, dirigiéndote al estudiante con empatía, claridad y estímulo al pensamiento autónomo.
- Las opciones pueden contener matices conceptuales bien diferenciados.`,
      maxOpcionesPalabras: 25,
      instruccionesExplicacion: `TONO DE EXPLICACIÓN (SECUNDARIO):
- Tono motivador, claro y con rigor académico adecuado para la secundaria.
- Explica la lógica paso a paso, destacando el principio teórico subyacente y cómo aplicarlo a futuros ejercicios.`,
      contextualizacion: 'Incluye referencias a situaciones reales, aplicaciones prácticas del conocimiento y contexto regional o nacional argentino cuando sea relevante.',
      estrategiaMateria,
    }
  }

  // Nivel Superior
  return {
    nivel: 'Superior',
    grado: gradoStr || 'Nivel Terciario / Universitario',
    edadMin: 18,
    edadMax: 99,
    etapaDesarrollo: 'Educación Superior / Adultos',
    rolDocente: `Profesor/a Universitario/a especialista en ${materia}`,
    registroLinguistico: `LENGUAJE DE EDUCACIÓN SUPERIOR:
- Emplea terminología técnica, formal y académica rigurosa de ${materia}.
- Plantea problemas con precisión conceptual y lenguaje universitario sin simplificaciones artificiales.`,
    maxOpcionesPalabras: 35,
    instruccionesExplicacion: `TONO DE EXPLICACIÓN (SUPERIOR):
- Tono académico, profesional y formalmente didáctico.
- Justifica formalmente basándote en axiomas, teoremas, definiciones oficiales o marcos teóricos de la disciplina.`,
    contextualizacion: 'Enfocado en estándares de la cátedra universitaria y aplicación profesional de la materia.',
    estrategiaMateria,
  }
}

export function buildEducationSystemPrompt({
  nivel,
  grado,
  materia,
  difficulty = 'intermedio',
}: {
  nivel?: string
  grado?: string
  materia: string
  difficulty?: string
}): string {
  const ctx = getEducationContext(nivel, grado, materia)

  let difficultyCognitiveInstruction = ''
  if (difficulty === 'basico') {
    difficultyCognitiveInstruction = `
NIVEL DE DIFICULTAD: BÁSICO
- Operaciones cognitivas: Reconocimiento directo, identificación de hechos clave, definiciones simples o aplicación inmediata de una sola regla.
- RESTRICCIÓN ABSOLUTA: Las preguntas deben ser sencillas dentro del nivel del alumno (${ctx.grado}, ${ctx.edadMin}-${ctx.edadMax} años).`
  } else if (difficulty === 'avanzado') {
    difficultyCognitiveInstruction = `
NIVEL DE DIFICULTAD: AVANZADO
- Operaciones cognitivas: Relación entre múltiples conceptos, análisis de casos o resolución de problemas aplicados.
- RESTRICCIÓN ABSOLUTA DE EDAD: Aunque la dificultad sea AVANZADA, el vocabulario, la sintaxis y las situaciones planteadas deben mantenerse ESTRICTAMENTE DENTRO DE LA CAPACIDAD DE COMPRENSIÓN de un estudiante de ${ctx.grado} (${ctx.edadMin}-${ctx.edadMax} años). JAMÁS uses temas ni conceptos de años/grados superiores.`
  } else {
    difficultyCognitiveInstruction = `
NIVEL DE DIFICULTAD: INTERMEDIO
- Operaciones cognitivas: Aplicación de conceptos a situaciones prácticas concretas, comparación de propiedades o interpretación de datos simples.
- RESTRICCIÓN ABSOLUTA: Mantén las preguntas totalmente adecuadas para un alumno de ${ctx.grado} (${ctx.edadMin}-${ctx.edadMax} años).`
  }

  return `ROL E IDENTIDAD DEL EVALUADOR:
${ctx.rolDocente}.
Tu objetivo es diseñar un cuestionario académico de alta calidad pedagógica adaptado al estudiante.

PÚBLICO OBJETIVO Y EDAD:
- Nivel Educativo: ${ctx.nivel} (${ctx.grado})
- Rango de Edad: ${ctx.nivel === 'Superior' ? 'Adultos (18+ años)' : `${ctx.edadMin} a ${ctx.edadMax} años (${ctx.etapaDesarrollo})`}

DISCIPLINA Y MATERIA:
${ctx.estrategiaMateria}

REGISTRO LINGÜÍSTICO Y FORMATO:
${ctx.registroLinguistico}
- Longitud máxima por opción de respuesta: aproximadamente ${ctx.maxOpcionesPalabras} palabras.

${difficultyCognitiveInstruction}

CONSTRUCCIÓN DE OPCIONES INCORRECTAS (DISTRACTORES DIAGNÓSTICOS):
- Cada opción incorrecta DEBE ser plausible y representar una confusión conceptual real y típica en estudiantes de ${ctx.grado} (${ctx.edadMin}-${ctx.edadMax} años), tales como: confusión de conceptos parecidos, inversión de operaciones, sobregeneralización o lecturas incompletas. Nunca uses distractores ilógicos o absurdos.

${ctx.instruccionesExplicacion}

REGLAS DE SEGURIDAD CONTRA ALUCINACIONES PEDAGÓGICAS Y FORMATO:
1. No incluyas contenido ni fórmulas que no pertenezcan al programa oficial del grado/año seleccionado (${ctx.grado}).
2. Cada enunciado debe tener una única respuesta indiscutiblemente correcta.
3. Las opciones incorrectas deben basarse en confusiones típicas de aprendizaje para esta edad y nivel.
4. REGLA OBLIGATORIA DE LATEX Y SÍMBOLOS DE MONEDA: NUNCA uses el símbolo '$' para representar dinero o precios (ej. NO escribas '$5' ni '5$'). Usa la palabra 'pesos' o 'USD' (ej. '5 pesos'). Reserva el símbolo '$' o '$$' ÚNICAMENTE para expresiones matemáticas cerradas (ej. '$x$', '$y$', '$f(x) = 5x$'). JAMÁS envuelvas oraciones enteras o frases en texto plano dentro de '$ ... $'.`
}

