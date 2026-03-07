-- Create billing tables: subscriptions, entitlements, webhook_events
-- These tables are the core of the PayPal billing system

-- subscriptions table — stores subscription lifecycle state
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'paypal',
    paypal_subscription_id TEXT UNIQUE NOT NULL,
    paypal_plan_id TEXT,
    plan TEXT CHECK (plan IN ('starter', 'pro', 'unknown')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'PAYMENT_FAILED', 'PAST_DUE')
    ),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paypal_sub_id ON public.subscriptions(paypal_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- RLS: Service role only (billing system is backend-driven)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.subscriptions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- entitlements table — stores platform connection limits per user
CREATE TABLE IF NOT EXISTS public.entitlements (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    max_platforms INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entitlements_max_platforms ON public.entitlements(max_platforms);

-- RLS: Users can view their own entitlements; service role manages
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entitlements" ON public.entitlements FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Service role manages entitlements" ON public.entitlements FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- webhook_events table — idempotency log for PayPal webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'paypal',
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed);

-- RLS: Service role only (webhooks are system-driven)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.webhook_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
