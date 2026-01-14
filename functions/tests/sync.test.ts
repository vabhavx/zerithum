import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPlatform, SyncContext } from '../logic/sync';

describe('syncPlatform', () => {
  let mockCtx: SyncContext;
  const mockUser = { id: 'user_123' };
  const connectionId = 'conn_123';
  const platform = 'youtube';
  const oauthToken = 'token_123';

  beforeEach(() => {
    mockCtx = {
      fetchPlatformData: vi.fn(),
      fetchExistingTransactionIds: vi.fn().mockResolvedValue(new Set()),
      saveTransactions: vi.fn().mockResolvedValue(undefined),
      logAudit: vi.fn(),
      updateConnectionStatus: vi.fn().mockResolvedValue(undefined),
      updateSyncHistory: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should sync youtube transactions correctly', async () => {
    const mockResponse = {
      rows: [
        ['2024-01-01', 100.50],
        ['2024-01-02', 200.00]
      ]
    };
    (mockCtx.fetchPlatformData as any).mockResolvedValue(mockResponse);

    const result = await syncPlatform(mockCtx, mockUser, connectionId, platform, oauthToken);

    expect(result.success).toBe(true);
    expect(result.transactionCount).toBe(2);
    expect(mockCtx.saveTransactions).toHaveBeenCalledWith([
      expect.objectContaining({
        platform_transaction_id: 'youtube_2024-01-01',
        amount: 100.50
      }),
      expect.objectContaining({
        platform_transaction_id: 'youtube_2024-01-02',
        amount: 200.00
      })
    ]);
    expect(mockCtx.logAudit).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      action: 'sync_platform_data'
    }));
  });

  it('should deduplicate transactions', async () => {
    const mockResponse = {
      rows: [
        ['2024-01-01', 100.50], // Existing
        ['2024-01-02', 200.00]  // New
      ]
    };
    (mockCtx.fetchPlatformData as any).mockResolvedValue(mockResponse);
    (mockCtx.fetchExistingTransactionIds as any).mockResolvedValue(new Set(['youtube_2024-01-01']));

    const result = await syncPlatform(mockCtx, mockUser, connectionId, platform, oauthToken);

    expect(mockCtx.fetchExistingTransactionIds).toHaveBeenCalledWith(
      mockUser.id,
      platform,
      '2024-01-01',
      '2024-01-02'
    );

    expect(result.transactionCount).toBe(1);
    expect(mockCtx.saveTransactions).toHaveBeenCalledWith([
      expect.objectContaining({
        platform_transaction_id: 'youtube_2024-01-02'
      })
    ]);
    expect(mockCtx.logAudit).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({
        found_transactions: 2,
        synced_transactions: 1,
        duplicates_ignored: 1
      })
    }));
  });

  it('should handle errors and log failure', async () => {
    const error = new Error('API Error');
    (mockCtx.fetchPlatformData as any).mockRejectedValue(error);

    await expect(syncPlatform(mockCtx, mockUser, connectionId, platform, oauthToken))
      .rejects.toThrow('API Error');

    expect(mockCtx.logAudit).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failure',
      action: 'sync_platform_data_failed',
      details: expect.objectContaining({
        error_message: 'API Error'
      })
    }));
    expect(mockCtx.updateConnectionStatus).toHaveBeenCalledWith('error', 'API Error');
  });

  it('should handle stripe transactions', async () => {
    const stripePlatform = 'stripe';
    const mockResponse = {
        data: [
            {
                id: 'ch_123',
                amount: 1000,
                currency: 'usd',
                created: 1704067200, // 2024-01-01
                description: 'Test Charge'
            }
        ]
    };
    (mockCtx.fetchPlatformData as any).mockResolvedValue(mockResponse);

    const result = await syncPlatform(mockCtx, mockUser, connectionId, stripePlatform, oauthToken);

    expect(result.success).toBe(true);
    expect(mockCtx.saveTransactions).toHaveBeenCalledWith([
        expect.objectContaining({
            platform_transaction_id: 'stripe_ch_123',
            amount: 10.0, // 1000 cents
            currency: 'USD',
            category: 'product_sale',
            description: 'Test Charge'
        })
    ]);
  });
});
