import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshAccessTokenLogic, RefreshAccessTokenContext } from '../logic/refreshAccessTokenLogic.ts';

describe('refreshAccessTokenLogic', () => {
  let mockBase44: any;
  let mockEnv: any;
  let mockFetch: any;
  let mockEncrypt: any;
  let mockDecrypt: any;
  let ctx: RefreshAccessTokenContext;
  let user: any;

  beforeEach(() => {
    mockBase44 = {
      asServiceRole: {
        entities: {
          ConnectedPlatform: {
            filter: vi.fn(),
            update: vi.fn()
          }
        }
      }
    };

    mockEnv = {
      get: vi.fn()
    };

    mockFetch = vi.fn();
    mockEncrypt = vi.fn(async (text) => `encrypted:${text}`);
    mockDecrypt = vi.fn(async (text) => text.replace('encrypted:', ''));

    ctx = {
      base44: mockBase44,
      env: mockEnv,
      fetch: mockFetch,
      encrypt: mockEncrypt,
      decrypt: mockDecrypt
    };

    user = { id: 'user_123' };
  });

  it('should return 400 if connectionId is missing', async () => {
    const body = {};
    const result = await refreshAccessTokenLogic(ctx, user, body);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Connection ID is required');
  });

  it('should return 404 if connection not found', async () => {
    mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([]);
    const body = { connectionId: 'conn_123' };
    const result = await refreshAccessTokenLogic(ctx, user, body);
    expect(result.status).toBe(404);
    expect(result.body.error).toBe('Connection not found or unauthorized');
  });

  it('should return 400 if no refresh token available', async () => {
    mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([{
      id: 'conn_123',
      platform: 'youtube',
      // no refresh_token
    }]);
    const body = { connectionId: 'conn_123' };
    const result = await refreshAccessTokenLogic(ctx, user, body);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('No refresh token available');
  });

  it('should return 400 if platform is not supported', async () => {
    mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([{
      id: 'conn_123',
      platform: 'unknown_platform',
      refresh_token: 'encrypted:token'
    }]);
    const body = { connectionId: 'conn_123' };
    const result = await refreshAccessTokenLogic(ctx, user, body);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Token refresh not supported for this platform');
  });

  it('should return 500 if client secret is missing', async () => {
    mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([{
      id: 'conn_123',
      platform: 'youtube',
      refresh_token: 'encrypted:token'
    }]);
    mockEnv.get.mockReturnValue(undefined);

    const body = { connectionId: 'conn_123' };
    const result = await refreshAccessTokenLogic(ctx, user, body);
    expect(result.status).toBe(500);
    expect(result.body.error).toContain('OAuth not configured');
  });

  it('should return 400 if token refresh fails', async () => {
    mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([{
      id: 'conn_123',
      platform: 'youtube',
      refresh_token: 'encrypted:token'
    }]);
    mockEnv.get.mockReturnValue('secret_123');
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'invalid_grant' })
    });

    const body = { connectionId: 'conn_123' };
    const result = await refreshAccessTokenLogic(ctx, user, body);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Failed to refresh token');
    expect(result.body.details).toEqual({ error: 'invalid_grant' });
  });

  it('should successfully refresh token and update connection', async () => {
    mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([{
      id: 'conn_123',
      platform: 'youtube',
      refresh_token: 'encrypted:old_refresh_token'
    }]);
    mockEnv.get.mockReturnValue('secret_123');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new_access_token',
        expires_in: 3600,
        refresh_token: 'new_refresh_token'
      })
    });

    const body = { connectionId: 'conn_123' };
    const result = await refreshAccessTokenLogic(ctx, user, body);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);

    // Verify fetch arguments
    expect(mockFetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams)
    }));

    // Verify update call
    expect(mockBase44.asServiceRole.entities.ConnectedPlatform.update).toHaveBeenCalledWith('conn_123', expect.objectContaining({
        oauth_token: 'encrypted:new_access_token',
        refresh_token: 'encrypted:new_refresh_token',
        expires_at: expect.any(String)
    }));
  });

  it('should re-encrypt old refresh token if new one is not provided', async () => {
     mockBase44.asServiceRole.entities.ConnectedPlatform.filter.mockResolvedValue([{
      id: 'conn_123',
      platform: 'youtube',
      refresh_token: 'encrypted:old_refresh_token'
    }]);
    mockEnv.get.mockReturnValue('secret_123');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new_access_token',
        expires_in: 3600
        // No refresh token returned
      })
    });

    const body = { connectionId: 'conn_123' };
    await refreshAccessTokenLogic(ctx, user, body);

    expect(mockBase44.asServiceRole.entities.ConnectedPlatform.update).toHaveBeenCalledWith('conn_123', expect.objectContaining({
        refresh_token: 'encrypted:old_refresh_token'
    }));
  });
});
