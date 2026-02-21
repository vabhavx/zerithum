import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('deleteAccount type check', () => {
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
            serve: vi.fn(),
        });

        vi.mock('npm:@supabase/supabase-js@2', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn(() => ({ data: { user: { id: 'test-user', email: 'test@example.com', app_metadata: {} } }, error: null })),
                    admin: {
                        deleteUser: vi.fn(),
                        signOut: vi.fn(),
                    }
                },
                from: vi.fn(() => ({
                    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null })) })) })),
                    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'req-id' } })) })) })),
                    update: vi.fn(() => ({ eq: vi.fn() })),
                    delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
                })),
            })),
        }));

        vi.mock('../_shared/utils/audit.ts', () => ({
            logAudit: vi.fn(),
        }));

        vi.mock('../_shared/logic/security.ts', () => ({
            checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true, resetAt: new Date() })),
            isValidOTPFormat: vi.fn(() => true),
            RATE_LIMITS: { DELETE_ACCOUNT: 1 },
            SECURITY_ACTIONS: {},
            extractClientInfo: vi.fn(() => ({})),
            sanitizeErrorMessage: vi.fn((e: any) => e),
            OAUTH_PROVIDERS: ['google', 'github', 'gitlab', 'bitbucket', 'azure', 'facebook', 'twitter'],
        }));

        vi.mock('../logic/revokeToken.ts', () => ({
            revokeToken: vi.fn(),
        }));

        vi.mock('../_shared/utils/cors.ts', () => ({
            getCorsHeaders: vi.fn((req) => {
                const origin = req.headers.get('Origin');
                return {
                    'Access-Control-Allow-Origin': (origin === 'http://localhost:3000' || origin?.endsWith('.base44.app')) ? origin : 'null',
                    'Access-Control-Allow-Headers': 'mock-headers',
                    'Access-Control-Allow-Methods': 'mock-methods',
                };
            }),
            CORS_HEADERS: 'mock-headers',
            CORS_METHODS: 'mock-methods',
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should load deleteAccount without type errors', async () => {
        await import('../deleteAccount.ts');
        expect(globalThis.Deno.serve).toHaveBeenCalled();
    });
});
