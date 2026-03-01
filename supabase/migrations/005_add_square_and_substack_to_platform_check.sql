-- Migration: Add 'square' and 'substack' to the platform check constraint in connected_platforms table

-- 1. Drop the existing constraint
ALTER TABLE public.connected_platforms 
DROP CONSTRAINT IF EXISTS connected_platforms_platform_check;

-- 2. Add the updated constraint including 'square' and 'substack'
ALTER TABLE public.connected_platforms 
ADD CONSTRAINT connected_platforms_platform_check 
CHECK (platform IN (
    'stripe', 
    'gumroad', 
    'shopify', 
    'paypal', 
    'lemonsqueezy', 
    'paddle', 
    'razorpay', 
    'youtube', 
    'patreon', 
    'instagram', 
    'tiktok', 
    'twitch', 
    'square', 
    'substack'
));
