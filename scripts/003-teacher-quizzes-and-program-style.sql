-- Malejo Math Database Schema
-- Version: 003
-- Description: Add editable style metadata for teacher programs and saved teacher quizzes

ALTER TABLE teacher_programs
  ADD COLUMN IF NOT EXISTS icon_name TEXT NOT NULL DEFAULT 'book-open',
  ADD COLUMN IF NOT EXISTS color_name TEXT NOT NULL DEFAULT 'teal';

CREATE TABLE IF NOT EXISTS teacher_quizzes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_program_id INTEGER NOT NULL REFERENCES teacher_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('teorico', 'practico', 'mixto')),
  status TEXT NOT NULL CHECK (status IN ('saved', 'pending_share')),
  selected_topics JSONB NOT NULL,
  question_count INTEGER NOT NULL,
  questions JSONB NOT NULL,
  pedagogy_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_user ON teacher_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_program ON teacher_quizzes(teacher_program_id);
CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_mode ON teacher_quizzes(mode);
CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_created ON teacher_quizzes(created_at DESC);

DROP TRIGGER IF EXISTS update_teacher_quizzes_updated_at ON teacher_quizzes;
CREATE TRIGGER update_teacher_quizzes_updated_at
  BEFORE UPDATE ON teacher_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
