import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSkydoPayment, SkydoPaymentContext, SkydoUser } from '../logic/createSkydoPaymentLogic.ts';

describe('createSkydoPayment', () => {
  let mockEnvGet: any;
  let mockFetch: any;
  let mockLogError: any;
  let mockAuditLogCreate: any;
  let ctx: SkydoPaymentContext;
  let user: SkydoUser;

  beforeEach(() => {
    mockEnvGet = vi.fn((key: string) => {
      if (key === 'SKYDO_API_KEY') return 'test_api_key';
      if (key === 'APP_URL') return 'https://test-app.com';
      return undefined;
    });
    mockFetch = vi.fn();
    mockLogError = vi.fn();
    mockAuditLogCreate = vi.fn().mockResolvedValue({ id: 'audit_123' });

    ctx = {
      envGet: mockEnvGet,
      fetch: mockFetch,
      logError: mockLogError,
      auditLogCreate: mockAuditLogCreate,
    };

    user = {
      id: 'user_123',
      email: 'test@example.com',
      full_name: 'Test User'
    };
  });

  it('should create payment link successfully', async () => {
    const mockPaymentData = {
      id: 'pay_123',
      payment_url: 'https://skydo.com/pay/123',
      url: 'https://skydo.com/pay/123'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPaymentData
    });

    const result = await createSkydoPayment(ctx, user, 'Creator Pro', 'monthly');

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      success: true,
      payment_url: 'https://skydo.com/pay/123',
      payment_id: 'pay_123'
    });

    expect(mockEnvGet).toHaveBeenCalledWith('SKYDO_API_KEY');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.skydo.com/v1/payment-links',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_api_key'
        }),
        body: expect.stringContaining('"amount":49') // Creator Pro monthly is 49
      })
    );
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user_123',
        action: 'payment_initiated',
        data: expect.objectContaining({
          plan: 'Creator Pro',
          amount: 49,
          payment_id: 'pay_123'
        })
      })
    );
  });

  it('should return 400 if required fields are missing', async () => {
    const result = await createSkydoPayment(ctx, user, '', 'monthly');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Missing required fields');
  });

  it('should return 400 if plan is invalid', async () => {
    const result = await createSkydoPayment(ctx, user, 'Invalid Plan', 'monthly');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Invalid plan name');
  });

  it('should return 500 if Skydo API key is missing', async () => {
    mockEnvGet.mockReturnValue(undefined);
    const result = await createSkydoPayment(ctx, user, 'Creator Pro', 'monthly');
    expect(result.status).toBe(500);
    expect(result.body.error).toContain('Skydo API key not configured');
  });

  it('should return error if Skydo API fails', async () => {
    const errorData = { message: 'Invalid currency' };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => errorData
    });

    const result = await createSkydoPayment(ctx, user, 'Creator Pro', 'monthly');

    expect(result.status).toBe(422);
    expect(result.body.error).toBe('Failed to create payment link');
    expect(result.body.details).toBeUndefined();
    expect(mockLogError).toHaveBeenCalledWith('Skydo API error:', errorData);
  });

  it('should not leak sensitive details in error response', async () => {
    const sensitiveErrorData = {
      message: 'Internal Server Error',
      stack: 'Error: Something went wrong\n    at /app/server.js:10:15',
      internal_ip: '10.0.0.5',
      db_connection_string: 'postgres://user:pass@db:5432/production'
    };

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => sensitiveErrorData
    });

    const result = await createSkydoPayment(ctx, user, 'Creator Pro', 'monthly');

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to create payment link');
    // The details field should NOT be present to prevent information disclosure
    expect(result.body.details).toBeUndefined();

    // But it should still be logged internally
    expect(mockLogError).toHaveBeenCalledWith('Skydo API error:', sensitiveErrorData);
  });

  it('should handle fetch exceptions', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(createSkydoPayment(ctx, user, 'Creator Pro', 'monthly'))
      .rejects.toThrow('Network error');
  });
});
