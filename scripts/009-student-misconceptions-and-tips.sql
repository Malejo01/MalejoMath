-- Malejo Math Database Schema
-- Version: 009
-- Description: Create student_misconceptions table for storing tips and misconception patterns

CREATE TABLE IF NOT EXISTS student_misconceptions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  misconception_type TEXT NOT NULL,
  tip TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_misconceptions_user ON student_misconceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_student_misconceptions_topic ON student_misconceptions(user_id, topic_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_student_misconceptions_updated_at ON student_misconceptions;
CREATE TRIGGER update_student_misconceptions_updated_at
  BEFORE UPDATE ON student_misconceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
