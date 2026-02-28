-- ============================================================================
-- ZERITHUM DATABASE SCHEMA FOR SUPABASE
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CONNECTED PLATFORMS
-- ============================================================================
CREATE TABLE public.connected_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('stripe', 'gumroad', 'shopify', 'paypal', 'lemonsqueezy', 'paddle', 'razorpay', 'youtube', 'patreon', 'instagram', 'tiktok', 'twitch')),
  oauth_token TEXT,
  refresh_token TEXT,
  api_key TEXT,
  shop_name TEXT, -- for Shopify
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'active', 'error')),
  last_synced_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, platform)
);

-- ============================================================================
-- 3. PLATFORM CONNECTIONS (Legacy - for migration compatibility)
-- ============================================================================
CREATE TABLE public.platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  oauth_token TEXT,
  sync_status TEXT DEFAULT 'pending',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  error_message TEXT
);

-- ============================================================================
-- 4. REVENUE TRANSACTIONS
-- ============================================================================
CREATE TABLE public.revenue_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_transaction_id TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  fee DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2),
  customer_email TEXT,
  customer_name TEXT,
  product_name TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('sale', 'refund', 'subscription', 'payout', 'chargeback')),
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, platform_transaction_id)
);

-- ============================================================================
-- 5. TRANSACTIONS (General)
-- ============================================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. BANK TRANSACTIONS
-- ============================================================================
CREATE TABLE public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_number TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  category TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_with UUID REFERENCES public.revenue_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. EXPENSES
-- ============================================================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  description TEXT,
  merchant TEXT,
  is_tax_deductible BOOLEAN DEFAULT false,
  deduction_percentage INTEGER DEFAULT 100,
  receipt_url TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. INSIGHTS (AI-generated)
-- ============================================================================
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT CHECK (insight_type IN ('revenue', 'expense', 'tax', 'growth', 'risk', 'opportunity')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  action_url TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. AUTOPSY EVENTS (Revenue anomalies)
-- ============================================================================
CREATE TABLE public.autopsy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('churn', 'refund_spike', 'revenue_drop', 'unusual_activity', 'fraud_risk')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'reviewed', 'resolved', 'dismissed')),
  affected_amount DECIMAL(12, 2),
  platform TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 10. RECONCILIATIONS
-- ============================================================================
CREATE TABLE public.reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  revenue_transaction_id UUID REFERENCES public.revenue_transactions(id),
  bank_transaction_id UUID REFERENCES public.bank_transactions(id),
  match_confidence DECIMAL(5, 2),
  status TEXT DEFAULT 'matched' CHECK (status IN ('matched', 'unmatched', 'manual')),
  reconciled_at TIMESTAMPTZ DEFAULT NOW(),
  reconciled_by TEXT DEFAULT 'auto'
);

-- ============================================================================
-- 11. SYNC HISTORY
-- ============================================================================
CREATE TABLE public.sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES public.connected_platforms(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- ============================================================================
-- 12. TAX PROFILES
-- ============================================================================
CREATE TABLE public.tax_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status TEXT CHECK (filing_status IN ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household')),
  estimated_income DECIMAL(12, 2),
  estimated_deductions DECIMAL(12, 2),
  state TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tax_year)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_revenue_transactions_user_date ON public.revenue_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, expense_date DESC);
CREATE INDEX idx_connected_platforms_user ON public.connected_platforms(user_id);
CREATE INDEX idx_insights_user ON public.insights(user_id, created_date DESC);
CREATE INDEX idx_autopsy_events_user ON public.autopsy_events(user_id, detected_at DESC);
CREATE INDEX idx_sync_history_user ON public.sync_history(user_id, sync_started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Connected Platforms: Users can only access their own platforms
CREATE POLICY "Users can manage own platforms" ON public.connected_platforms FOR ALL USING (auth.uid() = user_id);

-- Platform Connections: Users can only access their own connections
CREATE POLICY "Users can manage own connections" ON public.platform_connections FOR ALL USING (auth.uid() = user_id);

-- Revenue Transactions: Users can only access their own transactions
CREATE POLICY "Users can manage own revenue" ON public.revenue_transactions FOR ALL USING (auth.uid() = user_id);

-- Transactions: Users can only access their own
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Bank Transactions: Users can only access their own
CREATE POLICY "Users can manage own bank transactions" ON public.bank_transactions FOR ALL USING (auth.uid() = user_id);

-- Expenses: Users can only access their own
CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- Insights: Users can only access their own
CREATE POLICY "Users can manage own insights" ON public.insights FOR ALL USING (auth.uid() = user_id);

-- Autopsy Events: Users can only access their own
CREATE POLICY "Users can manage own autopsy events" ON public.autopsy_events FOR ALL USING (auth.uid() = user_id);

-- Reconciliations: Users can only access their own
CREATE POLICY "Users can manage own reconciliations" ON public.reconciliations FOR ALL USING (auth.uid() = user_id);

-- Sync History: Users can only access their own
CREATE POLICY "Users can view own sync history" ON public.sync_history FOR SELECT USING (auth.uid() = user_id);

-- Tax Profiles: Users can only access their own
CREATE POLICY "Users can manage own tax profiles" ON public.tax_profiles FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tax_profiles_updated_at BEFORE UPDATE ON public.tax_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
