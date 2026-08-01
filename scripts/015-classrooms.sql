-- MaestrIA Database Schema
-- Version: 015
-- Description: Aulas (stage 2 of the Docente–Alumnos system).
--
--              A classroom belongs to exactly one teacher program, so its
--              join code hands the student a specific subject. Students join
--              either with their Google account or as a guest, which is why
--              users.email becomes nullable: a guest row is a real user row
--              (so every FK — quiz_attempts, topic_mastery, tips — keeps
--              working untouched) that simply has no email yet. When the guest
--              later signs in, the rows are merged instead of duplicated.

-- ─── 1. Guest users ──────────────────────────────────────────────────────────
-- Postgres allows multiple NULLs in a UNIQUE column, so dropping NOT NULL is
-- enough — no partial index needed, and auth.ts's "delete stale row by email"
-- can never match a guest.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false,
  -- Set when a guest is absorbed into a signed-in account, so the merge is
  -- traceable and repeat claims are cheap to detect.
  ADD COLUMN IF NOT EXISTS claimed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest) WHERE is_guest = true;

-- ─── 2. Classrooms ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classrooms (
  id                 SERIAL PRIMARY KEY,
  teacher_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_program_id INTEGER NOT NULL REFERENCES teacher_programs(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  -- 6 chars from an unambiguous alphabet (no I/O/0/1). Regenerating the code
  -- is how a teacher revokes access without closing the aula.
  join_code          TEXT NOT NULL UNIQUE,
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_program ON classrooms(teacher_program_id);

DROP TRIGGER IF EXISTS update_classrooms_updated_at ON classrooms;
CREATE TRIGGER update_classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── 3. Members ──────────────────────────────────────────────────────────────
-- is_verified distinguishes a Google-authenticated student from a guest who
-- simply typed a name; the teacher's roster shows the difference rather than
-- pretending both are equally trustworthy.
CREATE TABLE IF NOT EXISTS classroom_members (
  id           SERIAL PRIMARY KEY,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (classroom_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_members_user ON classroom_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom ON classroom_members(classroom_id, status);

DROP TRIGGER IF EXISTS update_classroom_members_updated_at ON classroom_members;
CREATE TRIGGER update_classroom_members_updated_at
  BEFORE UPDATE ON classroom_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── 4. Assignments ──────────────────────────────────────────────────────────
-- Publishing a saved teacher_quiz into an aula. NULL opens_at means "available
-- now", NULL due_at means "no deadline", NULL max_attempts means "unlimited".
CREATE TABLE IF NOT EXISTS classroom_assignments (
  id              SERIAL PRIMARY KEY,
  classroom_id    INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_quiz_id INTEGER NOT NULL REFERENCES teacher_quizzes(id) ON DELETE CASCADE,
  opens_at        TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  max_attempts    INTEGER CHECK (max_attempts IS NULL OR max_attempts > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (classroom_id, teacher_quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_assignments_classroom ON classroom_assignments(classroom_id);

DROP TRIGGER IF EXISTS update_classroom_assignments_updated_at ON classroom_assignments;
CREATE TRIGGER update_classroom_assignments_updated_at
  BEFORE UPDATE ON classroom_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── 5. Attempts made inside an aula ─────────────────────────────────────────
-- Nullable on purpose: free practice keeps writing quiz_attempts with these
-- columns empty, so the student's own history is unchanged. The teacher's
-- dashboard reads the same table filtered by classroom_id.
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS classroom_id   INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_id  INTEGER REFERENCES classroom_assignments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_classroom ON quiz_attempts(classroom_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_assignment_user ON quiz_attempts(assignment_id, user_id);

-- ─── 6. AI generation log (guest rate limit) ─────────────────────────────────
-- A guest can burn Gemini credit without being identifiable, so generation is
-- capped per rolling day. One row per generated quiz; also useful for auditing
-- consumption per user later.
CREATE TABLE IF NOT EXISTS ai_generation_log (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_log_user_time ON ai_generation_log(user_id, created_at DESC);
