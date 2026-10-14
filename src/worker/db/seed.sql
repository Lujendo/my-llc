-- Seed data for development
-- Password: password123
-- Legacy SHA-256 hash (salt:hash). Intentionally left in the old format so the
-- login path exercises the transparent PBKDF2 rehash-on-login migration.
-- Hash: jSnzF6gUn1ZUn30Ar7+/Eg==:7GOuCzum85+Yd97WpAn/BTSEKO42nCvnocCouGWu5wY=

INSERT OR IGNORE INTO users (id, email, password_hash, name, citizenship, residency, itin_status)
VALUES (
  'user-1',
  'andrea@example.com',
  'jSnzF6gUn1ZUn30Ar7+/Eg==:7GOuCzum85+Yd97WpAn/BTSEKO42nCvnocCouGWu5wY=',
  'Andrea Lujendo',
  'Italy',
  'Germany',
  'pending'
);

INSERT OR IGNORE INTO entities (id, user_id, name, formation_date, state, members_count, status)
VALUES (
  'entity-1',
  'user-1',
  'Royalty Lite LLC',
  '2024-06-15',
  'Wyoming',
  1,
  'active'
);

INSERT OR IGNORE INTO tasks (id, entity_id, title, section, due_date, completed, instructions)
VALUES
  ('task-1', 'entity-1', 'Mail W-7 to IRS', 'ITIN', '2026-10-20', 0, 'Form W-7 (Application for IRS Individual Identification Number) must be filed within 30 days of LLC formation'),
  ('task-2', 'entity-1', 'Complete Operating Agreement', 'Formation', '2024-06-30', 1, 'LLC Operating Agreement must be signed by all members'),
  ('task-3', 'entity-1', 'German Tax Filing', 'Germany', '2027-05-31', 0, 'File German income tax return'),
  ('task-4', 'entity-1', 'FATCA Questionnaire', 'Federal', '2026-12-01', 0, 'Complete FATCA self-certification'),
  ('task-5', 'entity-1', 'Wyoming Annual Report', 'Banking', '2027-08-12', 0, 'Wyoming requires biennial report ($60 fee)');
