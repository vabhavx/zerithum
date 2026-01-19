import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOAuthCallback, OAuthContext } from '../logic/oauthCallbackLogic';

describe('handleOAuthCallback', () => {
  let mockCtx: OAuthContext;
  const mockUser = { id: 'user_123' };

  beforeEach(() => {
    mockCtx = {
      envGet: vi.fn((key) => `mock_${key}`),
      fetch: vi.fn(),
      base44: {
        auth: {
          me: vi.fn().mockResolvedValue(mockUser)
        },
        asServiceRole: {
          entities: {
            ConnectedPlatform: {
              create: vi.fn().mockResolvedValue({ id: 'conn_123' })
            }
          },
          functions: {
            invoke: vi.fn().mockResolvedValue({})
          }
        }
      },
      logger: {
        error: vi.fn()
      }
    };
  });

  const createUrl = (params: Record<string, string>) => {
    const url = new URL('https://api.base44.app/oauthCallback');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url;
  };

  it('should fail if user is unauthorized', async () => {
    (mockCtx.base44.auth.me as any).mockResolvedValue(null);
    const url = createUrl({ code: '123', state: 'youtube:token' });

    const result = await handleOAuthCallback(mockCtx, url, 'oauth_state=token');

    expect(result.statusCode).toBe(401);
  });

  it('should fail if CSRF cookie is missing', async () => {
    const url = createUrl({ code: '123', state: 'youtube:token' });

    const result = await handleOAuthCallback(mockCtx, url, null);

    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain('Security validation failed');
  });

  it('should fail if CSRF token in state mismatches cookie', async () => {
    const url = createUrl({ code: '123', state: 'youtube:token_A' });

    const result = await handleOAuthCallback(mockCtx, url, 'oauth_state=token_B');

    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain('CSRF mismatch');
  });

  it('should fail if state has no token but cookie exists (legacy bypass attempt)', async () => {
    const url = createUrl({ code: '123', state: 'youtube' });
    // Even if cookie exists (e.g. from previous session), strict mode requires state to have token
    const result = await handleOAuthCallback(mockCtx, url, 'oauth_state=some_token');

    expect(result.statusCode).toBe(400);
    expect(result.body.error).toContain('Security validation failed');
  });

  it('should fail if cookie header exists but oauth_state is missing', async () => {
      const url = createUrl({ code: '123', state: 'youtube:token' });
      // Simulating other cookies present (session etc) but not ours
      const result = await handleOAuthCallback(mockCtx, url, 'other_cookie=value');

      expect(result.statusCode).toBe(400);
      expect(result.body.error).toContain('Security validation failed');
  });

  it('should succeed with valid CSRF and exchange tokens (YouTube)', async () => {
    const url = createUrl({ code: 'auth_code', state: 'youtube:token_123' });
    const cookie = 'oauth_state=token_123';

    // Mock fetch for token exchange
    (mockCtx.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access_123',
        refresh_token: 'refresh_123',
        expires_in: 3600
      })
    });

    const result = await handleOAuthCallback(mockCtx, url, cookie);

    expect(result.statusCode).toBe(200);
    expect(mockCtx.fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams)
      })
    );

    // Check if connection created
    expect(mockCtx.base44.asServiceRole.entities.ConnectedPlatform.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUser.id,
        platform: 'youtube',
        oauth_token: 'access_123'
      })
    );

    // Check cleanup cookie
    expect(result.headers['Set-Cookie']).toContain('oauth_state=;');
  });
});
