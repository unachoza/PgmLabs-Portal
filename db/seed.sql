-- Reference seed file for manual SQLite seeding.
-- The runnable seed process is scripts/seed-db.js (creates hashes and richer sample records).

DELETE FROM survey_answers;
DELETE FROM survey_submissions;
DELETE FROM survey_questions;
DELETE FROM surveys;
DELETE FROM responses;
DELETE FROM checkins;
DELETE FROM marketing_campaigns;
DELETE FROM funder_updates;
DELETE FROM communication_logs;
DELETE FROM participants;
DELETE FROM users;
DELETE FROM sqlite_sequence;

-- Password hash placeholder values for docs-only SQL seed.
-- For working auth logins, run: npm run db:seed
INSERT INTO users (name, email, password_hash, role) VALUES
('Program Admin', 'admin@accelerator.org', 'use-node-seed-script', 'admin'),
('Funder Liaison', 'funder@bank.org', 'use-node-seed-script', 'funder');
