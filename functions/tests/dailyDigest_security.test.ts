
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mocks
const mockSendDailyDigestLogic = vi.fn();
const mockCreateClientFromRequest = vi.fn(() => ({
  asServiceRole: {
    entities: {
      User: { list: vi.fn() },
      RevenueTransaction: { filter: vi.fn() },
      AutopsyEvent: { filter: vi.fn() }
    },
    integrations: {
      Core: { SendEmail: vi.fn() }
    }
  }
}));
const mockDenoServe = vi.fn();

describe('sendDailyDigest Security Fix Verification', () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    mockSendDailyDigestLogic.mockReset();
    mockCreateClientFromRequest.mockClear();
    mockDenoServe.mockReset();

    // Mock globals
    vi.stubGlobal('Deno', {
      serve: mockDenoServe,
      env: {
        get: (key: string) => {
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'mock-service-key';
          return undefined;
        }
      }
    });

    // Mock imports
    vi.doMock('npm:@base44/sdk@0.8.6', () => ({
      createClientFromRequest: mockCreateClientFromRequest
    }));
    vi.doMock('../logic/dailyDigest.ts', () => ({
      sendDailyDigestLogic: mockSendDailyDigestLogic
    }));

    // Import the module to trigger Deno.serve
    await import('../sendDailyDigest.ts');

    // Capture the handler
    expect(mockDenoServe).toHaveBeenCalled();
    handler = mockDenoServe.mock.calls[0][0];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('npm:@base44/sdk@0.8.6');
    vi.doUnmock('../logic/dailyDigest.ts');
  });

  it('should return 401 and NOT execute logic without any Authorization header', async () => {
    mockSendDailyDigestLogic.mockResolvedValue({ success: true, users_notified: 0 });

    const req = new Request('http://localhost', {
      method: 'POST',
      // NO Authorization header
    });

    const response = await handler(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
    expect(mockSendDailyDigestLogic).not.toHaveBeenCalled();
  });

  it('should return 401 and NOT execute logic with invalid Authorization header', async () => {
    mockSendDailyDigestLogic.mockResolvedValue({ success: true, users_notified: 0 });

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    const response = await handler(req);

    expect(response.status).toBe(401);
    expect(mockSendDailyDigestLogic).not.toHaveBeenCalled();
  });

  it('should return 200 and execute logic with correct Service Role Key', async () => {
    mockSendDailyDigestLogic.mockResolvedValue({ success: true, users_notified: 0 });

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-service-key' }
    });

    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(mockSendDailyDigestLogic).toHaveBeenCalled();
  });
});
