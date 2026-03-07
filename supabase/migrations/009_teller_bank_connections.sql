-- ============================================================================
-- TELLER BANK CONNECTIONS MIGRATION
-- Tables for Teller.io bank connection provider, account tracking,
-- enrollment nonces, and schema extensions for reconciliation workflow.
-- ============================================================================

-- ============================================================================
-- 1. BANK CONNECTIONS TABLE
-- Stores Teller enrollment data (one row per bank enrollment per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    teller_enrollment_id TEXT NOT NULL,
    teller_user_id TEXT,
    institution_name TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'disconnected', 'reauth_required', 'error')
    ),
    last_synced_at TIMESTAMPTZ,
    error_message TEXT,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, teller_enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON public.bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_status ON public.bank_connections(user_id, status);

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bank connections"
    ON public.bank_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages bank connections"
    ON public.bank_connections FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. BANK ACCOUNTS TABLE
-- Stores individual accounts per Teller enrollment
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bank_connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
    teller_account_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT,
    subtype TEXT,
    institution_name TEXT,
    last_four TEXT,
    currency TEXT DEFAULT 'USD',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection ON public.bank_accounts(bank_connection_id);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bank accounts"
    ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages bank accounts"
    ON public.bank_accounts FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. TELLER NONCES TABLE
-- Short-lived nonces for Teller Connect enrollment signature verification
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teller_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    nonce TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teller_nonces_lookup ON public.teller_nonces(nonce, consumed);

ALTER TABLE public.teller_nonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for teller nonces"
    ON public.teller_nonces FOR ALL USING (auth.role() = 'service_role');

-- Cleanup function for expired nonces (run via cron or pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_teller_nonces()
RETURNS void AS $$
BEGIN
    DELETE FROM public.teller_nonces WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. EXTEND BANK TRANSACTIONS TABLE
-- Add Teller-specific columns for automated bank data ingestion
-- ============================================================================
ALTER TABLE public.bank_transactions
    ADD COLUMN IF NOT EXISTS teller_transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS teller_account_id TEXT,
    ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES public.bank_connections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS posted_date DATE,
    ADD COLUMN IF NOT EXISTS transaction_type TEXT,
    ADD COLUMN IF NOT EXISTS teller_status TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add constraints after column creation (safe for existing data)
DO $$
BEGIN
    -- transaction_type check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'bank_transactions_transaction_type_check'
    ) THEN
        ALTER TABLE public.bank_transactions
            ADD CONSTRAINT bank_transactions_transaction_type_check
            CHECK (transaction_type IS NULL OR transaction_type IN ('credit', 'debit'));
    END IF;

    -- teller_status check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'bank_transactions_teller_status_check'
    ) THEN
        ALTER TABLE public.bank_transactions
            ADD CONSTRAINT bank_transactions_teller_status_check
            CHECK (teller_status IS NULL OR teller_status IN ('posted', 'pending'));
    END IF;

    -- source check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'bank_transactions_source_check'
    ) THEN
        ALTER TABLE public.bank_transactions
            ADD CONSTRAINT bank_transactions_source_check
            CHECK (source IN ('manual', 'teller', 'csv_upload'));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_txns_teller_id
    ON public.bank_transactions(teller_transaction_id) WHERE teller_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_txns_connection
    ON public.bank_transactions(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_bank_txns_source
    ON public.bank_transactions(source);
CREATE INDEX IF NOT EXISTS idx_bank_txns_posted_date
    ON public.bank_transactions(user_id, posted_date DESC);

-- ============================================================================
-- 5. EXTEND RECONCILIATIONS TABLE
-- Add review workflow columns and expanded match categories
-- ============================================================================
ALTER TABLE public.reconciliations
    ADD COLUMN IF NOT EXISTS match_category TEXT DEFAULT 'unmatched',
    ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'auto',
    ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Safely update CHECK constraints for match_category
DO $$
BEGIN
    -- Drop old constraint if it exists
    ALTER TABLE public.reconciliations
        DROP CONSTRAINT IF EXISTS reconciliations_match_category_check;

    ALTER TABLE public.reconciliations
        ADD CONSTRAINT reconciliations_match_category_check
        CHECK (match_category IN (
            'exact_match', 'fee_deduction', 'hold_period',
            'refund', 'duplicate', 'grouped_payout', 'unmatched'
        ));

    -- Add review_status constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'reconciliations_review_status_check'
    ) THEN
        ALTER TABLE public.reconciliations
            ADD CONSTRAINT reconciliations_review_status_check
            CHECK (review_status IN ('auto', 'pending_review', 'approved', 'rejected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reconciliations_review
    ON public.reconciliations(user_id, review_status)
    WHERE review_status = 'pending_review';

-- ============================================================================
-- 6. UPDATE TRIGGER FOR bank_connections.updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_bank_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bank_connections_updated_at ON public.bank_connections;
CREATE TRIGGER trigger_bank_connections_updated_at
    BEFORE UPDATE ON public.bank_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_connections_updated_at();
