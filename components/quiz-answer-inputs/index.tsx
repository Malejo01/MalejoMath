'use client'

import type { Question } from '@/lib/types'
import { MultipleChoiceInput } from './multiple-choice-input'
import { ShortAnswerInput } from './short-answer-input'
import { TrueFalseInput } from './true-false-input'
import { NumericInput } from './numeric-input'

export type AnswerSelection =
  | { type: 'multiple_choice'; value: number | null }
  | { type: 'short_answer'; value: string }
  | { type: 'true_false'; value: boolean | null }
  | { type: 'numeric'; value: number | null }

export function emptySelectionFor(question: Question): AnswerSelection {
  switch (question.type) {
    case 'multiple_choice':
      return { type: 'multiple_choice', value: null }
    case 'short_answer':
      return { type: 'short_answer', value: '' }
    case 'true_false':
      return { type: 'true_false', value: null }
    case 'numeric':
      return { type: 'numeric', value: null }
  }
}

interface AnswerInputProps {
  question: Question
  selection: AnswerSelection
  submitted: boolean
  onChange: (selection: AnswerSelection) => void
  isCorrect?: boolean | null
  disabled?: boolean
  /** Teacher preview inline editor (multiple_choice only, see quiz-engine.tsx). */
  editing?: boolean
  editedOptions?: string[]
  editedCorrectAnswer?: number
  onEditOption?: (index: number, value: string) => void
  onEditCorrectAnswer?: (index: number) => void
}

export function AnswerInput({
  question,
  selection,
  submitted,
  onChange,
  isCorrect,
  disabled,
  editing,
  editedOptions,
  editedCorrectAnswer,
  onEditOption,
  onEditCorrectAnswer,
}: AnswerInputProps) {
  if (question.type === 'multiple_choice' && selection.type === 'multiple_choice') {
    return (
      <MultipleChoiceInput
        question={question}
        selected={selection.value}
        submitted={submitted}
        disabled={disabled}
        editing={editing}
        editedOptions={editedOptions}
        editedCorrectAnswer={editedCorrectAnswer}
        onEditOption={onEditOption}
        onEditCorrectAnswer={onEditCorrectAnswer}
        onSelect={(value) => onChange({ type: 'multiple_choice', value })}
      />
    )
  }

  if (question.type === 'true_false' && selection.type === 'true_false') {
    return (
      <TrueFalseInput
        question={question}
        selected={selection.value}
        submitted={submitted}
        disabled={disabled}
        onSelect={(value) => onChange({ type: 'true_false', value })}
      />
    )
  }

  if (question.type === 'numeric' && selection.type === 'numeric') {
    return (
      <NumericInput
        question={question}
        value={selection.value}
        submitted={submitted}
        disabled={disabled}
        isCorrect={isCorrect}
        onChange={(value) => onChange({ type: 'numeric', value })}
      />
    )
  }

  if (question.type === 'short_answer' && selection.type === 'short_answer') {
    return (
      <ShortAnswerInput
        question={question}
        value={selection.value}
        submitted={submitted}
        disabled={disabled}
        isCorrect={isCorrect}
        onChange={(value) => onChange({ type: 'short_answer', value })}
      />
    )
  }

  return null
}
