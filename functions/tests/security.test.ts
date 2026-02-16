import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateReceiptUrl } from '../utils/security.ts';

describe('validateReceiptUrl', () => {
    beforeEach(() => {
        vi.stubGlobal('Deno', {
            resolveDns: vi.fn().mockImplementation(async (hostname, type) => {
                if (hostname === 'safe.com') return type === 'A' ? ['93.184.216.34'] : [];
                if (hostname === 'malicious.com') return type === 'A' ? ['127.0.0.1'] : [];
                if (hostname === 'malicious6.com') return type === 'AAAA' ? ['::1'] : [];
                return [];
            })
        });
    });

    it('should accept valid https URLs', async () => {
        expect(await validateReceiptUrl('https://example.com/receipt.jpg')).toBe(true);
        expect(await validateReceiptUrl('https://storage.googleapis.com/bucket/receipt.png')).toBe(true);
    });

    it('should accept valid http URLs', async () => {
        expect(await validateReceiptUrl('http://example.com/receipt.jpg')).toBe(true);
    });

    it('should reject invalid protocols', async () => {
        expect(await validateReceiptUrl('ftp://example.com/file')).toBe(false);
        expect(await validateReceiptUrl('file:///etc/passwd')).toBe(false);
        expect(await validateReceiptUrl('javascript:alert(1)')).toBe(false);
        expect(await validateReceiptUrl('blob:https://example.com/123')).toBe(false);
    });

    it('should reject localhost', async () => {
        expect(await validateReceiptUrl('http://localhost:3000')).toBe(false);
        expect(await validateReceiptUrl('https://localhost')).toBe(false);
        expect(await validateReceiptUrl('http://sub.localhost')).toBe(false);
    });

    it('should reject private IPv4 addresses', async () => {
        expect(await validateReceiptUrl('http://127.0.0.1')).toBe(false);
        expect(await validateReceiptUrl('http://10.0.0.1')).toBe(false);
        expect(await validateReceiptUrl('http://192.168.1.1')).toBe(false);
        expect(await validateReceiptUrl('http://172.16.0.1')).toBe(false);
        expect(await validateReceiptUrl('http://169.254.169.254')).toBe(false);
        expect(await validateReceiptUrl('http://0.0.0.0')).toBe(false);
    });

    it('should reject private IPv6 addresses', async () => {
        expect(await validateReceiptUrl('http://[::1]')).toBe(false);
        expect(await validateReceiptUrl('http://[fc00::1]')).toBe(false);
        expect(await validateReceiptUrl('http://[fe80::1]')).toBe(false);
    });

    it('should reject domains resolving to private IPs', async () => {
        expect(await validateReceiptUrl('http://malicious.com')).toBe(false);
        expect(await validateReceiptUrl('http://malicious6.com')).toBe(false);
    });

    it('should accept domains resolving to public IPs', async () => {
        expect(await validateReceiptUrl('http://safe.com')).toBe(true);
    });

    it('should handle invalid URLs gracefully', async () => {
        expect(await validateReceiptUrl('not-a-url')).toBe(false);
        expect(await validateReceiptUrl('')).toBe(false);
    });
});
