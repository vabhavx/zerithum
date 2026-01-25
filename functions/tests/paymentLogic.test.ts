
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePaymentCreation, PaymentContext } from '../logic/paymentLogic';

describe('handlePaymentCreation', () => {
  const mockAuthMe = vi.fn();
  const mockAuditCreate = vi.fn();
  const mockFetch = vi.fn();
  const mockEnvGet = vi.fn();
  const mockLoggerError = vi.fn();
  const mockLoggerInfo = vi.fn();

  const mockContext: PaymentContext = {
    base44: {
      auth: { me: mockAuthMe },
      asServiceRole: {
        entities: {
          AuditLog: { create: mockAuditCreate }
        },
        functions: { invoke: vi.fn() }
      }
    },
    fetch: mockFetch,
    envGet: mockEnvGet,
    logger: {
      error: mockLoggerError,
      info: mockLoggerInfo
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnvGet.mockReturnValue('mock-api-key');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockAuthMe.mockResolvedValue(null);

    const result = await handlePaymentCreation(mockContext, {});

    expect(result.statusCode).toBe(401);
    expect(result.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 for missing required fields', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

    // Missing amount
    const result = await handlePaymentCreation(mockContext, { planName: 'Pro' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ error: 'Missing required fields' });
  });

  it('should return 400 for invalid amount (negative)', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

    const result = await handlePaymentCreation(mockContext, {
      planName: 'Pro',
      amount: -100
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ error: 'Invalid amount' });
  });

  it('should return 400 for invalid amount (not a number)', async () => {
      mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

      const result = await handlePaymentCreation(mockContext, {
        planName: 'Pro',
        amount: "100"
      });

      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual({ error: 'Invalid amount' });
    });

  it('should return 400 for invalid currency', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

    const result = await handlePaymentCreation(mockContext, {
      planName: 'Pro',
      amount: 100,
      currency: 'US' // Too short
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({ error: 'Invalid currency' });
  });

  it('should return 500 if Skydo API key is missing', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
    mockEnvGet.mockReturnValue(undefined);

    const result = await handlePaymentCreation(mockContext, {
      planName: 'Pro',
      amount: 100
    });

    expect(result.statusCode).toBe(500);
    expect(result.body).toEqual({ error: 'Payment service unavailable' });
    expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('not configured'));
  });

  it('should handle successful payment creation', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com', full_name: 'Test User' });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'pay_123', url: 'https://pay.skydo.com/123' })
    });

    const result = await handlePaymentCreation(mockContext, {
      planName: 'Pro',
      amount: 100,
      billingPeriod: 'monthly'
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.payment_id).toBe('pay_123');

    // Verify audit log
    expect(mockAuditCreate).toHaveBeenCalledWith({
      user_id: 'u1',
      action: 'payment_initiated',
      resource_type: 'subscription',
      data: expect.objectContaining({
        plan: 'Pro',
        amount: 100,
        payment_id: 'pay_123'
      })
    });
  });

  it('should return generic error and log details when upstream fails', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

    const upstreamError = { error: 'Invalid merchant', code: 'E123' };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => upstreamError
    });

    const result = await handlePaymentCreation(mockContext, {
      planName: 'Pro',
      amount: 100
    });

    // 🛡️ Verify generic error returned to client
    expect(result.statusCode).toBe(502);
    expect(result.body).toEqual({ error: 'Failed to create payment link' });
    expect(result.body).not.toHaveProperty('details'); // Should not leak details

    // 🛡️ Verify full details logged
    expect(mockLoggerError).toHaveBeenCalledWith('Skydo API error:', upstreamError);
  });

  it('should catch generic errors and return safe message', async () => {
    mockAuthMe.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

    mockFetch.mockRejectedValue(new Error('Network failure details'));

    const result = await handlePaymentCreation(mockContext, {
      planName: 'Pro',
      amount: 100
    });

    expect(result.statusCode).toBe(500);
    expect(result.body).toEqual({ error: 'Internal server error' });
    expect(result.body).not.toHaveProperty('message'); // Should not leak 'Network failure details'

    expect(mockLoggerError).toHaveBeenCalledWith('Payment creation error:', expect.any(Error));
  });
});
