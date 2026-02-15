import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exchangeOAuthTokens, ExchangeTokensContext } from '../logic/exchangeOAuthTokensLogic.ts';

describe('exchangeOAuthTokens', () => {
  let mockEnvGet: any;
  let mockFetch: any;
  let mockLogError: any;
  let mockEncrypt: any;
  let mockBase44: any;
  let ctx: ExchangeTokensContext;
  let user: any;

  beforeEach(() => {
    mockEnvGet = vi.fn((key: string) => {
        if (key.endsWith('_CLIENT_SECRET')) return 'secret';
        if (key.endsWith('_CLIENT_ID')) return 'client_id';
        if (key === 'OAUTH_REDIRECT_URI') return 'https://app.com/callback';
        return undefined;
    });
    mockFetch = vi.fn();
    mockLogError = vi.fn();
    mockEncrypt = vi.fn((text: string) => Promise.resolve(`encrypted:${text}`));

    const mockEntities = {
        ConnectedPlatform: {
            filter: vi.fn().mockResolvedValue([]),
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
        }
    };

    mockBase44 = {
        asServiceRole: {
            entities: mockEntities
        }
    };

    ctx = {
        envGet: mockEnvGet,
        fetch: mockFetch,
        logError: mockLogError,
        encrypt: mockEncrypt,
        base44: mockBase44
    };

    user = { id: 'user123' };
  });

  it('should return 400 if code or platform missing', async () => {
      const result = await exchangeOAuthTokens(ctx, user, '', 'youtube');
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('required');
  });

  it('should return 400 for unsupported platform', async () => {
      const result = await exchangeOAuthTokens(ctx, user, 'code', 'invalid_platform');
      expect(result.status).toBe(400);
      expect(result.body.error).toContain('Unsupported platform');
  });

  it('should exchange token successfully', async () => {
      mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
              access_token: 'at_123',
              refresh_token: 'rt_123',
              expires_in: 3600
          })
      });

      const result = await exchangeOAuthTokens(ctx, user, 'code123', 'youtube');

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
          'https://oauth2.googleapis.com/token',
          expect.objectContaining({
              method: 'POST',
              body: expect.any(URLSearchParams)
          })
      );

      expect(mockBase44.asServiceRole.entities.ConnectedPlatform.create).toHaveBeenCalledWith(
          expect.objectContaining({
              user_id: 'user123',
              platform: 'youtube',
              oauth_token: 'encrypted:at_123',
              refresh_token: 'encrypted:rt_123'
          })
      );
  });

  it('should handle token exchange failure securely', async () => {
      const sensitiveError = {
          error: 'invalid_grant',
          error_description: 'Invalid code provided',
          internal_trace_id: 'secret_trace_id_12345', // Sensitive
          api_key_leak: 'sk_live_12345' // Hypothetical sensitive data
      };

      mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => sensitiveError
      });

      const result = await exchangeOAuthTokens(ctx, user, 'bad_code', 'youtube');

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Failed to exchange code for tokens');

      // Verify logging is sanitized
      // The log message is constructed as: `Status: ${tokenResponse.status} ${tokenResponse.statusText}, Body: ${JSON.stringify({ error: ... })}`

      // Ensure sensitive data is NOT logged
      // Check the calls to logError
      const calls = mockLogError.mock.calls;
      const logMessage = calls.find((call: any[]) => call[0] === 'Token exchange failed:');
      expect(logMessage).toBeDefined();

      const loggedDetails = logMessage[1];
      expect(loggedDetails).toContain('Status: 400 Bad Request');
      expect(loggedDetails).toContain('"error":"invalid_grant"');
      expect(loggedDetails).not.toContain('secret_trace_id_12345');
      expect(loggedDetails).not.toContain('sk_live_12345');
  });
});
