-- Additive migration: holdings (constellations) + calendar events (Phase 1).
-- SQLite has no ADD COLUMN IF NOT EXISTS, so run this exactly once per database.
-- schema.sql is authoritative and already contains the post-migration shape.

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

-- Calendar scheduling fields on tasks (deadlines can carry a time-of-day).
ALTER TABLE tasks ADD COLUMN start_time TEXT;
ALTER TABLE tasks ADD COLUMN end_time TEXT;
ALTER TABLE tasks ADD COLUMN is_all_day INTEGER DEFAULT 0;

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
