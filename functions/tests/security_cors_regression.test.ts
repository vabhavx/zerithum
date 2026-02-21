import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CORS security regression', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('Deno', {
            env: {
                get: (key: string) => {
                    if (key === 'SUPABASE_URL') return 'http://mock';
                    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'mock';
                    return undefined;
                }
            },
            serve: vi.fn(),
        });

        vi.mock('npm:@supabase/supabase-js@2', () => ({
            createClient: vi.fn(() => ({})),
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('updatePassword should use getCorsHeaders', async () => {
        const getCorsHeaders = vi.fn(() => ({ 'Access-Control-Allow-Origin': 'mocked' }));
        vi.doMock('../utils/cors.ts', () => ({
            getCorsHeaders,
            CORS_HEADERS: 'mock',
            CORS_METHODS: 'mock'
        }));

        await import('../updatePassword.ts');

        const handler = (globalThis.Deno.serve as any).mock.calls[0][0];
        const req = new Request('http://localhost', { method: 'OPTIONS' });
        const res = await handler(req);

        expect(getCorsHeaders).toHaveBeenCalled();
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('mocked');
    });

    it('sendVerificationCode should use getCorsHeaders', async () => {
        const getCorsHeaders = vi.fn(() => ({ 'Access-Control-Allow-Origin': 'mocked-svc' }));
        // Since vi.mock is hoisted, we use a shared mock state or separate files.
        // But resetModules + doMock can work.
        vi.doMock('../utils/cors.ts', () => ({
            getCorsHeaders,
            CORS_HEADERS: 'mock',
            CORS_METHODS: 'mock'
        }));

        await import('../sendVerificationCode.ts');

        const handler = (globalThis.Deno.serve as any).mock.calls[0][0];
        const req = new Request('http://localhost', { method: 'OPTIONS' });
        const res = await handler(req);

        expect(getCorsHeaders).toHaveBeenCalled();
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('mocked-svc');
    });

    it('revokeAllSessions should use getCorsHeaders', async () => {
        const getCorsHeaders = vi.fn(() => ({ 'Access-Control-Allow-Origin': 'mocked-ras' }));
        vi.doMock('../utils/cors.ts', () => ({
            getCorsHeaders,
            CORS_HEADERS: 'mock',
            CORS_METHODS: 'mock'
        }));

        await import('../revokeAllSessions.ts');

        const handler = (globalThis.Deno.serve as any).mock.calls[0][0];
        const req = new Request('http://localhost', { method: 'OPTIONS' });
        const res = await handler(req);

        expect(getCorsHeaders).toHaveBeenCalled();
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('mocked-ras');
    });
});
