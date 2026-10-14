-- Additive migration: widen document_acceptances.document_type to cover every
-- document/form the app gates (W-7, OA, Treaty memo), not just terms/privacy.
--
-- SQLite cannot ALTER a CHECK constraint, so rebuild the table (12-step
-- procedure). No other table references document_acceptances, so no
-- PRAGMA foreign_keys dance is needed — the only FK (-> users) is untouched.
-- Run exactly once per database.

CREATE TABLE document_acceptances_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('terms', 'privacy', 'w7', 'oa', 'treaty_memo')),
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

INSERT INTO document_acceptances_new (id, user_id, document_type, document_version, accepted_at)
  SELECT id, user_id, document_type, document_version, accepted_at FROM document_acceptances;

DROP TABLE document_acceptances;

ALTER TABLE document_acceptances_new RENAME TO document_acceptances;

CREATE INDEX IF NOT EXISTS idx_document_acceptances_user_id ON document_acceptances(user_id);
