-- Malejo Math Database Schema
-- Version: 002
-- Description: Add user roles and teacher programs

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'
  CHECK (role IN ('student', 'teacher'));

CREATE TABLE IF NOT EXISTS teacher_programs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  pedagogy_profile JSONB NOT NULL,
  units JSONB NOT NULL,
  source_file_name TEXT,
  source_mime_type TEXT,
  source_file_size_bytes INTEGER,
  source_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_program_uploads (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_data BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_programs_user ON teacher_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_programs_created ON teacher_programs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_uploads_exp ON teacher_program_uploads(expires_at);

DROP TRIGGER IF EXISTS update_teacher_programs_updated_at ON teacher_programs;
CREATE TRIGGER update_teacher_programs_updated_at
  BEFORE UPDATE ON teacher_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
