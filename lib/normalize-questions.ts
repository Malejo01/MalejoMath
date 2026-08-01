import type { Question } from './types'

/**
 * Quizzes saved before the multi-type question feature landed carry no `type`
 * field at all — they were all multiple choice. Everything downstream switches
 * on `type` (emptySelectionFor, AnswerInput, the grading helpers), so an
 * untyped question silently renders no answer UI whatsoever: the student sees
 * the statement and nothing to click.
 *
 * Normalising at the point where questions enter the app fixes every consumer
 * at once instead of scattering `?? 'multiple_choice'` fallbacks around.
 */
export function normalizeQuestion(question: Question): Question {
  if (question && (question as { type?: string }).type) return question

  const raw = question as unknown as Record<string, unknown>

  if (Array.isArray(raw.acceptedAnswers)) {
    return { ...(raw as object), type: 'short_answer' } as Question
  }
  if (Array.isArray(raw.options)) {
    return { ...(raw as object), type: 'multiple_choice' } as Question
  }
  if (typeof raw.correctAnswer === 'boolean') {
    return { ...(raw as object), type: 'true_false' } as Question
  }
  if (typeof raw.correctAnswer === 'number') {
    return { ...(raw as object), type: 'numeric' } as Question
  }

  // Nothing to go on — multiple choice is what every legacy quiz was.
  return { ...(raw as object), type: 'multiple_choice', options: [] } as unknown as Question
}

export function normalizeQuestions(questions: Question[]): Question[] {
  if (!Array.isArray(questions)) return []
  return questions.map(normalizeQuestion)
}
