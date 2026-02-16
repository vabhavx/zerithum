import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// Hoist mocks to be accessible inside vi.mock factories
const mocks = vi.hoisted(() => ({
  serve: vi.fn(),
  createClientFromRequest: vi.fn(),
  logAudit: vi.fn(),
  processReceiptLogic: vi.fn(),
}));

// Mock dependencies
vi.mock('npm:@base44/sdk@0.8.6', () => ({
  createClientFromRequest: mocks.createClientFromRequest,
}));

vi.mock('../utils/audit.ts', () => ({
  logAudit: mocks.logAudit,
}));

vi.mock('../logic/processReceiptLogic.ts', () => ({
  processReceiptLogic: mocks.processReceiptLogic,
}));

describe('processReceipt Entry Point', () => {
  let mockBase44: any;

  beforeEach(() => {
    // Reset modules and mocks
    vi.resetModules();
    vi.clearAllMocks();

    // Mock Deno.serve using the hoisted mock
    vi.stubGlobal('Deno', {
      serve: mocks.serve,
    });

    // Setup base44 mock
    mockBase44 = {
      auth: {
        me: vi.fn(),
      },
    };
    mocks.createClientFromRequest.mockReturnValue(mockBase44);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function getHandler() {
    // Import the module, which calls Deno.serve
    await import('../processReceipt.ts');
    expect(mocks.serve).toHaveBeenCalled();
    return mocks.serve.mock.calls[0][0];
  }

  it('should process request successfully', async () => {
    const handler = await getHandler();

    const user = { id: 'user_123' };
    mockBase44.auth.me.mockResolvedValue(user);

    const body = { receiptUrl: 'https://example.com/receipt.jpg' };
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    mocks.processReceiptLogic.mockResolvedValue({
      status: 200,
      body: { success: true },
    });

    const response = await handler(req);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ success: true });

    expect(mockBase44.auth.me).toHaveBeenCalled();
    expect(mocks.processReceiptLogic).toHaveBeenCalledWith(
      expect.objectContaining({ base44: mockBase44, logAudit: mocks.logAudit }),
      user,
      body
    );
  });

  it('should return 401 if unauthorized', async () => {
    const handler = await getHandler();

    mockBase44.auth.me.mockResolvedValue(null);

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await handler(req);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ error: 'Unauthorized' });

    expect(mocks.processReceiptLogic).not.toHaveBeenCalled();
  });

  it('should return 400 if invalid JSON', async () => {
    const handler = await getHandler();

    const user = { id: 'user_123' };
    mockBase44.auth.me.mockResolvedValue(user);

    // Invalid JSON body simulation
    const req = {
        json: async () => { throw new Error('Invalid JSON'); }
    } as unknown as Request;

    const response = await handler(req);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ error: 'Invalid JSON body' });
  });

  it('should return 500 and log audit if logic throws error', async () => {
    const handler = await getHandler();

    const user = { id: 'user_123' };
    mockBase44.auth.me.mockResolvedValue(user);

    const body = { receiptUrl: 'https://example.com/receipt.jpg' };
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const error = new Error('Processing failed');
    mocks.processReceiptLogic.mockRejectedValue(error);

    const response = await handler(req);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ error: 'Internal Server Error' });

    expect(mocks.logAudit).toHaveBeenCalledWith(
        mockBase44,
        expect.objectContaining({
            action: 'process_receipt_failed',
            actor_id: user.id,
            status: 'failure',
            details: expect.objectContaining({
                error: 'Processing failed',
                receiptUrl: body.receiptUrl
            })
        })
    );
  });
});
