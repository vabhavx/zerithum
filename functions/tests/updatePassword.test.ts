import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('updatePassword', () => {
    let serveHandler: any;

    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('Deno', {
            env: {
                get: (key: string) => {
                    if (key === 'SUPABASE_URL') return 'http://mock-url';
                    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'mock-key';
                    return undefined;
                }
            },
            serve: vi.fn((handler) => {
                serveHandler = handler;
            }),
        });

        vi.mock('npm:@supabase/supabase-js@2', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn(() => ({ data: { user: { id: 'test-user', email: 'test@example.com', app_metadata: { provider: 'email' } } }, error: null })),
                    signInWithPassword: vi.fn(() => ({ error: null })),
                    admin: {
                        updateUserById: vi.fn(() => ({ error: null })),
                        signOut: vi.fn(),
                    }
                },
                from: vi.fn(() => ({
                    select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ is: vi.fn(() => ({ gt: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'code-id' }, error: null })) })) })) })) })) })) })) })),
                    update: vi.fn(() => ({ eq: vi.fn() })),
                })),
            })),
        }));

        vi.mock('../utils/audit.ts', () => ({
            logAudit: vi.fn(),
        }));

        vi.mock('../logic/security.ts', () => ({
            validatePassword: vi.fn(() => Promise.resolve({ valid: true, strength: 'strong', errors: [] })),
            checkRateLimit: vi.fn(() => ({ allowed: true })),
            isValidOTPFormat: vi.fn(() => true),
            RATE_LIMITS: { PASSWORD_CHANGE: 1 },
            SECURITY_ACTIONS: {},
            extractClientInfo: vi.fn(() => ({})),
            sanitizeErrorMessage: vi.fn((e: any) => e),
        }));

        vi.mock('../utils/cors.ts', () => ({
            getCorsHeaders: vi.fn((req) => ({
                'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Headers': 'content-type',
            })),
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should use secure CORS headers', async () => {
        await import('../updatePassword.ts');

        expect(serveHandler).toBeDefined();

        const req = new Request('http://localhost:3000/updatePassword', {
            method: 'OPTIONS',
            headers: { Origin: 'http://localhost:3000' }
        });

        const res = await serveHandler(req);

        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });
});
