import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    generateOTPCode,
    isValidOTPFormat,
    checkRateLimit,
    sanitizeErrorMessage,
    extractClientInfo
} from '../logic/security';

describe('Security Logic', () => {
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
        const mockRpc = vi.fn();
        const mockClient = { rpc: mockRpc } as any;

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
            mockRpc.mockReset();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should allow requests within limit and track remaining', async () => {
            const testKey = 'key-within-limit';

            // Mock RPC response for 1st attempt
            mockRpc.mockResolvedValueOnce({
                data: [{ current_count: 1, current_reset_at: new Date(Date.now() + 1000).toISOString() }],
                error: null
            });

            let result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2);
            expect(mockRpc).toHaveBeenCalledWith('increment_rate_limit', {
                p_key: testKey,
                p_window_ms: config.windowMs
            });

            // Mock RPC response for 2nd attempt
            mockRpc.mockResolvedValueOnce({
                data: [{ current_count: 2, current_reset_at: new Date(Date.now() + 1000).toISOString() }],
                error: null
            });

            result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);
        });

        it('should reject requests over limit', async () => {
            const testKey = 'key-over-limit';

            // Mock RPC response for exceeding limit (4th attempt)
            mockRpc.mockResolvedValueOnce({
                data: [{ current_count: 4, current_reset_at: new Date(Date.now() + 1000).toISOString() }],
                error: null
            });

            const result = await checkRateLimit(mockClient, testKey, config);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should fail open (allow) on DB error', async () => {
            const testKey = 'key-error';

            // Mock RPC error
            mockRpc.mockResolvedValueOnce({
                data: null,
                error: { message: 'DB connection failed' }
            });

            const result = await checkRateLimit(mockClient, testKey, config);
            // Should be allowed (fail open)
            expect(result.allowed).toBe(true);
            // Default return on error is full limit available
            expect(result.remaining).toBe(3);
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
