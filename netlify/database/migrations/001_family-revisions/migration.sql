CREATE TABLE IF NOT EXISTS family_revisions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  contributor TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer TEXT
);

CREATE INDEX IF NOT EXISTS family_revisions_status_created_idx
  ON family_revisions (status, created_at DESC);
