import { describe, expect, it } from 'vitest'
import { normalizeQuestionText, numericSignature } from './question-dedup'

describe('normalizeQuestionText', () => {
  it('ignores case, LaTeX and punctuation', () => {
    expect(normalizeQuestionText('¿Cuál es el resultado de $7^2$?'))
      .toBe(normalizeQuestionText('cual es el resultado de 7 2'))
  })

  it('does NOT catch the same exercise reworded — that is what numericSignature is for', () => {
    const a = normalizeQuestionText('Si calculamos el cuadrado de 7, es decir 7², ¿qué número obtenemos?')
    const b = normalizeQuestionText('¿Cuál es el resultado de 7²?')
    expect(a).not.toBe(b)
  })
})

describe('numericSignature', () => {
  const topic = { topic: 'potenciacion', topicName: 'Potenciación' }

  it('matches the same exercise across question types', () => {
    const shortAnswer = numericSignature({
      ...topic,
      question: 'Si calculamos el cuadrado de 7, es decir 7², ¿qué número obtenemos?',
    })
    const multipleChoice = numericSignature({ ...topic, question: '¿Cuál es el resultado de 7²?' })

    expect(shortAnswer).not.toBeNull()
    expect(shortAnswer).toBe(multipleChoice)
  })

  it('treats the LaTeX and the superscript spellings as the same exercise', () => {
    expect(numericSignature({ ...topic, question: '¿Cuánto es $7^2$?' }))
      .toBe(numericSignature({ ...topic, question: '¿Cuánto es 7²?' }))
  })

  it('keeps different operations on the same numbers apart', () => {
    expect(numericSignature({ ...topic, question: '¿Cuánto es 7 + 2?' }))
      .not.toBe(numericSignature({ ...topic, question: '¿Cuánto es 7 - 2?' }))
  })

  it('keeps different numbers apart', () => {
    expect(numericSignature({ ...topic, question: '¿Cuál es el resultado de 7²?' }))
      .not.toBe(numericSignature({ ...topic, question: '¿Cuál es el resultado de 8²?' }))
  })

  it('does not collide across topics', () => {
    expect(numericSignature({ topic: 'potenciacion', question: 'Con 7 y 2' }))
      .not.toBe(numericSignature({ topic: 'fracciones', question: 'Con 7 y 2' }))
  })

  it('ignores the order the numbers appear in', () => {
    expect(numericSignature({ ...topic, question: 'Sumá 2 y 15' }))
      .toBe(numericSignature({ ...topic, question: 'Sumá 15 y 2' }))
  })

  it('returns null for a statement with no numbers', () => {
    expect(numericSignature({ ...topic, question: '¿Qué es una potencia?' })).toBeNull()
  })
})
