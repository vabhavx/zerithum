
import { describe, it, expect, vi } from 'vitest';
import { sendSyncFailedEmailLogic, EmailContext } from '../logic/email.ts';

describe('sendSyncFailedEmailLogic', () => {
    it('should generate sync failed email with correct layout', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn().mockResolvedValue({
            id: 'user123',
            email: 'test@example.com',
            full_name: 'Test User'
        });
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await sendSyncFailedEmailLogic(ctx, {
            userId: 'user123',
            platform: 'YouTube',
            errorMessage: 'Token expired'
        });

        expect(mockGetUser).toHaveBeenCalledWith('user123');
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
        const [to, subject, body] = mockSendEmail.mock.calls[0];

        expect(to).toBe('test@example.com');
        expect(subject).toBe('⚠️ YouTube sync failed - action needed');

        // Verify content
        expect(body).toContain('Hi Test User,');
        expect(body).toContain('YouTube Sync Failed');
        expect(body).toContain('Token expired');
        expect(body).toContain('Quick fix:');
        expect(body).toContain('https://zerithum-copy-36d43903.base44.app/ConnectedPlatforms');
    });

    it('should throw error if userId is missing', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn();
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await expect(sendSyncFailedEmailLogic(ctx, {
            userId: '',
            platform: 'YouTube',
            errorMessage: 'Error'
        })).rejects.toThrow('Invalid userId');
    });

    it('should throw error if platform is missing', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn();
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await expect(sendSyncFailedEmailLogic(ctx, {
            userId: 'user123',
            platform: '',
            errorMessage: 'Error'
        })).rejects.toThrow('Invalid platform');
    });

    it('should throw error if user not found', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn().mockResolvedValue(null);
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await expect(sendSyncFailedEmailLogic(ctx, {
            userId: 'user123',
            platform: 'YouTube',
            errorMessage: 'Error'
        })).rejects.toThrow('User not found');
    });

    it('should sanitize platform and error message', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn().mockResolvedValue({
            id: 'user123',
            email: 'test@example.com',
            full_name: 'Test User'
        });
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await sendSyncFailedEmailLogic(ctx, {
            userId: 'user123',
            platform: '<script>alert("xss")</script>',
            errorMessage: 'Error <br> details'
        });

        const [to, subject, body] = mockSendEmail.mock.calls[0];
        // Note: quotes are escaped to &quot;
        expect(subject).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(body).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(body).toContain('Error &lt;br&gt; details');
    });

    it('should use default error message if none provided', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn().mockResolvedValue({
            id: 'user123',
            email: 'test@example.com',
            full_name: 'Test User'
        });
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await sendSyncFailedEmailLogic(ctx, {
            userId: 'user123',
            platform: 'YouTube',
            errorMessage: ''
        });

        const [to, subject, body] = mockSendEmail.mock.calls[0];
        expect(body).toContain('Connection timeout or authentication expired.');
    });

    it('should use fallback name if user has no full_name', async () => {
        const mockSendEmail = vi.fn();
        const mockGetUser = vi.fn().mockResolvedValue({
            id: 'user123',
            email: 'test@example.com',
            full_name: undefined
        });
        const ctx: EmailContext = {
            getUser: mockGetUser,
            sendEmail: mockSendEmail
        };

        await sendSyncFailedEmailLogic(ctx, {
            userId: 'user123',
            platform: 'YouTube',
            errorMessage: 'Error'
        });

        const [to, subject, body] = mockSendEmail.mock.calls[0];
        expect(body).toContain('Hi there,');
    });
});
