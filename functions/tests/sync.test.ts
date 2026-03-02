import { describe, it, vi, expect, afterEach, beforeEach } from 'vitest';
import { syncPlatform, SyncContext } from '../logic/sync';

// Mock dependencies
const mockFetchPlatformData = vi.fn();
const mockFetchExistingTransactionIdsInRange = vi.fn();
const mockSaveTransactions = vi.fn();
const mockLogAudit = vi.fn();
const mockUpdateConnectionStatus = vi.fn();
const mockUpdateSyncHistory = vi.fn();

const ctx: SyncContext = {
  fetchPlatformData: mockFetchPlatformData,
  fetchExistingTransactionIdsInRange: mockFetchExistingTransactionIdsInRange,
  saveTransactions: mockSaveTransactions,
  logAudit: mockLogAudit,
  updateConnectionStatus: mockUpdateConnectionStatus,
  updateSyncHistory: mockUpdateSyncHistory,
};

const user = { id: 'test-user' };
const connectionId = 'test-connection';
const oauthToken = 'test-token';

describe('syncPlatform', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Patreon', () => {
    it('should process Patreon campaigns and members correctly', async () => {
      const campaignCount = 2;
      const memberCount = 3;
      const campaigns = Array.from({ length: campaignCount }, (_, i) => ({
        id: `campaign-${i}`,
        attributes: { creation_name: `Campaign ${i}` },
      }));

      mockFetchPlatformData.mockImplementation(async (url) => {
        if (url.includes('/campaigns?')) {
          return { data: campaigns };
        } else if (url.includes('/members?')) {
          const campaignId = url.match(/campaigns\/(.*?)\/members/)[1];
          const members = Array.from({ length: memberCount }, (_, i) => ({
            id: `member-${campaignId}-${i}`,
            attributes: {
              full_name: `Member ${i}`,
              patron_status: 'active_patron',
              currently_entitled_amount_cents: 500,
              pledge_relationship_start: '2023-01-01T00:00:00Z',
            },
          }));
          return { data: members };
        }
        return { data: [] };
      });

      mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set());
      mockSaveTransactions.mockResolvedValue(undefined);
      mockUpdateConnectionStatus.mockResolvedValue(undefined);
      mockUpdateSyncHistory.mockResolvedValue(undefined);

      const result = await syncPlatform(ctx, user, connectionId, 'patreon', oauthToken);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(campaignCount * memberCount);

      const savedTransactions = mockSaveTransactions.mock.calls[0][0];
      expect(savedTransactions).toHaveLength(campaignCount * memberCount);
      expect(savedTransactions[0]).toMatchObject({
          platform: 'patreon',
          currency: 'USD',
          category: 'membership'
      });
    });
  });

  describe('YouTube', () => {
    it('should process YouTube analytics data correctly', async () => {
      const mockRows = [
        ['2023-01-01', 10.5],
        ['2023-01-02', 15.2],
      ];
      mockFetchPlatformData.mockResolvedValue({ rows: mockRows });
      mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set());

      const result = await syncPlatform(ctx, user, connectionId, 'youtube', oauthToken);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(2);
      expect(mockFetchPlatformData).toHaveBeenCalledWith(
        expect.stringContaining('youtubeanalytics.googleapis.com'),
        expect.any(Object)
      );

      const savedTransactions = mockSaveTransactions.mock.calls[0][0];
      expect(savedTransactions).toHaveLength(2);
      expect(savedTransactions[0]).toMatchObject({
        platform: 'youtube',
        transaction_date: '2023-01-01',
        amount: 10.5,
        category: 'ad_revenue'
      });
    });

    it('should use 90 days for forceFullSync', async () => {
      mockFetchPlatformData.mockResolvedValue({ rows: [] });
      mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set());

      await syncPlatform(ctx, user, connectionId, 'youtube', oauthToken, null, true);

      expect(mockFetchPlatformData).toHaveBeenCalled();
    });
  });

  describe('Stripe', () => {
    it('should process Stripe charges correctly', async () => {
      const mockCharges = [
        {
          id: 'ch_123',
          amount: 1000, // $10.00
          currency: 'usd',
          created: 1672531200, // 2023-01-01
          description: 'Test Charge'
        }
      ];
      mockFetchPlatformData.mockResolvedValue({ data: mockCharges });
      mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set());

      const result = await syncPlatform(ctx, user, connectionId, 'stripe', oauthToken);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(1);

      const savedTransactions = mockSaveTransactions.mock.calls[0][0];
      expect(savedTransactions[0]).toMatchObject({
        platform: 'stripe',
        platform_transaction_id: 'stripe_ch_123',
        amount: 10.00,
        currency: 'USD',
        category: 'product_sale',
        platform_fee: (1000 * 0.029 + 30) / 100
      });
    });

    it('should use limit 500 for forceFullSync', async () => {
       mockFetchPlatformData.mockResolvedValue({ data: [] });
       mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set());

       await syncPlatform(ctx, user, connectionId, 'stripe', oauthToken, null, true);

       expect(mockFetchPlatformData).toHaveBeenCalledWith(
         expect.stringContaining('limit=500'),
         expect.any(Object)
       );
    });
  });

  describe('Deduplication', () => {
    it('should skip existing transactions', async () => {
      const mockRows = [
        ['2023-01-01', 10.5],
        ['2023-01-02', 15.2],
      ];
      mockFetchPlatformData.mockResolvedValue({ rows: mockRows });

      mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set(['youtube_2023-01-01']));

      const result = await syncPlatform(ctx, user, connectionId, 'youtube', oauthToken);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(1);
      expect(result.duplicateCount).toBe(1);

      const savedTransactions = mockSaveTransactions.mock.calls[0][0];
      expect(savedTransactions).toHaveLength(1);
      expect(savedTransactions[0].transaction_date).toBe('2023-01-02');
    });
  });

  describe('Error Handling', () => {
    it('should retry on temporary errors', async () => {
      const error = new Error('ETIMEDOUT');
      mockFetchPlatformData
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ rows: [] });

      mockFetchExistingTransactionIdsInRange.mockResolvedValue(new Set());

      const promise = syncPlatform(ctx, user, connectionId, 'youtube', oauthToken);

      // Advance timers to trigger the retry
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.retryAttempts).toBeGreaterThan(0);
      expect(mockFetchPlatformData).toHaveBeenCalledTimes(2);
    });

    it('should fail on fatal errors', async () => {
      const error = new Error('401 Unauthorized');
      mockFetchPlatformData.mockRejectedValue(error);

      // Should fail immediately without retries
      await expect(syncPlatform(ctx, user, connectionId, 'youtube', oauthToken))
        .rejects
        .toThrow('Authentication failed for youtube');

      expect(mockUpdateConnectionStatus).toHaveBeenCalledWith('error', expect.stringContaining('Authentication failed'));
    });

    it('should handle rate limit errors with specific message', async () => {
        const error = new Error('429 Too Many Requests');
        mockFetchPlatformData.mockRejectedValue(error);

        const promise = syncPlatform(ctx, user, connectionId, 'youtube', oauthToken);

        // Advance timers to exhaust all retries
        await vi.runAllTimersAsync();

        await expect(promise)
          .rejects
          .toThrow('Rate limit exceeded for youtube');
    });
  });

  describe('Unsupported Platforms', () => {
    it('should return empty for instagram', async () => {
        const result = await syncPlatform(ctx, user, connectionId, 'instagram', oauthToken);
        expect(result.success).toBe(true);
        expect(result.transactionCount).toBe(0);
    });

    it('should throw for unknown platform', async () => {
        await expect(syncPlatform(ctx, user, connectionId, 'unknown_platform', oauthToken))
            .rejects
            .toThrow('Unsupported platform');
    });
  });
});
