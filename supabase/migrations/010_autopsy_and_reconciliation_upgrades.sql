-- Migration 010: Upgrade autopsy_events + reconciliations for full discrepancy pipeline
--
-- autopsy_events: Expand event_type enum, add severity level, store rich metadata
-- reconciliations: Add match_category, review_status, reviewer_notes columns

-- ============================================================================
-- 1. AUTOPSY_EVENTS — Expand event_type CHECK constraint
-- ============================================================================
-- Drop old constraint and add expanded one that includes all event types
-- from both the original schema and the anomaly detection engine
ALTER TABLE public.autopsy_events
  DROP CONSTRAINT IF EXISTS autopsy_events_event_type_check;

ALTER TABLE public.autopsy_events
  ADD CONSTRAINT autopsy_events_event_type_check
  CHECK (event_type IN (
    'churn',
    'refund_spike',
    'revenue_drop',
    'revenue_spike',
    'unusual_activity',
    'fraud_risk',
    'concentration_shift',
    'payout_delay'
  ));

-- ============================================================================
-- 2. AUTOPSY_EVENTS — Expand severity CHECK constraint
-- ============================================================================
-- The UI uses critical/high/medium/low but schema only had info/warning/critical
ALTER TABLE public.autopsy_events
  DROP CONSTRAINT IF EXISTS autopsy_events_severity_check;

ALTER TABLE public.autopsy_events
  ADD CONSTRAINT autopsy_events_severity_check
  CHECK (severity IN ('info', 'low', 'medium', 'warning', 'high', 'critical'));

-- ============================================================================
-- 3. RECONCILIATIONS — Add match_category for reconciliation type tracking
-- ============================================================================
ALTER TABLE public.reconciliations
  ADD COLUMN IF NOT EXISTS match_category TEXT
  DEFAULT 'unmatched'
  CHECK (match_category IN (
    'exact_match',
    'fee_deduction',
    'hold_period',
    'refund',
    'duplicate',
    'grouped_payout',
    'unmatched'
  ));

-- ============================================================================
-- 4. RECONCILIATIONS — Add review_status for approval workflow
-- ============================================================================
ALTER TABLE public.reconciliations
  ADD COLUMN IF NOT EXISTS review_status TEXT
  DEFAULT 'auto'
  CHECK (review_status IN (
    'auto',
    'pending_review',
    'approved',
    'rejected'
  ));

-- ============================================================================
-- 5. RECONCILIATIONS — Add reviewer_notes for audit trail
-- ============================================================================
ALTER TABLE public.reconciliations
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- ============================================================================
-- 6. INDEXES for discrepancy queries
-- ============================================================================
-- Index for fetching pending autopsy events efficiently
CREATE INDEX IF NOT EXISTS idx_autopsy_events_pending
  ON public.autopsy_events(user_id, status, detected_at DESC)
  WHERE status = 'pending_review';

-- Index for reconciliation review queue
CREATE INDEX IF NOT EXISTS idx_reconciliations_review
  ON public.reconciliations(user_id, review_status)
  WHERE review_status = 'pending_review';

-- Index for reconciliation lookup by revenue transaction (dedup check)
CREATE INDEX IF NOT EXISTS idx_reconciliations_revenue_txn
  ON public.reconciliations(user_id, revenue_transaction_id);

-- Index for reconciliation lookup by bank transaction
CREATE INDEX IF NOT EXISTS idx_reconciliations_bank_txn
  ON public.reconciliations(user_id, bank_transaction_id);

-- ============================================================================
-- 7. SYNC_HISTORY — Fix status CHECK to include actual values written by code
-- ============================================================================
-- The code writes 'pending', 'success', 'error' but schema only allows 'running', 'completed', 'failed'
ALTER TABLE public.sync_history
  DROP CONSTRAINT IF EXISTS sync_history_status_check;

ALTER TABLE public.sync_history
  ADD CONSTRAINT sync_history_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'success', 'failed', 'error'));
