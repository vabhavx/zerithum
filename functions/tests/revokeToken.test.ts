import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revokeToken, RevokeContext } from '../logic/revokeToken.ts';

describe('revokeToken', () => {
    let mockFetch: any;
    let mockEnvGet: any;
    let mockLogger: any;
    let ctx: RevokeContext;

    beforeEach(() => {
        mockFetch = vi.fn();
        mockEnvGet = vi.fn();
        mockLogger = {
            error: vi.fn(),
            info: vi.fn(),
        };
        ctx = {
            fetch: mockFetch,
            envGet: mockEnvGet,
            logger: mockLogger,
        };
    });

    it('should revoke youtube token', async () => {
        mockFetch.mockResolvedValue({ ok: true });

        const result = await revokeToken(ctx, 'youtube', 'test_token');

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('oauth2.googleapis.com/revoke'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        );
    });

    it('should handle youtube revocation failure with refresh token', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: false }) // First call fails
            .mockResolvedValueOnce({ ok: true }); // Second call succeeds

        const result = await revokeToken(ctx, 'youtube', 'test_token', 'refresh_token');

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('oauth2.googleapis.com/revoke'),
            expect.any(Object)
        );
    });

    it('should log info for patreon', async () => {
        const result = await revokeToken(ctx, 'patreon', 'test_token');
        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('not supported'));
    });

    it('should revoke stripe token', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/account')) {
                return Promise.resolve({ ok: true, json: async () => ({ id: 'acct_123' }) });
            }
            if (url.includes('/deauthorize')) {
                return Promise.resolve({ ok: true, text: async () => '' });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
        mockEnvGet.mockImplementation((key: string) => {
             if (key === 'STRIPE_CLIENT_ID') return 'ca_123';
             if (key === 'STRIPE_CLIENT_SECRET') return 'sk_123';
             return undefined;
        });

        const result = await revokeToken(ctx, 'stripe', 'test_token');

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/account'), expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/deauthorize'), expect.any(Object));
    });

    it('should fail stripe revocation if missing client id', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/account')) {
                return Promise.resolve({ ok: true, json: async () => ({ id: 'acct_123' }) });
            }
            return Promise.resolve({ ok: true });
        });
        mockEnvGet.mockReturnValue(undefined); // Missing STRIPE_CLIENT_ID

        const result = await revokeToken(ctx, 'stripe', 'test_token');

        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Missing STRIPE_CLIENT_ID'));
    });

    it('should revoke instagram token', async () => {
         mockFetch.mockImplementation((url: string) => {
            if (url.includes('/me')) {
                return Promise.resolve({ ok: true, json: async () => ({ id: '12345' }) });
            }
            if (url.includes('/permissions')) {
                return Promise.resolve({ ok: true });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        const result = await revokeToken(ctx, 'instagram', 'test_token');

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/me'), expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/12345/permissions'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should revoke tiktok token', async () => {
        mockFetch.mockResolvedValue({ ok: true });

        const result = await revokeToken(ctx, 'tiktok', 'test_token');

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('open.tiktokapis.com/v2/oauth/revoke'),
            expect.objectContaining({ method: 'POST' })
        );
    });
});
