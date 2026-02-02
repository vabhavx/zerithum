-- ============================================================================
-- SECURITY TABLES MIGRATION
-- Tables for audit logging, OTP verification, and account deletion tracking
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. AUDIT LOG TABLE
-- Tracks security events for compliance and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details_json JSONB DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action, created_at DESC);

-- RLS: Users can view their own audit logs, service role can access all
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role has full access" ON public.audit_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. VERIFICATION CODES TABLE
-- Stores OTP codes for re-authentication of OAuth users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('password_change', 'delete_account', 'revoke_sessions')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for code validation lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_lookup ON public.verification_codes(user_id, code, purpose);
CREATE INDEX IF NOT EXISTS idx_verification_codes_cleanup ON public.verification_codes(expires_at);

-- RLS: Only service role can access (codes should not be visible to clients)
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.verification_codes FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. DELETION REQUESTS TABLE
-- Tracks account deletion for idempotency and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'deleted', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  steps_completed JSONB DEFAULT '[]'
);

-- RLS: Only service role can access
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.deletion_requests FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up expired verification codes (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
