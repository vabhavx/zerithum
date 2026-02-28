-- ============================================================================
-- Migration: Add missing columns to connected_platforms
-- Fixes: "Could not find the 'error_message' column of 'connected_platforms' 
--         in the schema cache"
-- ============================================================================

-- 1. Add error_message column
ALTER TABLE public.connected_platforms 
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. Add expires_at column (used by OAuth token refresh logic)
ALTER TABLE public.connected_platforms 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 3. Update sync_status CHECK constraint to include 'active' 
--    (used by exchangeOAuthTokensLogic when setting sync_status on connect)
ALTER TABLE public.connected_platforms 
  DROP CONSTRAINT IF EXISTS connected_platforms_sync_status_check;

ALTER TABLE public.connected_platforms 
  ADD CONSTRAINT connected_platforms_sync_status_check 
  CHECK (sync_status IN ('pending', 'syncing', 'synced', 'active', 'error'));

-- 4. Expand platform CHECK to include OAuth platforms (youtube, patreon, etc.)
ALTER TABLE public.connected_platforms 
  DROP CONSTRAINT IF EXISTS connected_platforms_platform_check;

ALTER TABLE public.connected_platforms 
  ADD CONSTRAINT connected_platforms_platform_check 
  CHECK (platform IN (
    'stripe', 'gumroad', 'shopify', 'paypal', 'lemonsqueezy', 'paddle', 'razorpay',
    'youtube', 'patreon', 'instagram', 'tiktok'
  ));
