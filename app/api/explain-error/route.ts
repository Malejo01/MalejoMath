import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { getEducationContext } from '@/lib/education-context'

export async function POST(req: Request) {
  const {
    question,
    selectedAnswer,
    correctAnswer,
    options,
    topic,
    subject,
    pedagogyContext,
    nivel: rawNivel,
    grado: rawGrado,
  } = await req.json()

  let nivel = rawNivel
  let grado = rawGrado

  if (typeof pedagogyContext === 'string') {
    if (!nivel) {
      const matchNivel = pedagogyContext.match(/Nivel:\s*([a-zA-Záéíóúñ]+)/i)
      if (matchNivel && matchNivel[1]) nivel = matchNivel[1]
    }
    if (!grado) {
      const matchGrado = pedagogyContext.match(/Grado(?:\/Año)?:\s*([^\s|]+(?:\s+[^\s|]+)*)/i)
      if (matchGrado && matchGrado[1]) grado = matchGrado[1]
    }
  }

  const eduCtx = getEducationContext(nivel, grado, subject || 'la materia')

  // Contexto específico según la materia
  let subjectContext = ''
  if (subject?.toLowerCase().includes('álgebra') || subject?.toLowerCase().includes('algebra')) {
    subjectContext = `
CONTEXTO DE ÁLGEBRA:
- Para sistemas de ecuaciones, considera el método de Gauss (escalonamiento).
- Considera notación de lógica y conjuntos si aplica.`
  } else if (subject?.toLowerCase().includes('análisis') || subject?.toLowerCase().includes('analisis')) {
    subjectContext = `
CONTEXTO DE ANÁLISIS MATEMÁTICO:
- Aplica reglas de derivadas, límites o integrales según corresponda.`
  }

  const pedagogySection = typeof pedagogyContext === 'string' && pedagogyContext.trim().length > 0
    ? `\nREFERENCIAS PEDAGÓGICAS ADICIONALES:\n${pedagogyContext}\n`
    : ''

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    messages: [
      {
        role: 'user',
        content: `ROL E IDENTIDAD:
${eduCtx.rolDocente}.

OBJETIVO:
Un estudiante de ${eduCtx.grado} (${eduCtx.nivel === 'Superior' ? 'Educación Superior' : `edad ${eduCtx.edadMin}-${eduCtx.edadMax} años`}) respondió incorrectamente la siguiente pregunta. Tu tarea es explicarle el error con empatía, calidez y un lenguaje perfectamente adaptado a su edad y nivel educativo.

${eduCtx.registroLinguistico}
${eduCtx.instruccionesExplicacion}

${subjectContext}
TEMA: ${topic}
MATERIA: ${subject || 'General'}
${pedagogySection}

PREGUNTA:
${question}

OPCIONES:
${options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

RESPUESTA DEL ESTUDIANTE: ${String.fromCharCode(65 + selectedAnswer)}) ${options[selectedAnswer]}
RESPUESTA CORRECTA: ${String.fromCharCode(65 + correctAnswer)}) ${options[correctAnswer]}

Explica de forma muy visual, cercana y estructurada usando EXACTAMENTE este formato de 4 secciones:

## 1. 🧠 ¿Por qué elegiste esta opción? (Diagnóstico de tu respuesta)
Analiza específicamente la opción que eligió el estudiante (${String.fromCharCode(65 + selectedAnswer)}: "${options[selectedAnswer]}"). Explícale de forma empática por qué es muy común cometer esa confusión a su edad. Marca el detalle con calidez ("¡Atención!", "¡Casi!", "Es muy normal confundirse aquí porque..."). NUNCA lo felicites por haberse equivocado (no digas "¡Excelente!" ni "¡Lo hiciste genial!").

## 2. 💡 Explicación paso a paso
Muestra cómo llegar a la respuesta correcta (${String.fromCharCode(65 + correctAnswer)}: "${options[correctAnswer]}") con un ejemplo claro y elementos visuales/emojis (🌱, ☀️, 💧, 🔢 según la materia). Sé conciso e ilustrativo.

## 3. 📌 ¿Por qué la respuesta correcta es la única válida?
Resume en 1 o 2 frases el concepto clave.

## 4. ⭐ Tip o consejo para recordar
Un tip práctico, regla mnemotécnica o truco amigable para no volver a tener esa confusión en el futuro.

REGLAS CRÍTICAS:
- Si es Nivel Primario o Inicial, usa emojis sutiles (🌱, ☀️, 💧, 🐥, 🔢) para hacer la lectura súper cálida y visual.
- Usa notación LaTeX solo si hay fórmulas ($x^2$, $\\frac{a}{b}$).
- NUNCA agregues notas ni aclaraciones entre paréntesis sobre LaTeX (ej: NO escribas "(Nota: En este caso no aplica notación LaTeX)").
- Sé muy ágil y directo al punto.`
      }
    ],
    maxOutputTokens: 4000,
    temperature: 0.5,
  })

  // Extraer sección 1 y sección 4 para guardar apunte / diagnóstico
  let misconceptionType = 'Confusión conceptual'
  let tipText = ''

  const sec1Match = text.match(/## 1\.[^\n]*\n([\s\S]*?)(?=## 2\.|$)/i)
  if (sec1Match && sec1Match[1]) {
    const rawLines = sec1Match[1].split('\n').map(l => l.trim()).filter(Boolean)
    if (rawLines.length > 0) {
      misconceptionType = rawLines[0].replace(/^[-*•\s]+/, '').substring(0, 110)
    }
  }

  const sec4Match = text.match(/## 4\.[^\n]*\n([\s\S]*?)$/i)
  if (sec4Match && sec4Match[1]) {
    tipText = sec4Match[1].trim()
  }

  return Response.json({
    explanation: text,
    misconceptionType,
    tipText: tipText || text.substring(0, 200),
  })
}

