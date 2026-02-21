import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOAuthCallback, OAuthContext } from '../logic/oauthCallbackLogic.ts';

describe('handleOAuthCallback', () => {
  let mockEnvGet: any;
  let mockFetch: any;
  let mockBase44: any;
  let mockLogger: any;
  let ctx: OAuthContext;
  let user: any;

  beforeEach(() => {
    mockEnvGet = vi.fn((key: string) => {
        if (key.endsWith('_CLIENT_SECRET')) return 'secret';
        if (key.endsWith('_CLIENT_ID')) return 'client_id';
        if (key === 'TIKTOK_CLIENT_KEY') return 'tiktok_key';
        return undefined;
    });
    mockFetch = vi.fn();
    mockLogger = {
        error: vi.fn(),
    };

    const mockEntities = {
        ConnectedPlatform: {
            create: vi.fn().mockResolvedValue({ id: 'connection_123' }),
        }
    };

    const mockFunctions = {
        invoke: vi.fn().mockResolvedValue({}),
    };

    mockBase44 = {
        auth: {
            me: vi.fn().mockResolvedValue({ id: 'user_123' }),
        },
        asServiceRole: {
            entities: mockEntities,
            functions: mockFunctions,
        }
    };

    ctx = {
        envGet: mockEnvGet,
        fetch: mockFetch,
        base44: mockBase44,
        logger: mockLogger,
    };

    user = { id: 'user_123' };
  });

  it('should return 401 if user is not authenticated', async () => {
      mockBase44.auth.me.mockResolvedValue(null);
      const url = new URL('https://app.com/callback?code=123&state=youtube:csrf');
      const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

      expect(result.statusCode).toBe(401);
      expect(result.body.error).toBe('Unauthorized');
  });

  it('should return 400 if code or state is missing', async () => {
      const url = new URL('https://app.com/callback?code=123'); // Missing state
      const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

      expect(result.statusCode).toBe(400);
      expect(result.body.error).toContain('Missing code or state parameter');
  });

  it('should return 400 if error parameter is present', async () => {
      const url = new URL('https://app.com/callback?error=access_denied&state=youtube:csrf');
      const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

      expect(result.statusCode).toBe(400);
      expect(result.body.error).toContain('OAuth error: access_denied');
  });

  describe('CSRF Validation', () => {
      it('should fail if state format is invalid (missing token)', async () => {
          const url = new URL('https://app.com/callback?code=123&state=youtube');
          const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

          expect(result.statusCode).toBe(400);
          expect(result.body.error).toContain('Security validation failed');
      });

      it('should fail if cookie is missing', async () => {
          const url = new URL('https://app.com/callback?code=123&state=youtube:csrf');
          const result = await handleOAuthCallback(ctx, url, null);

          expect(result.statusCode).toBe(400);
          expect(result.body.error).toContain('Security validation failed');
      });

      it('should fail if tokens mismatch', async () => {
          const url = new URL('https://app.com/callback?code=123&state=youtube:csrf_token_A');
          const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf_token_B');

          expect(result.statusCode).toBe(400);
          expect(result.body.error).toContain('Security validation failed');
      });

      it('should pass if tokens match', async () => {
        // Mock successful fetch to proceed past CSRF check
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ access_token: 'at_123', expires_in: 3600 })
        });

          const url = new URL('https://app.com/callback?code=123&state=youtube:csrf_token_A');
          const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf_token_A');

          expect(result.statusCode).toBe(200);
      });
  });

  it('should use OAUTH_REDIRECT_URI env var if present', async () => {
      mockEnvGet.mockImplementation((key: string) => {
         if (key === 'OAUTH_REDIRECT_URI') return 'https://custom-redirect.com/cb';
         if (key === 'YOUTUBE_CLIENT_ID') return 'client_id';
         if (key === 'YOUTUBE_CLIENT_SECRET') return 'secret';
         return undefined;
      });

      mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ access_token: 'at_123', expires_in: 3600 })
      });

      const url = new URL(`https://app.com/callback?code=code_123&state=youtube:csrf`);
      await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

      expect(mockFetch).toHaveBeenCalledWith(
          'https://oauth2.googleapis.com/token',
          expect.objectContaining({
              body: expect.any(URLSearchParams)
          })
      );

      // Verify body params
      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('redirect_uri')).toBe('https://custom-redirect.com/cb');
  });

  describe('Platform Specifics', () => {
      const validState = 'youtube:csrf';
      const validCookie = 'oauth_state=csrf';

      beforeEach(() => {
          mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ access_token: 'at_123', expires_in: 3600 })
          });
      });

      it('should handle Youtube token exchange', async () => {
          const url = new URL(`https://app.com/callback?code=code_123&state=youtube:csrf`);
          await handleOAuthCallback(ctx, url, validCookie);

          expect(mockFetch).toHaveBeenCalledWith(
              'https://oauth2.googleapis.com/token',
              expect.objectContaining({
                  method: 'POST',
                  body: expect.any(URLSearchParams)
              })
          );
          // Verify body params if needed, but strict check on URL is good
      });

      it('should handle Patreon token exchange', async () => {
          const url = new URL(`https://app.com/callback?code=code_123&state=patreon:csrf`);
          await handleOAuthCallback(ctx, url, validCookie);

          expect(mockFetch).toHaveBeenCalledWith(
              'https://www.patreon.com/api/oauth2/token',
              expect.objectContaining({ method: 'POST' })
          );
      });

      it('should handle Stripe token exchange', async () => {
          const url = new URL(`https://app.com/callback?code=code_123&state=stripe:csrf`);
          await handleOAuthCallback(ctx, url, validCookie);

          expect(mockFetch).toHaveBeenCalledWith(
              'https://connect.stripe.com/oauth/token',
              expect.objectContaining({ method: 'POST' })
          );
      });

      it('should handle Instagram token exchange', async () => {
          const url = new URL(`https://app.com/callback?code=code_123&state=instagram:csrf`);
          await handleOAuthCallback(ctx, url, validCookie);

          // Instagram uses GET with params in URL
          expect(mockFetch).toHaveBeenCalledWith(
              expect.stringContaining('https://graph.facebook.com/v20.0/oauth/access_token?')
          );
      });

      it('should handle TikTok token exchange', async () => {
          const url = new URL(`https://app.com/callback?code=code_123&state=tiktok:csrf`);
          // TikTok wrapper returns { data: { ... } }
          mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ data: { access_token: 'at_123', expires_in: 3600 } })
          });

          await handleOAuthCallback(ctx, url, validCookie);

          expect(mockFetch).toHaveBeenCalledWith(
              'https://open.tiktokapis.com/v2/oauth/token/',
              expect.objectContaining({ method: 'POST' })
          );
      });

      it('should return 400 for unknown platform', async () => {
          const url = new URL(`https://app.com/callback?code=code_123&state=unknown:csrf`);
          const result = await handleOAuthCallback(ctx, url, validCookie);

          expect(result.statusCode).toBe(400);
          expect(result.body.error).toBe('Unknown platform');
      });
  });

  it('should create connection and trigger sync on success', async () => {
      mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ access_token: 'at_123', refresh_token: 'rt_123', expires_in: 3600 })
      });

      const url = new URL(`https://app.com/callback?code=code_123&state=youtube:csrf`);
      const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('window.opener.postMessage');
      expect(result.headers['Set-Cookie']).toContain('oauth_state=; Path=/;');

      expect(mockBase44.asServiceRole.entities.ConnectedPlatform.create).toHaveBeenCalledWith(
          expect.objectContaining({
              user_id: 'user_123',
              platform: 'youtube',
              oauth_token: 'at_123',
              refresh_token: 'rt_123',
              sync_status: 'active'
          })
      );

      expect(mockBase44.asServiceRole.functions.invoke).toHaveBeenCalledWith(
          'syncPlatformData',
          { connectionId: 'connection_123', platform: 'youtube' }
      );
  });

  it('should handle fetch errors gracefully', async () => {
      mockFetch.mockResolvedValue({
          ok: false,
          text: async () => 'Service unavailable',
          status: 503
      });

      const url = new URL(`https://app.com/callback?code=code_123&state=youtube:csrf`);
      const result = await handleOAuthCallback(ctx, url, 'oauth_state=csrf');

      expect(result.statusCode).toBe(500); // Because it throws error which is caught
      expect(result.body.error).toBe('Internal Server Error');
      expect(mockLogger.error).toHaveBeenCalledWith(
          'OAuth callback error:',
          expect.any(Error)
      );
  });
});
