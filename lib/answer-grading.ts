import type { MultipleChoiceQuestion, NumericQuestion, TrueFalseQuestion } from '@/lib/types'

export function isCorrectMultipleChoice(question: MultipleChoiceQuestion, selected: number): boolean {
  return selected === question.correctAnswer
}

export function isCorrectTrueFalse(question: TrueFalseQuestion, selected: boolean): boolean {
  return selected === question.correctAnswer
}

export function isCorrectNumeric(question: NumericQuestion, selected: number): boolean {
  const tolerance = question.tolerance ?? 0
  return Math.abs(selected - question.correctAnswer) <= tolerance
}
