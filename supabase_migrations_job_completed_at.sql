-- ═══════════════════════════════════════════════════════════════
-- Job History: completed_at and index for status filtering
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add completed_at column to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Index for faster filtering by user + status (JobSelector + Job History)
CREATE INDEX IF NOT EXISTS idx_jobs_status_user
ON jobs(user_id, status);
