import { describe, it, vi, expect, afterEach } from 'vitest';
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

describe('syncPlatform Patreon', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process Patreon campaigns and members correctly', async () => {
    const campaignCount = 2; // Reduced for unit test speed
    const memberCount = 3;
    const campaigns = Array.from({ length: campaignCount }, (_, i) => ({
      id: `campaign-${i}`,
      attributes: { creation_name: `Campaign ${i}` },
    }));

    // Mock fetchPlatformData behavior
    mockFetchPlatformData.mockImplementation(async (url) => {
      if (url.includes('/campaigns?')) {
        return { data: campaigns };
      } else if (url.includes('/members?')) {
        // Simulate slight network delay
        await new Promise((resolve) => setTimeout(resolve, 10));
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

    // Verification
    expect(result.success).toBe(true);
    expect(result.transactionCount).toBe(campaignCount * memberCount);
    expect(mockFetchPlatformData).toHaveBeenCalledTimes(1 + campaignCount); // 1 for campaigns + N for members

    // Check transaction count passed to saveTransactions
    const savedTransactions = mockSaveTransactions.mock.calls[0][0];
    expect(savedTransactions).toHaveLength(campaignCount * memberCount);

    // Verify transaction structure
    expect(savedTransactions[0]).toMatchObject({
        platform: 'patreon',
        currency: 'USD',
        category: 'membership'
    });
  });
});
