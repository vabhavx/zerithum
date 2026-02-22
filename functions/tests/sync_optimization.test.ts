import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { refreshAccessTokenLogic } from '../logic/refreshAccessTokenLogic.ts';

vi.mock('../logic/refreshAccessTokenLogic.ts', () => ({
  refreshAccessTokenLogic: vi.fn(),
}));

vi.mock('npm:@base44/sdk@0.8.6', () => ({
  createClientFromRequest: vi.fn(() => ({
    auth: {
      me: vi.fn().mockResolvedValue({ id: 'test-user' }),
    },
    asServiceRole: {
      entities: {
        SyncHistory: {
          create: vi.fn().mockResolvedValue({ id: 'sync-123' }),
          update: vi.fn(),
        },
        ConnectedPlatform: {
          filter: vi.fn().mockResolvedValue([{
            id: 'conn-123',
            user_id: 'test-user',
            platform: 'youtube',
            oauth_token: 'v1:iv:token',
            refresh_token: 'v1:iv:refresh',
            expires_at: new Date(Date.now() - 10000).toISOString(), // Expired
          }]),
          update: vi.fn(),
        },
        RevenueTransaction: {
          filter: vi.fn().mockResolvedValue([]),
          bulkCreate: vi.fn(),
        }
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { success: true } }),
      }
    }
  })),
}));

vi.mock('../logic/sync.ts', () => ({
  syncPlatform: vi.fn().mockResolvedValue({ success: true, transactionCount: 0 }),
}));

vi.mock('../utils/encryption.ts', () => ({
  decryptLegacy: vi.fn(async (t) => t),
  encrypt: vi.fn(async (t) => `encrypted:${t}`),
}));

describe('syncPlatformData optimization', () => {
  let serveHandler: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('Deno', {
      serve: vi.fn((handler) => {
        serveHandler = handler;
      }),
      env: {
        get: vi.fn().mockReturnValue('mock-env-val'),
      }
    });

    // Capture the handler
    await import('../syncPlatformData.ts');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call refreshAccessTokenLogic directly when token is expired', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        connectionId: 'conn-123',
        platform: 'youtube'
      })
    });

    (refreshAccessTokenLogic as any).mockResolvedValue({
      status: 200,
      body: { success: true }
    });

    await serveHandler(req);

    expect(refreshAccessTokenLogic).toHaveBeenCalled();
    expect(refreshAccessTokenLogic).toHaveBeenCalledWith(
      expect.objectContaining({
        base44: expect.any(Object),
        env: expect.any(Object),
        fetch: expect.any(Function),
        encrypt: expect.any(Function),
        decrypt: expect.any(Function)
      }),
      expect.objectContaining({ id: 'test-user' }),
      expect.objectContaining({ connectionId: 'conn-123' })
    );
  });
});
