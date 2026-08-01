-- MaestrIA Database Schema
-- Version: 011
-- Description: Persist the student's nivel/grado so CurriculumSelector and
--              generate-quiz can pre-seed selection across sessions. Nullable —
--              only ALUMNO accounts that complete the onboarding nivel/grado
--              step get these set; DOCENTE and pre-existing users stay NULL.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nivel TEXT CHECK (nivel IN ('Primario', 'Secundario', 'Superior')),
  ADD COLUMN IF NOT EXISTS grado TEXT;
