-- Additive migration: global rate-limit counter, signup consent, document acceptances.
-- SQLite has no ADD COLUMN IF NOT EXISTS, so run this exactly once per database.

-- Global fixed-window rate-limit counter (BUG-02). One row per key+window.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

-- Signup consent evidence (legal trust boundary).
ALTER TABLE users ADD COLUMN terms_version TEXT;
ALTER TABLE users ADD COLUMN privacy_version TEXT;
ALTER TABLE users ADD COLUMN consent_at TEXT;

-- Document acceptance log (terms/privacy re-acceptance).
CREATE TABLE IF NOT EXISTS document_acceptances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('terms', 'privacy')),
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_document_acceptances_user_id ON document_acceptances(user_id);
