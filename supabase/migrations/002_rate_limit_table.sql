-- ============================================================================
-- RATE LIMITING TABLE & FUNCTIONS
-- Replaces in-memory rate limiting with database-backed persistence
-- to support serverless/edge environments.
-- ============================================================================

-- 1. Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  reset_at BIGINT NOT NULL -- Epoch ms
);

-- RLS: Only service role should access this table directly
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.rate_limits FOR ALL USING (auth.role() = 'service_role');

-- 2. Function to atomically increment and check rate limits
CREATE OR REPLACE FUNCTION increment_rate_limit(
  key_param TEXT,
  window_ms INTEGER,
  max_attempts INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_row RECORD;
  now_ms BIGINT;
  new_reset_at BIGINT;
  new_count INTEGER;
  allowed BOOLEAN;
  remaining INTEGER;
BEGIN
  now_ms := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

  -- Lock the row if exists (or we will insert)
  -- Uses FOR UPDATE to prevent race conditions
  SELECT * INTO current_row FROM public.rate_limits WHERE key = key_param FOR UPDATE;

  IF NOT FOUND THEN
    -- First time seeing this key
    new_reset_at := now_ms + window_ms;
    new_count := 1;
    INSERT INTO public.rate_limits (key, count, reset_at) VALUES (key_param, new_count, new_reset_at);
    allowed := true;
    remaining := max_attempts - 1;
  ELSE
    -- Row exists
    IF current_row.reset_at <= now_ms THEN
      -- Window expired, reset everything
      new_reset_at := now_ms + window_ms;
      new_count := 1;
      UPDATE public.rate_limits SET count = new_count, reset_at = new_reset_at WHERE key = key_param;
      allowed := true;
      remaining := max_attempts - 1;
    ELSE
      -- Within window
      IF current_row.count >= max_attempts THEN
        -- Limit exceeded
        allowed := false;
        remaining := 0;
        new_reset_at := current_row.reset_at;
        -- No update needed
      ELSE
        -- Increment count
        new_count := current_row.count + 1;
        UPDATE public.rate_limits SET count = new_count WHERE key = key_param;
        allowed := true;
        remaining := max_attempts - new_count;
        new_reset_at := current_row.reset_at;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', allowed,
    'remaining', remaining,
    'reset_at', new_reset_at
  );
END;
$$;

-- Restrict execution to service_role only (prevent users from calling RPC directly)
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- 3. Cleanup function (can be run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete entries where the reset time has passed
  DELETE FROM public.rate_limits
  WHERE reset_at < (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict cleanup to service_role only
REVOKE EXECUTE ON FUNCTION cleanup_expired_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO service_role;
