-- Additive migration: owner + tax fields on entities (H4).
-- SQLite has no ADD COLUMN IF NOT EXISTS, so run this exactly once per database.
ALTER TABLE entities ADD COLUMN owner_name TEXT;
ALTER TABLE entities ADD COLUMN owner_citizenship TEXT;
ALTER TABLE entities ADD COLUMN owner_residency TEXT;
ALTER TABLE entities ADD COLUMN owner_type TEXT;
ALTER TABLE entities ADD COLUMN tax_classification TEXT;
