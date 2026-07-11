-- Migration: Official Curriculum Table
-- Version: 007
-- Description: Structured K-12 curriculum for the cascade selector UI:
--              Nivel → Grado → Materia → Eje → Temas.
-- Data is intentionally empty here. Load your JSON curriculum via the
-- seeder script that will be built in a later sprint.

CREATE TABLE IF NOT EXISTS curriculum (
  id           SERIAL PRIMARY KEY,
  jurisdiccion TEXT   NOT NULL DEFAULT 'Salta',
  nivel        TEXT   NOT NULL,
  materia      TEXT   NOT NULL,
  grado        TEXT   NOT NULL,
  eje          TEXT   NOT NULL,
  temas        JSONB  NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT curriculum_nivel_check
    CHECK (nivel IN ('Primario', 'Secundario', 'Superior'))
);

-- Indexes optimized for the three cascade selector queries:
-- Q1: SELECT DISTINCT grado WHERE nivel = ?
-- Q2: SELECT DISTINCT materia WHERE nivel = ? AND grado = ?
-- Q3: SELECT eje, temas WHERE nivel = ? AND grado = ? AND materia = ?
CREATE INDEX IF NOT EXISTS idx_curriculum_nivel
  ON curriculum(nivel);

CREATE INDEX IF NOT EXISTS idx_curriculum_nivel_grado
  ON curriculum(nivel, grado);

CREATE INDEX IF NOT EXISTS idx_curriculum_selector
  ON curriculum(nivel, grado, materia);

CREATE INDEX IF NOT EXISTS idx_curriculum_jurisdiccion
  ON curriculum(jurisdiccion, nivel);

-- Auto-update updated_at (reuses trigger function from migration 001)
DROP TRIGGER IF EXISTS update_curriculum_updated_at ON curriculum;
CREATE TRIGGER update_curriculum_updated_at
  BEFORE UPDATE ON curriculum
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
