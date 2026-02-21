import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    validatePassword,
    generateOTPCode,
    isValidOTPFormat,
    checkRateLimit,
    sanitizeErrorMessage,
    extractClientInfo
} from '../logic/security';

describe('Security Logic', () => {
    describe('validatePassword', () => {
        it('should reject passwords shorter than 12 characters', async () => {
            expect((await validatePassword('Short1!')).valid).toBe(false);
            expect((await validatePassword('Short1!')).errors).toContain('Password must be at least 12 characters');
        });

        it('should reject common passwords', async () => {
            const result = await validatePassword('password12345');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('This password has appeared in a data breach. Please choose a different, more unique password');
        });

        it('should calculate strength correctly', async () => {
            // Weak: length 12, only lowercase
            expect((await validatePassword('abcdefghijkl')).strength).toBe('weak');

            // Medium: length 12, upper and lower
            expect((await validatePassword('Abcdefghijkl')).strength).toBe('medium');

            // Medium: length 12, upper, lower, digit
            expect((await validatePassword('Abcdefghij12')).strength).toBe('medium');

            // Strong: length 12, upper, lower, digit, special, length
            expect((await validatePassword('Abcdefghij1!')).strength).toBe('strong');

            // Strong: length 16, upper, lower, digit
            expect((await validatePassword('Abcdefghijklmnop1')).strength).toBe('strong');
        });

        it('should return valid true for strong passwords', async () => {
            const result = await validatePassword('SuperSecurePassword123!');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('generateOTPCode', () => {
        it('should generate a 6-digit OTP code', () => {
            const code = generateOTPCode();
            expect(code).toMatch(/^\d{6}$/);
            const num = parseInt(code, 10);
            expect(num).toBeGreaterThanOrEqual(100000);
            expect(num).toBeLessThanOrEqual(999999);
        });

        it('should be reasonably distributed', () => {
            const codes = new Set();
            for (let i = 0; i < 10; i++) {
                codes.add(generateOTPCode());
            }
            expect(codes.size).toBeGreaterThan(1);
        });
    });

    describe('isValidOTPFormat', () => {
        it('should accept 6-digit numbers', () => {
            expect(isValidOTPFormat('123456')).toBe(true);
            expect(isValidOTPFormat('000000')).toBe(true);
            expect(isValidOTPFormat('999999')).toBe(true);
        });

        it('should reject non-6-digit strings', () => {
            expect(isValidOTPFormat('12345')).toBe(false);
            expect(isValidOTPFormat('1234567')).toBe(false);
            expect(isValidOTPFormat('abcdef')).toBe(false);
            expect(isValidOTPFormat('123 56')).toBe(false);
            expect(isValidOTPFormat('')).toBe(false);
        });
    });

    describe('checkRateLimit', () => {
        const config = { maxAttempts: 3, windowMs: 1000 };
        let mockClient: any;
        let mockRpc: any;

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));

            mockRpc = vi.fn();
            mockClient = {
                rpc: mockRpc
            } as any;
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should allow requests within limit and track remaining', async () => {
            const testKey = 'key-within-limit';

            mockRpc
                .mockResolvedValueOnce({ data: { allowed: true, remaining: 2, reset_at: Date.now() + 1000 }, error: null })
                .mockResolvedValueOnce({ data: { allowed: true, remaining: 1, reset_at: Date.now() + 1000 }, error: null })
                .mockResolvedValueOnce({ data: { allowed: true, remaining: 0, reset_at: Date.now() + 1000 }, error: null });

            let result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2);

            result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);

            result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(0);
        });

        it('should reject requests over limit', async () => {
            const testKey = 'key-over-limit';

            mockRpc.mockResolvedValue({ data: { allowed: false, remaining: 0, reset_at: Date.now() + 1000 }, error: null });

            const result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should handle RPC errors gracefully (fail open)', async () => {
            const testKey = 'key-error';

            mockRpc.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

            const result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });
    });

    describe('extractClientInfo', () => {
        it('should extract IP from x-forwarded-for', () => {
            const req = new Request('http://localhost', {
                headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }
            });
            const info = extractClientInfo(req);
            expect(info.ip).toBe('1.2.3.4');
        });

        it('should extract IP from x-real-ip if x-forwarded-for is missing', () => {
            const req = new Request('http://localhost', {
                headers: { 'x-real-ip': '9.10.11.12' }
            });
            const info = extractClientInfo(req);
            expect(info.ip).toBe('9.10.11.12');
        });

        it('should fallback to unknown for IP and user agent', () => {
            const req = new Request('http://localhost');
            const info = extractClientInfo(req);
            expect(info.ip).toBe('unknown');
            expect(info.userAgent).toBe('unknown');
        });

        it('should extract user-agent', () => {
            const req = new Request('http://localhost', {
                headers: { 'user-agent': 'Mozilla/5.0' }
            });
            const info = extractClientInfo(req);
            expect(info.userAgent).toBe('Mozilla/5.0');
        });
    });

    describe('sanitizeErrorMessage', () => {
        it('should return generic message for stack traces', () => {
            const result = sanitizeErrorMessage({ message: 'Error: something broke at some/file.ts:10:5' });
            expect(result).toBe('An unexpected error occurred. Please try again.');
        });

        it('should redact sensitive keywords', () => {
            const result = sanitizeErrorMessage({ message: 'Invalid password provided' });
            expect(result).toBe('Invalid ******** provided');

            const result2 = sanitizeErrorMessage({ message: 'Auth token expired' });
            expect(result2).toBe('******** ******** expired');

            const result3 = sanitizeErrorMessage({ message: 'Secret key missing' });
            expect(result3).toBe('******** ******** missing');
        });

        it('should handle non-object or missing message', () => {
            expect(sanitizeErrorMessage(null)).toBe('An unexpected error occurred');
            expect(sanitizeErrorMessage({})).toBe('An unexpected error occurred');
        });
    });
});
