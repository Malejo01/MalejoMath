-- MaestrIA Database Schema
-- Version: 014
-- Description: Promote nivel/grado from free text inside pedagogy_profile to
--              real columns on teacher_programs. Until now a teacher subject
--              only existed as an uploaded file, so "1ro de Ingeniería" lived
--              as prose in the JSONB profile and nothing could query it. The
--              new subject wizard starts from nivel + grado to pull topics out
--              of the `curriculum` table, and stage 2 (aulas) needs to match a
--              classroom's grade against the program's — both need columns.
--
--              Nullable on purpose: programs created before this migration
--              have no reliable nivel/grado. The teacher dashboard flags them
--              and the wizard asks for the data on the next edit. See
--              scripts/backfill-program-nivel-grado.ts for the best-effort
--              inference that runs first.
--
--              created_from records which path built the program so the UI can
--              tell "armada desde el diseño curricular" from "subida en PDF"
--              without guessing from source_file_name.

ALTER TABLE teacher_programs
  ADD COLUMN IF NOT EXISTS nivel TEXT
    CHECK (nivel IN ('Primario', 'Secundario', 'Superior')),
  ADD COLUMN IF NOT EXISTS grado TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiccion TEXT,
  ADD COLUMN IF NOT EXISTS created_from TEXT NOT NULL DEFAULT 'upload'
    CHECK (created_from IN ('upload', 'curriculum', 'manual'));

-- Stage 2 lists a teacher's programs filtered by nivel/grado when creating an
-- aula; this covers that lookup and the dashboard's "materias sin completar".
CREATE INDEX IF NOT EXISTS idx_teacher_programs_user_nivel_grado
  ON teacher_programs(user_id, nivel, grado);
