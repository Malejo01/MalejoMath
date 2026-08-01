import type { Question } from '@/lib/types'

/**
 * Question[] blobs persisted before the multi-type migration (teacher_quizzes
 * JSONB rows, Zustand localStorage) have no `type` field — they were always
 * multiple_choice. Call this on every historical Question read so the rest of
 * the app can rely on `type` always being present.
 */
export function normalizeLegacyQuestion(raw: any): Question {
  if (raw && typeof raw === 'object' && raw.type) {
    return raw as Question
  }
  return { ...raw, type: 'multiple_choice' } as Question
}

export function normalizeLegacyQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeLegacyQuestion)
}
