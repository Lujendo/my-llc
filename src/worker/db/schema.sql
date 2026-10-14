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
  start_time TEXT,
  end_time TEXT,
  is_all_day INTEGER DEFAULT 0,
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

-- Holdings: a legal entity wrapper (LLC, GmbH, ...) owned by a user.
-- Parent links live in holding_relationships (history), NOT on this table.
CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  jurisdiction_country TEXT NOT NULL,
  jurisdiction_subdivision TEXT,
  base_currency TEXT NOT NULL,
  currency_as_of TEXT,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT NOT NULL
);

-- Parent-link history. Current parent = row where effective_to IS NULL.
-- A constellation root = a holding with NO active relationship as child.
CREATE TABLE IF NOT EXISTS holding_relationships (
  id TEXT PRIMARY KEY,
  child_holding_id TEXT NOT NULL,
  parent_holding_id TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(child_holding_id) REFERENCES holdings(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_holding_id) REFERENCES holdings(id) ON DELETE CASCADE
);

-- Membership history: which entities belong to a holding, over time.
CREATE TABLE IF NOT EXISTS holding_members (
  id TEXT PRIMARY KEY,
  holding_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(holding_id) REFERENCES holdings(id) ON DELETE CASCADE,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  UNIQUE(holding_id, entity_id, effective_from)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  color TEXT DEFAULT '#6366f1',
  start_time TEXT NOT NULL,
  end_time TEXT,
  is_all_day INTEGER DEFAULT 0,
  jurisdiction_country TEXT,
  event_type TEXT,
  source TEXT NOT NULL DEFAULT 'user' CHECK(source IN ('system','user')),
  reminder TEXT,
  recurrence TEXT,
  entity_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holding_relationships_child ON holding_relationships(child_holding_id);
CREATE INDEX IF NOT EXISTS idx_holding_relationships_parent ON holding_relationships(parent_holding_id);
CREATE INDEX IF NOT EXISTS idx_holding_members_holding ON holding_members(holding_id);
CREATE INDEX IF NOT EXISTS idx_holding_members_entity ON holding_members(entity_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity_id ON calendar_events(entity_id);
