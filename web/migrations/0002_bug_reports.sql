CREATE TABLE IF NOT EXISTS bug_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL DEFAULT 'Something''s broken',
  description TEXT NOT NULL,
  page_route TEXT NOT NULL DEFAULT '',
  command_name TEXT NOT NULL DEFAULT '',
  build_id TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  reporter_id TEXT NOT NULL DEFAULT 'guest',
  reporter_name TEXT NOT NULL DEFAULT 'guest',
  photo_base64 TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
