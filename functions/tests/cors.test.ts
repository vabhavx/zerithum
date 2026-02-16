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

    it('should return * when no origin is present', () => {
        const req = new Request('http://localhost');
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should allow localhost:3000', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'http://localhost:3000' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    });

    it('should allow base44.app subdomains', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'https://foo.base44.app' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('https://foo.base44.app');
    });

    it('should allow VITE_BASE44_APP_BASE_URL if set', () => {
        vi.stubGlobal('Deno', {
            env: {
                get: (key: string) => key === 'VITE_BASE44_APP_BASE_URL' ? 'https://custom.app' : undefined
            }
        });
        const req = new Request('http://localhost', {
            headers: { Origin: 'https://custom.app' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('https://custom.app');
    });

    it('should return null for disallowed origin', () => {
        const req = new Request('http://localhost', {
            headers: { Origin: 'http://evil.com' }
        });
        const headers = getCorsHeaders(req);
        expect(headers['Access-Control-Allow-Origin']).toBe('null');
    });
});
