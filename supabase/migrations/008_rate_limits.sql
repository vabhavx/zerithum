-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 1,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON public.rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- Function to increment rate limit
CREATE OR REPLACE FUNCTION increment_rate_limit(p_key TEXT, p_window_ms INTEGER)
RETURNS TABLE (current_count INTEGER, current_reset_at TIMESTAMPTZ) AS $$
DECLARE
    v_count INTEGER;
    v_reset_at TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
    v_window_interval INTERVAL := (p_window_ms || ' milliseconds')::INTERVAL;
BEGIN
    -- Try to update existing record if it is still valid (reset_at > now)
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key AND reset_at > v_now
    RETURNING count, reset_at INTO v_count, v_reset_at;

    -- If update didn't happen (row missing or expired)
    IF v_count IS NULL THEN
        INSERT INTO public.rate_limits (key, count, reset_at)
        VALUES (p_key, 1, v_now + v_window_interval)
        ON CONFLICT (key) DO UPDATE
        SET count = 1, reset_at = EXCLUDED.reset_at
        RETURNING count, reset_at INTO v_count, v_reset_at;
    END IF;

    RETURN QUERY SELECT v_count, v_reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke from everyone, grant to service_role
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER) TO service_role;
