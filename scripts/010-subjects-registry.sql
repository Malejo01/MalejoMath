-- MaestrIA Database Schema
-- Version: 010
-- Description: Lightweight taxonomy table unifying display metadata (name, icon,
--              color) for both curated curriculum subjects and free-text
--              teacher-entered subjects. Does NOT introduce FKs on the existing
--              free-text subject/materia columns (curriculum.materia,
--              quiz_attempts.subject, topic_mastery.subject, etc.) — those stay
--              TEXT. This table is a lookup registry, populated opportunistically
--              (curriculum backfill + teacher program creation) and read with
--              graceful fallback to the raw string when a subject isn't found.

CREATE TABLE IF NOT EXISTS subjects (
  id                 SERIAL PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  display_name       TEXT NOT NULL,
  source             TEXT NOT NULL CHECK (source IN ('curriculum', 'teacher')),
  icon_name          TEXT NOT NULL DEFAULT 'book-open',
  color_name         TEXT NOT NULL DEFAULT 'teal',
  nivel              TEXT,
  teacher_program_id INTEGER REFERENCES teacher_programs(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_source ON subjects(source);
CREATE INDEX IF NOT EXISTS idx_subjects_nivel ON subjects(nivel);

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
