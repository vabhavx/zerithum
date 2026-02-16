
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('PLATFORMS configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('uses environment variables for client IDs when available', async () => {
    // Mock environment variables
    vi.stubEnv('VITE_STRIPE_CLIENT_ID', 'test-stripe-id');
    vi.stubEnv('VITE_TIKTOK_CLIENT_KEY', 'test-tiktok-key');
    vi.stubEnv('VITE_SHOPIFY_CLIENT_ID', 'test-shopify-id');
    vi.stubEnv('VITE_TWITCH_CLIENT_ID', 'test-twitch-id');
    vi.stubEnv('VITE_GUMROAD_CLIENT_ID', 'test-gumroad-id');

    const { PLATFORMS } = await import('./platforms.js');

    const stripe = PLATFORMS.find(p => p.id === 'stripe');
    const tiktok = PLATFORMS.find(p => p.id === 'tiktok');
    const shopify = PLATFORMS.find(p => p.id === 'shopify');
    const twitch = PLATFORMS.find(p => p.id === 'twitch');
    const gumroad = PLATFORMS.find(p => p.id === 'gumroad');

    expect(stripe.clientId).toBe('test-stripe-id');
    expect(tiktok.clientKey).toBe('test-tiktok-key');
    expect(shopify.clientId).toBe('test-shopify-id');
    expect(twitch.clientId).toBe('test-twitch-id');
    expect(gumroad.clientId).toBe('test-gumroad-id');
  });

  it('falls back to placeholders when environment variables are missing', async () => {
    vi.unstubAllEnvs(); // Clear envs

    const { PLATFORMS } = await import('./platforms.js');

    const stripe = PLATFORMS.find(p => p.id === 'stripe');
    expect(stripe.clientId).toBe('YOUR_STRIPE_CLIENT_ID');

    const tiktok = PLATFORMS.find(p => p.id === 'tiktok');
    expect(tiktok.clientKey).toBe('YOUR_TIKTOK_CLIENT_KEY');

    const shopify = PLATFORMS.find(p => p.id === 'shopify');
    expect(shopify.clientId).toBe('YOUR_SHOPIFY_API_KEY');

    const twitch = PLATFORMS.find(p => p.id === 'twitch');
    expect(twitch.clientId).toBe('YOUR_TWITCH_CLIENT_ID');
  });
});
