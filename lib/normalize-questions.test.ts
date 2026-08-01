import { describe, expect, it } from 'vitest'
import { normalizeQuestion, normalizeQuestions } from './normalize-questions'
import type { Question } from './types'

/** Shape of a quiz saved before the `type` field existed. */
const legacyMultipleChoice = {
  id: 'q1',
  topic: 'unknown',
  topicName: 'Unknown Topic',
  question: '¿Qué animal nace de un huevo?',
  explanation: 'La gallina es ovípara.',
  options: ['La vaca', 'El gato', 'La gallina', 'El perro'],
  correctAnswer: 2,
} as unknown as Question

describe('normalizeQuestion', () => {
  it('types a legacy question with options as multiple_choice', () => {
    expect(normalizeQuestion(legacyMultipleChoice).type).toBe('multiple_choice')
  })

  it('keeps the rest of the question untouched', () => {
    const result = normalizeQuestion(legacyMultipleChoice) as Extract<Question, { type: 'multiple_choice' }>
    expect(result.correctAnswer).toBe(2)
    expect(result.options).toEqual(['La vaca', 'El gato', 'La gallina', 'El perro'])
    expect(result.question).toBe('¿Qué animal nace de un huevo?')
  })

  it('leaves an already typed question alone', () => {
    const typed = { ...legacyMultipleChoice, type: 'numeric' } as unknown as Question
    expect(normalizeQuestion(typed)).toBe(typed)
  })

  it('infers short_answer from acceptedAnswers', () => {
    const legacy = { id: 'q2', question: '¿Capital?', acceptedAnswers: ['Salta'] } as unknown as Question
    expect(normalizeQuestion(legacy).type).toBe('short_answer')
  })

  it('infers true_false from a boolean correctAnswer', () => {
    const legacy = { id: 'q3', question: 'El sol es una estrella', correctAnswer: true } as unknown as Question
    expect(normalizeQuestion(legacy).type).toBe('true_false')
  })

  it('infers numeric from a number correctAnswer with no options', () => {
    const legacy = { id: 'q4', question: '¿Cuánto es 7²?', correctAnswer: 49 } as unknown as Question
    expect(normalizeQuestion(legacy).type).toBe('numeric')
  })

  it('falls back to an empty multiple_choice when there is nothing to infer from', () => {
    const legacy = { id: 'q5', question: 'Rota' } as unknown as Question
    const result = normalizeQuestion(legacy) as Extract<Question, { type: 'multiple_choice' }>
    expect(result.type).toBe('multiple_choice')
    expect(result.options).toEqual([])
  })

  it('normalizes a whole list and tolerates a non-array', () => {
    expect(normalizeQuestions([legacyMultipleChoice])).toHaveLength(1)
    expect(normalizeQuestions(undefined as unknown as Question[])).toEqual([])
  })
})
