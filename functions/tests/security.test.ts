import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePassword, checkRateLimit, RATE_LIMITS } from '../logic/security.ts';

// Mock dependencies
const mockSupabase = {
    auth: {
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
        admin: {
            updateUserById: vi.fn(),
            signOut: vi.fn(),
            deleteUser: vi.fn()
        }
    },
    from: vi.fn(),
    rpc: vi.fn()
};

// Mock Deno environment
globalThis.Deno = {
    env: {
        get: (key: string) => {
            if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
            if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-service-key';
            return undefined;
        }
    },
    serve: vi.fn()
} as any;

describe('Security Logic', () => {
    describe('validatePassword', () => {
        it('should reject short passwords', () => {
            const result = validatePassword('short123');
            expect(result.valid).toBe(false);
            expect(result.strength).toBe('weak');
        });

        it('should reject common passwords', () => {
            const result = validatePassword('password123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('This password is too common. Please choose a stronger password');
        });

        it('should accept strong passwords', () => {
            const result = validatePassword('CorrectHorseBatteryStaple123!');
            expect(result.valid).toBe(true);
            expect(result.strength).toBe('strong');
        });
    });

    describe('Rate Limiting', () => {
        it('should allow requests within limit', () => {
            const key = 'test_user_limit';
            const config = { maxAttempts: 2, windowMs: 1000 };

            const r1 = checkRateLimit(key, config);
            expect(r1.allowed).toBe(true);
            expect(r1.remaining).toBe(1);

            const r2 = checkRateLimit(key, config);
            expect(r2.allowed).toBe(true);
            expect(r2.remaining).toBe(0);
        });

        it('should block requests exceeding limit', () => {
            const key = 'test_user_block';
            const config = { maxAttempts: 1, windowMs: 1000 };

            checkRateLimit(key, config); // 1st OK
            const r2 = checkRateLimit(key, config); // 2nd Blocked

            expect(r2.allowed).toBe(false);
            expect(r2.remaining).toBe(0);
        });
    });
});
