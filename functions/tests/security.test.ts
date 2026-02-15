import { describe, it, expect } from 'vitest';
import { validateReceiptUrl } from '../utils/security.ts';

describe('validateReceiptUrl', () => {
    it('should accept valid https URLs', () => {
        expect(validateReceiptUrl('https://example.com/receipt.jpg')).toBe(true);
        expect(validateReceiptUrl('https://storage.googleapis.com/bucket/receipt.png')).toBe(true);
    });

    it('should accept valid http URLs', () => {
        expect(validateReceiptUrl('http://example.com/receipt.jpg')).toBe(true);
    });

    it('should reject invalid protocols', () => {
        expect(validateReceiptUrl('ftp://example.com/file')).toBe(false);
        expect(validateReceiptUrl('file:///etc/passwd')).toBe(false);
        expect(validateReceiptUrl('javascript:alert(1)')).toBe(false);
        expect(validateReceiptUrl('blob:https://example.com/123')).toBe(false);
    });

    it('should reject localhost', () => {
        expect(validateReceiptUrl('http://localhost:3000')).toBe(false);
        expect(validateReceiptUrl('https://localhost')).toBe(false);
        expect(validateReceiptUrl('http://sub.localhost')).toBe(false);
    });

    it('should reject private IPv4 addresses', () => {
        expect(validateReceiptUrl('http://127.0.0.1')).toBe(false);
        expect(validateReceiptUrl('http://10.0.0.1')).toBe(false);
        expect(validateReceiptUrl('http://192.168.1.1')).toBe(false);
        expect(validateReceiptUrl('http://172.16.0.1')).toBe(false);
        expect(validateReceiptUrl('http://169.254.169.254')).toBe(false);
        expect(validateReceiptUrl('http://0.0.0.0')).toBe(false);
    });

    it('should reject private IPv6 addresses', () => {
        expect(validateReceiptUrl('http://[::1]')).toBe(false);
        expect(validateReceiptUrl('http://[fc00::1]')).toBe(false);
        expect(validateReceiptUrl('http://[fe80::1]')).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
        expect(validateReceiptUrl('not-a-url')).toBe(false);
        expect(validateReceiptUrl('')).toBe(false);
    });
});
