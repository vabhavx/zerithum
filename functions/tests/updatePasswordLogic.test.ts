import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { logAudit } from '../utils/audit.ts';
import { getCorsHeaders } from '../utils/cors.ts';
import { validatePassword, checkRateLimit, isValidOTPFormat, extractClientInfo, sanitizeErrorMessage } from '../logic/security.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Define mocks using vi.hoisted to allow usage in vi.mock factories
const mocks = vi.hoisted(() => {
    const mockGetUser = vi.fn();
    const mockSignInWithPassword = vi.fn();
    const mockUpdateUserById = vi.fn();
    const mockSignOut = vi.fn();

    const mockSingle = vi.fn();
    const mockUpdateEq = vi.fn();

    const mockQueryChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: mockSingle,
        update: vi.fn().mockReturnThis()
    };

    const mockUpdateChain: any = {
        eq: mockUpdateEq
    };

    return {
        mockGetUser,
        mockSignInWithPassword,
        mockUpdateUserById,
        mockSignOut,
        mockSingle,
        mockUpdateEq,
        mockQueryChain,
        mockUpdateChain
    };
});

vi.mock('../utils/audit.ts', () => ({
    logAudit: vi.fn()
}));

vi.mock('../utils/cors.ts', () => ({
    getCorsHeaders: vi.fn(() => ({ 'Access-Control-Allow-Origin': '*' }))
}));

vi.mock('../logic/security.ts', () => ({
    validatePassword: vi.fn(),
    checkRateLimit: vi.fn(),
    isValidOTPFormat: vi.fn(),
    extractClientInfo: vi.fn(() => ({ ip: '127.0.0.1', userAgent: 'TestAgent' })),
    sanitizeErrorMessage: vi.fn((msg) => msg?.message || msg),
    RATE_LIMITS: { PASSWORD_CHANGE: { maxAttempts: 5, windowMs: 600000 } },
    SECURITY_ACTIONS: {
        PASSWORD_CHANGE_ATTEMPT: 'PASSWORD_CHANGE_ATTEMPT',
        PASSWORD_CHANGED: 'PASSWORD_CHANGED',
        PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
        RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
    }
}));

vi.mock('npm:@supabase/supabase-js@2', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: mocks.mockGetUser,
            signInWithPassword: mocks.mockSignInWithPassword,
            admin: {
                updateUserById: mocks.mockUpdateUserById,
                signOut: mocks.mockSignOut
            }
        },
        from: vi.fn(() => ({
            select: vi.fn(() => mocks.mockQueryChain),
            update: vi.fn(() => mocks.mockUpdateChain)
        })),
        rpc: vi.fn()
    }))
}));

describe('handleUpdatePasswordRequest', () => {
    let handleUpdatePasswordRequest: (req: Request) => Promise<Response>;

    beforeAll(async () => {
        // Mock Deno global before importing the module
        const mockDenoEnvGet = vi.fn((key) => {
            if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
            if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-key';
            return undefined;
        });

        vi.stubGlobal('Deno', {
            env: { get: mockDenoEnvGet }
        });

        // Dynamic import to ensure Deno global is present
        const module = await import('../logic/updatePasswordLogic.ts');
        handleUpdatePasswordRequest = module.handleUpdatePasswordRequest;
    });

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset default implementations/values
        vi.mocked(validatePassword).mockResolvedValue({ valid: true, strength: 'strong', errors: [] } as any);
        vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 5, resetAt: new Date() } as any);
        vi.mocked(isValidOTPFormat).mockReturnValue(true);
        vi.mocked(extractClientInfo).mockReturnValue({ ip: '127.0.0.1', userAgent: 'TestAgent' });

        mocks.mockGetUser.mockResolvedValue({ data: { user: { id: 'user123', email: 'test@example.com', app_metadata: { provider: 'email' } } }, error: null });
        mocks.mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
        mocks.mockUpdateUserById.mockResolvedValue({ data: {}, error: null });
        mocks.mockSignOut.mockResolvedValue({ error: null });

        // Default DB mocks
        mocks.mockQueryChain.select.mockReturnThis();
        mocks.mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
    });

    it('should return 401 if Authorization header is missing', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({ newPassword: 'newPassword123' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if new password is missing', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({})
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe('New password is required');
    });

    it('should return 400 if password validation fails', async () => {
        vi.mocked(validatePassword).mockResolvedValue({ valid: false, errors: ['Too short'], strength: 'weak' } as any);
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'short' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe('Too short');
    });

    it('should return 429 if rate limit exceeded', async () => {
        vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date(Date.now() + 10000) } as any);
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'newPassword123' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(429);
    });

    it('should update password successfully with valid current password', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'newPassword123', currentPassword: 'oldPassword' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(200);
        expect(mocks.mockUpdateUserById).toHaveBeenCalledWith('user123', { password: 'newPassword123' });
        expect(mocks.mockSignOut).toHaveBeenCalledWith('user123', 'global');
    });

    it('should fail if current password verification fails', async () => {
        mocks.mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid password' } });
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'newPassword123', currentPassword: 'wrongPassword' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(401);
        expect((await res.json()).error).toBe('Current password is incorrect');
    });

    it('should require reauth if no current password or OTP provided', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'newPassword123' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(401);
        expect((await res.json()).requiresReauth).toBe(true);
    });

    it('should verify OTP and update password', async () => {
        vi.mocked(isValidOTPFormat).mockReturnValue(true);
        mocks.mockSingle.mockResolvedValue({ data: { id: 'code123' }, error: null });

        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'newPassword123', verificationCode: '123456' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(200);
        expect(mocks.mockUpdateEq).toHaveBeenCalledWith('id', 'code123');
        expect(mocks.mockUpdateUserById).toHaveBeenCalledWith('user123', { password: 'newPassword123' });
    });

    it('should fail if OTP is invalid', async () => {
        vi.mocked(isValidOTPFormat).mockReturnValue(true);
        mocks.mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            body: JSON.stringify({ newPassword: 'newPassword123', verificationCode: '123456' })
        });
        const res = await handleUpdatePasswordRequest(req);
        expect(res.status).toBe(401);
        expect((await res.json()).error).toBe('Invalid or expired verification code');
    });
});
