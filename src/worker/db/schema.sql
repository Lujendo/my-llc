-- Create tables for MY-LLC Dashboard

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  citizenship TEXT,
  residency TEXT,
  itin_status TEXT DEFAULT 'not_started' CHECK(itin_status IN ('not_started', 'pending', 'received')),
  terms_version TEXT,
  privacy_version TEXT,
  consent_at TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Global fixed-window rate-limit counter (BUG-02).
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

-- Document acceptance log (terms/privacy re-acceptance + gated form outputs).
CREATE TABLE IF NOT EXISTS document_acceptances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('terms', 'privacy', 'w7', 'oa', 'treaty_memo')),
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_document_acceptances_user_id ON document_acceptances(user_id);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  formation_date TEXT,
  state TEXT,
  members_count INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('idle', 'active', 'dormant')),
  owner_name TEXT,
  owner_citizenship TEXT,
  owner_residency TEXT,
  owner_type TEXT CHECK(owner_type IN ('foreign', 'domestic')),
  tax_classification TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_entities_user_id ON entities(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  section TEXT NOT NULL CHECK(section IN ('Formation', 'ITIN', 'Federal', 'Germany', 'Banking', 'Ongoing')),
  due_date TEXT,
  completed BOOLEAN DEFAULT 0,
  completed_at TIMESTAMP,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_entity_id ON tasks(entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('W-7', 'OperatingAgreement', 'TreatyMemo')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES entities(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON documents(entity_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deadline', 'reminder', 'alert')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
