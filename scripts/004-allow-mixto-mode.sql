-- Migration: allow 'mixto' mode in quiz attempts and teacher quizzes.
-- Safe to run multiple times.

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'quiz_attempts'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%mode%'
  LOOP
    EXECUTE format('ALTER TABLE quiz_attempts DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'teacher_quizzes'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%mode%'
  LOOP
    EXECUTE format('ALTER TABLE teacher_quizzes DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END
$$;

ALTER TABLE quiz_attempts
  ADD CONSTRAINT quiz_attempts_mode_check
  CHECK (mode IN ('teorico', 'practico', 'mixto'));

ALTER TABLE teacher_quizzes
  ADD CONSTRAINT teacher_quizzes_mode_check
  CHECK (mode IN ('teorico', 'practico', 'mixto'));
