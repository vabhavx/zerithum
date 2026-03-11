import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCorsHeaders } from '../utils/cors';

describe('getCorsHeaders', () => {
    beforeEach(() => {
        vi.stubGlobal('Deno', {
            env: {
                get: vi.fn(),
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return null when no origin is present', () => {
        const req = new Request('http://localhost');
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('null');
    });

    it('should allow localhost:3000', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'http://localhost:3000' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    });

    it('should reject base44.app subdomains (legacy platform removed)', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'https://foo.base44.app' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('null');

        const req2 = new Request('http://localhost', {
            headers: { Origin: 'https://my-app.base44.app' }
        });
        const headers2 = getCorsHeaders(req2);
        expect(headers2['Access-Control-Allow-Origin']).toBe('null');
    });

    it('should not allow vercel.app domains anymore', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'https://foo.vercel.app' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('null');
    });

    it('should allow zerithum.com', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'https://zerithum.com' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('https://zerithum.com');
    });

    it('should return null for disallowed origin', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'http://evil.com' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('null');
    });
});
