//import type { Question, TeacherQuiz } from '@/lib/types'

const MAX_CATEGORY_TOPICS = 5

function normalizeMathJaxDelimiters(text: string): string {
  let normalized = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, expr) => `\\[${expr}\\]`)

  normalized = normalized.replace(/(^|[^\\])\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_match, prefix, expr) => {
    return `${prefix}\\(${expr}\\)`
  })

  return normalized
}

function escapeGiftText(text: string): string {
  return normalizeMathJaxDelimiters(text)
    .replace(/\r\n/g, '\n')
    .replace(/(?<!\\)([~=#{}:])/g, '\\$1')
    .trim()
}

function sanitizePathSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toSlug(value: string): string {
  const cleaned = sanitizePathSegment(value)
  if (!cleaned) return 'sin-categoria'

  return cleaned
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractTopicNames(quiz: TeacherQuiz): string[] {
  const selected = Array.isArray(quiz.selectedTopics)
    ? quiz.selectedTopics.map((topic) => sanitizePathSegment(topic.name)).filter(Boolean)
    : []

  if (selected.length > 0) {
    return Array.from(new Set(selected)).slice(0, MAX_CATEGORY_TOPICS)
  }

  const fromQuestions = quiz.questions
    .map((question) => sanitizePathSegment(question.topicName || question.topic))
    .filter(Boolean)

  return Array.from(new Set(fromQuestions)).slice(0, MAX_CATEGORY_TOPICS)
}

function buildCategoryPath(quiz: TeacherQuiz): string {
  const subject = sanitizePathSegment(quiz.subjectName) || 'Materia'
  const topicNames = extractTopicNames(quiz)

  if (topicNames.length === 0) {
    return `$course$/${subject}`
  }

  return `$course$/${subject}/${topicNames.join('-')}`
}

function buildQuestionBlock(question: Question, index: number): string {
  const questionTitle = `Q${index + 1}`
  const questionText = escapeGiftText(question.question)
  const correctIndex = Number.isInteger(question.correctAnswer) ? question.correctAnswer : -1

  const options = question.options.map((option, optionIndex) => {
    const prefix = optionIndex === correctIndex ? '=' : '~'
    return `${prefix}${escapeGiftText(option)}`
  })

  if (correctIndex < 0 || correctIndex >= question.options.length) {
    throw new Error(`La pregunta ${index + 1} no tiene una respuesta correcta valida.`)
  }

  const generalFeedback = question.explanation.trim().length > 0
    ? `\n#### ${escapeGiftText(question.explanation)}`
    : ''

  return `::${questionTitle}::${questionText} {\n${options.join('\n')}${generalFeedback}\n}`
}

export function convertQuizToGift(quiz: TeacherQuiz): string {
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('El cuestionario no tiene preguntas para exportar.')
  }

  const categoryLine = `$CATEGORY: ${buildCategoryPath(quiz)}`
  const questionBlocks = quiz.questions.map((question, index) => buildQuestionBlock(question, index))

  return [categoryLine, '', questionBlocks.join('\n\n'), ''].join('\n')
}

export function buildMoodleFileName(quiz: TeacherQuiz): string {
  const subjectSlug = toSlug(quiz.subjectName || quiz.title)
  const topicSlugs = extractTopicNames(quiz).map(toSlug).filter(Boolean)
  const topicPart = topicSlugs.length > 0 ? topicSlugs.join('-') : 'general'

  return `${subjectSlug}_${topicPart}.txt`
}

export function downloadGiftFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportQuizToMoodleGift(quiz: TeacherQuiz): string {
  const giftContent = convertQuizToGift(quiz)
  const fileName = buildMoodleFileName(quiz)
  downloadGiftFile(giftContent, fileName)
  return fileName
}


