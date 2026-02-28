-- ============================================================================
-- Migration: Add created_at column to connected_platforms
-- Fixes: Query ordering by -created_at fails because column doesn't exist
-- ============================================================================

ALTER TABLE public.connected_platforms
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows: use connected_at as the created_at value
UPDATE public.connected_platforms
  SET created_at = COALESCE(connected_at, NOW())
  WHERE created_at IS NULL;
