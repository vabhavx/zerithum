import { describe, it, expect, vi } from 'vitest';
import { sendWelcomeEmailLogic, WelcomeEmailContext } from '../logic/welcomeEmail.ts';

describe('sendWelcomeEmailLogic', () => {
    it('should generate welcome email with correct layout', async () => {
        const mockSendEmail = vi.fn();
        const ctx: WelcomeEmailContext = { sendEmail: mockSendEmail };

        await sendWelcomeEmailLogic(ctx, {
            userId: 'user123',
            userEmail: 'test@example.com',
            userName: 'Test User'
        });

        expect(mockSendEmail).toHaveBeenCalledTimes(1);
        const [to, subject, body] = mockSendEmail.mock.calls[0];

        expect(to).toBe('test@example.com');
        expect(subject).toBe('Welcome to Zerithum! 🎉 Consolidate your creator earnings in minutes');

        // Verify layout elements
        expect(body).toContain('<!DOCTYPE html>');
        expect(body).toContain('class="container"');
        expect(body).toContain('class="header"');
        expect(body).toContain('class="content"');

        // Verify custom styles are injected
        expect(body).toContain('.cta-button { display: inline-block;');

        // Verify content
        expect(body).toContain('Hi Test User,');
        expect(body).toContain('Connect Your Platforms');

        // Verify gradient
        expect(body).toContain('linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)');
    });

    it('should handle missing userName', async () => {
        const mockSendEmail = vi.fn();
        const ctx: WelcomeEmailContext = { sendEmail: mockSendEmail };

        await sendWelcomeEmailLogic(ctx, {
            userId: 'user123',
            userEmail: 'test@example.com'
        });

        const [to, subject, body] = mockSendEmail.mock.calls[0];
        expect(body).toContain('Hi there,');
    });

    it('should throw error if userId is missing', async () => {
        const mockSendEmail = vi.fn();
        const ctx: WelcomeEmailContext = { sendEmail: mockSendEmail };

        await expect(sendWelcomeEmailLogic(ctx, {
            userId: '',
            userEmail: 'test@example.com'
        } as any)).rejects.toThrow('Invalid userId');
    });

    it('should throw error if userEmail is missing', async () => {
        const mockSendEmail = vi.fn();
        const ctx: WelcomeEmailContext = { sendEmail: mockSendEmail };

        await expect(sendWelcomeEmailLogic(ctx, {
            userId: 'user123',
            userEmail: ''
        } as any)).rejects.toThrow('Invalid userEmail');
    });
});
