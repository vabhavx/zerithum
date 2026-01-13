
import { describe, it, expect, vi } from 'vitest';
import { sendSyncFailedEmailLogic, EmailContext } from '../logic/email';

describe('sendSyncFailedEmailLogic', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    full_name: 'Test User'
  };

  const createMockContext = () => ({
    getUser: vi.fn().mockResolvedValue(mockUser),
    sendEmail: vi.fn().mockResolvedValue(undefined)
  });

  it('should send email with valid input', async () => {
    const ctx = createMockContext();
    await sendSyncFailedEmailLogic(ctx, {
      userId: 'user123',
      platform: 'YouTube',
      errorMessage: 'Token expired'
    });

    expect(ctx.getUser).toHaveBeenCalledWith('user123');
    expect(ctx.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      '⚠️ YouTube sync failed - action needed',
      expect.stringContaining('Token expired')
    );
  });

  it('should sanitize HTML in error message', async () => {
    const ctx = createMockContext();
    const maliciousError = '<script>alert(1)</script>';

    await sendSyncFailedEmailLogic(ctx, {
      userId: 'user123',
      platform: 'YouTube',
      errorMessage: maliciousError
    });

    expect(ctx.sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.stringContaining('&lt;script&gt;alert(1)&lt;/script&gt;')
    );

    // Should NOT contain the raw script tag
    const emailBody = ctx.sendEmail.mock.calls[0][2];
    expect(emailBody).not.toContain('<script>');
  });

  it('should sanitize HTML in platform name', async () => {
    const ctx = createMockContext();
    const maliciousPlatform = '<b>BoldPlatform</b>';

    await sendSyncFailedEmailLogic(ctx, {
      userId: 'user123',
      platform: maliciousPlatform,
      errorMessage: 'Error'
    });

    expect(ctx.sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('&lt;b&gt;BoldPlatform&lt;/b&gt;'),
      expect.stringContaining('&lt;b&gt;BoldPlatform&lt;/b&gt;')
    );
  });

  it('should throw error if user not found', async () => {
    const ctx = createMockContext();
    ctx.getUser.mockResolvedValue(null);

    await expect(sendSyncFailedEmailLogic(ctx, {
      userId: 'unknown',
      platform: 'YouTube',
      errorMessage: 'Error'
    })).rejects.toThrow('User not found');
  });

  it('should validate inputs', async () => {
    const ctx = createMockContext();

    await expect(sendSyncFailedEmailLogic(ctx, {
      userId: '',
      platform: 'YouTube',
      errorMessage: 'Error'
    })).rejects.toThrow('Invalid userId');

    await expect(sendSyncFailedEmailLogic(ctx, {
      userId: 'user123',
      platform: '',
      errorMessage: 'Error'
    })).rejects.toThrow('Invalid platform');
  });
});
