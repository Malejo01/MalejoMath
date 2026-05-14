-- Malejo Math Database Schema
-- Version: 001
-- Description: Create initial tables for user progress tracking

-- Table: users
-- Stores user information synced from Clerk
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: topic_mastery
-- Tracks the highest level achieved by each user in each topic
-- Rule: Only updates if score >= 6
CREATE TABLE IF NOT EXISTS topic_mastery (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,                  -- e.g., 'Álgebra I', 'Análisis Matemático I'
  topic_id TEXT NOT NULL,                 -- e.g., 'matrices-gauss'
  topic_name TEXT NOT NULL,               -- e.g., 'Método de Gauss'
  highest_score DECIMAL(4,2) DEFAULT 0,   -- Best score achieved (0-10)
  attempts_count INTEGER DEFAULT 0,        -- Total attempts on this topic
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,   -- When score >= 6 was first achieved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject, topic_id)
);

-- Table: quiz_attempts
-- Records each completed quiz with summary statistics
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,                  -- e.g., 'Álgebra I'
  mode TEXT NOT NULL CHECK (mode IN ('teorico', 'practico', 'mixto')),
  topics TEXT[] NOT NULL,                 -- Array of topic names selected
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  score DECIMAL(4,2) NOT NULL,            -- Final score (0-10)
  passed BOOLEAN NOT NULL,                -- true if score >= 6
  duration_seconds INTEGER,               -- Time taken to complete
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: quiz_answers
-- Stores each individual answer for detailed review
CREATE TABLE IF NOT EXISTS quiz_answers (
  id SERIAL PRIMARY KEY,
  quiz_attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,        -- Order in the quiz (1, 2, 3...)
  question_id TEXT NOT NULL,              -- Original question ID from Gemini
  topic_name TEXT NOT NULL,
  question_text TEXT NOT NULL,            -- The question with LaTeX
  options JSONB NOT NULL,                 -- Array of options
  selected_answer INTEGER NOT NULL,       -- Index of user's answer (0-based)
  correct_answer INTEGER NOT NULL,        -- Index of correct answer (0-based)
  is_correct BOOLEAN NOT NULL,
  explanation TEXT,                       -- Brief explanation shown after answering
  error_explanation TEXT,                 -- Detailed explanation from "Explicar Error" (if requested)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user ON topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_subject ON topic_mastery(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON quiz_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(quiz_attempt_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_mastery_updated_at ON topic_mastery;
CREATE TRIGGER update_topic_mastery_updated_at
  BEFORE UPDATE ON topic_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
