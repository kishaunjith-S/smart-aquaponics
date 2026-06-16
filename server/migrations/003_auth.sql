-- 003_auth.sql
-- User accounts (dashboard login) + API keys (programmatic device auth)

-- pgcrypto gives us gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     TEXT         NOT NULL,
    email         TEXT         UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── API Keys ───────────────────────────────────────────────────────────────
-- Devices (Pi uploaders, third-party scripts) authenticate via API keys.
-- We store a bcrypt hash of the key — never the plaintext — so a DB leak
-- doesn't immediately compromise all devices.
CREATE TABLE IF NOT EXISTS api_keys (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT         NOT NULL,
    key_hash      TEXT         NOT NULL UNIQUE,
    key_prefix    TEXT         NOT NULL,         -- first 8 chars, for display in UI
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- ─── Grants ─────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON users    TO app_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO app_writer;
-- lstm_reader intentionally has NO access to these tables.
