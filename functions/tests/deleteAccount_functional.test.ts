import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('deleteAccount legacy table failure', () => {
    let handler: any;

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
            serve: (h: any) => { handler = h; },
        });

        vi.mock('npm:@supabase/supabase-js@2', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn(() => ({ data: { user: { id: 'test-user', email: 'test@example.com', app_metadata: { provider: 'email' } } }, error: null })),
                    signInWithPassword: vi.fn(() => ({ data: {}, error: null })),
                    admin: {
                        deleteUser: vi.fn(() => ({ error: null })),
                        signOut: vi.fn(),
                    }
                },
                from: vi.fn((table) => {
                    // Fail on platform_connections delete
                    if (table === 'platform_connections') {
                        return {
                            select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null })) })) })),
                            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: { message: 'Table does not exist' } })) })),
                            insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'req-id' } })) })) })),
                            update: vi.fn(() => ({ eq: vi.fn() })),
                        };
                    }
                    // Success for others
                    return {
                        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null })) })) })),
                        delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
                        insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'req-id' } })) })) })),
                        update: vi.fn(() => ({ eq: vi.fn() })),
                    };
                }),
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
            sanitizeErrorMessage: vi.fn((e: any) => e.message || e),
            OAUTH_PROVIDERS: [],
        }));

        vi.mock('../logic/revokeToken.ts', () => ({
            revokeToken: vi.fn(),
        }));

        vi.mock('../_shared/utils/cors.ts', () => ({
            getCorsHeaders: vi.fn(() => ({})),
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should NOT fail critically when platform_connections deletion fails', async () => {
        await import('../deleteAccount.ts');
        expect(handler).toBeDefined();

        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token' },
            body: JSON.stringify({ confirmationText: 'DELETE', currentPassword: 'password' })
        });

        const res = await handler(req);
        expect(res.status).toBe(200);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        let done = false;

        while (!done) {
            const { value, done: d } = await reader.read();
            if (value) result += decoder.decode(value);
            done = d;
        }

        // Should not fail critically
        expect(result).not.toContain('Critical failure: Could not delete from platform_connections');

        // Should continue to next table (connected_platforms)
        expect(result).toContain('"table":"connected_platforms"');

        // Should complete successfully
        expect(result).toContain('event: complete');
        expect(result).toContain('Your account has been permanently deleted');
    });
});
