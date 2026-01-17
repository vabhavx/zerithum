
import { describe, it, expect, vi } from 'vitest';
import { sendWelcomeEmailLogic, WelcomeEmailContext } from '../logic/welcomeEmail';

describe('sendWelcomeEmailLogic', () => {
  const createMockContext = () => ({
    sendEmail: vi.fn().mockResolvedValue(undefined)
  });

  it('should send welcome email with valid input', async () => {
    const ctx = createMockContext();
    await sendWelcomeEmailLogic(ctx, {
      userId: 'user123',
      userEmail: 'test@example.com',
      userName: 'Test User'
    });

    expect(ctx.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining('Welcome to Zerithum'),
      expect.stringContaining('Hi Test User,')
    );
  });

  it('should sanitize userName to prevent XSS', async () => {
    const ctx = createMockContext();
    const maliciousName = '<script>alert(1)</script>';

    await sendWelcomeEmailLogic(ctx, {
      userId: 'user123',
      userEmail: 'test@example.com',
      userName: maliciousName
    });

    // Should contain escaped version
    expect(ctx.sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.stringContaining('&lt;script&gt;alert(1)&lt;/script&gt;')
    );

    // Should NOT contain the raw script tag
    const emailBody = ctx.sendEmail.mock.calls[0][2];
    expect(emailBody).not.toContain('<script>');
  });

  it('should fallback to "there" if userName is missing', async () => {
    const ctx = createMockContext();

    await sendWelcomeEmailLogic(ctx, {
      userId: 'user123',
      userEmail: 'test@example.com'
    });

    expect(ctx.sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.stringContaining('Hi there,')
    );
  });

  it('should validate inputs', async () => {
    const ctx = createMockContext();

    await expect(sendWelcomeEmailLogic(ctx, {
      userId: '',
      userEmail: 'test@example.com'
    })).rejects.toThrow('Invalid userId');

    await expect(sendWelcomeEmailLogic(ctx, {
      userId: 'user123',
      userEmail: ''
    })).rejects.toThrow('Invalid userEmail');
  });
});
