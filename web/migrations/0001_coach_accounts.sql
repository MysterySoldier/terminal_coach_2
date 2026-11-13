CREATE TABLE IF NOT EXISTS coach_accounts (
  google_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'user',
  family_name TEXT NOT NULL DEFAULT '',
  prompt_color TEXT NOT NULL DEFAULT '',
  command_color TEXT NOT NULL DEFAULT '',
  progress_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT 0
);
