-- Migration: NextAuth.js v5 Compatibility + Role Refactor
-- Version: 006
-- Description: Adapt users table for NextAuth JWT strategy. Add OAuth accounts
--              table. Migrate role values from English to Spanish enum.
--              Run this AFTER ensuring the DB is clean (no Clerk users remain).

-- ─── 1. ADAPT TABLE: users ───────────────────────────────────────────────────
-- NextAuth needs: name, email_verified, image
-- New fields needed: is_onboarded
-- Role values migrate: 'student' → 'ALUMNO' | 'teacher' → 'DOCENTE'
-- NULL role = user authenticated but hasn't completed onboarding

-- Step A: Add new columns (safe, no constraint conflicts)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name           TEXT,
  ADD COLUMN IF NOT EXISTS email_verified TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image          TEXT,
  ADD COLUMN IF NOT EXISTS is_onboarded   BOOLEAN NOT NULL DEFAULT false;

-- Step B: Drop the OLD constraint FIRST (was student|teacher),
--         so the UPDATE below doesn't violate it.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;

-- Step C: Migrate existing role values now that the old constraint is gone.
UPDATE users SET role = 'ALUMNO'  WHERE role = 'student';
UPDATE users SET role = 'DOCENTE' WHERE role = 'teacher';

-- Step D: Add the new constraint with Spanish enum.
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('ALUMNO', 'DOCENTE'));

-- ─── 2. NEW TABLE: accounts (OAuth provider link) ────────────────────────────
-- Stores the link between a user and their Google OAuth account.
-- PK is composite (provider, provider_account_id) so multiple providers can
-- be added in the future without schema changes.
CREATE TABLE IF NOT EXISTS accounts (
  user_id             TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT    NOT NULL,
  provider            TEXT    NOT NULL,
  provider_account_id TEXT    NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  PRIMARY KEY (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ─── 3. NEW TABLE: verification_tokens ───────────────────────────────────────
-- Required by the NextAuth adapter contract. Unused in a Google-only JWT flow
-- but prevents runtime errors if the adapter is swapped in later.
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT        NOT NULL,
  token      TEXT        NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);
