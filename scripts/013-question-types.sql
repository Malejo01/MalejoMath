-- MaestrIA Database Schema
-- Version: 013
-- Description: Support non-multiple-choice question/answer types. Existing
--              integer columns become nullable and are preserved for
--              backward-compatible reads of pre-migration rows. New rows of
--              any type (including multiple_choice) may write into
--              answer_payload; multiple_choice rows keep writing the legacy
--              columns too so nothing that reads them directly breaks.

ALTER TABLE quiz_answers
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false', 'numeric')),
  ADD COLUMN IF NOT EXISTS answer_payload JSONB;

ALTER TABLE quiz_answers
  ALTER COLUMN options DROP NOT NULL,
  ALTER COLUMN selected_answer DROP NOT NULL,
  ALTER COLUMN correct_answer DROP NOT NULL;

-- answer_payload shape per question_type (documented, not enforced by CHECK —
-- Zod validates at the API boundary before INSERT):
--   multiple_choice: { options: string[], selectedAnswer: number, correctAnswer: number }
--   short_answer:    { selectedText: string, acceptedAnswers: string[] }
--   true_false:      { selectedAnswer: boolean, correctAnswer: boolean }
--   numeric:         { selectedValue: number, correctAnswer: number, tolerance: number | null }

CREATE INDEX IF NOT EXISTS idx_quiz_answers_type ON quiz_answers(question_type);
