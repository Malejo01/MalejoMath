-- Migration: global anonymized memory for curriculum structure patterns.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS curriculum_structure_patterns (
  id SERIAL PRIMARY KEY,
  pattern_hash TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'es',
  source_kind TEXT NOT NULL DEFAULT 'teacher_program',
  signature JSONB NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 1,
  quality_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_patterns_language ON curriculum_structure_patterns(language);
CREATE INDEX IF NOT EXISTS idx_curriculum_patterns_source ON curriculum_structure_patterns(source_kind);
CREATE INDEX IF NOT EXISTS idx_curriculum_patterns_quality ON curriculum_structure_patterns(quality_score DESC);
