import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('deleteAccount security', () => {
    let handler: (req: Request) => Promise<Response>;

    beforeEach(async () => {
        vi.resetModules();
        vi.unstubAllGlobals();

        // Mock Deno
        vi.stubGlobal('Deno', {
            env: {
                get: (key: string) => {
                    if (key === 'SUPABASE_URL') return 'http://mock-url';
                    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'mock-key';
                    return undefined;
                }
            },
            serve: vi.fn((h) => {
                handler = h;
            }),
        });

        // Mock dependencies
        vi.mock('npm:@supabase/supabase-js@2', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn(() => ({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null })),
                    signInWithPassword: vi.fn(),
                    admin: {
                        deleteUser: vi.fn(),
                        signOut: vi.fn(),
                    }
                },
                from: vi.fn(() => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn(() => ({ data: null })), // existingRequest
                        })),
                    })),
                    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'req-id' } })) })) })),
                    update: vi.fn(() => ({ eq: vi.fn() })),
                    delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
                })),
            })),
        }));

        // Mock internal utils
        // Paths relative to functions/tests/deleteAccount_security.test.ts
        // Original imports in index.ts: ../_shared/utils/audit.ts -> supabase/functions/_shared/utils/audit.ts
        // Relative to test file: ../../supabase/functions/_shared/utils/audit.ts
        vi.mock('../../supabase/functions/_shared/utils/audit.ts', () => ({
            logAudit: vi.fn(),
        }));

        vi.mock('../../supabase/functions/_shared/logic/security.ts', () => ({
            checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true, resetAt: new Date() })),
            isValidOTPFormat: vi.fn(() => true),
            RATE_LIMITS: { DELETE_ACCOUNT: 1 },
            SECURITY_ACTIONS: {},
            extractClientInfo: vi.fn(() => ({})),
            sanitizeErrorMessage: vi.fn((e: any) => e),
            OAUTH_PROVIDERS: [],
        }));

        vi.mock('../../supabase/functions/_shared/logic/revokeToken.ts', () => ({
            revokeToken: vi.fn(),
        }));

        vi.mock('../../supabase/functions/_shared/utils/cors.ts', () => ({
            getCorsHeaders: vi.fn(() => ({})),
        }));

        // Import the module to trigger Deno.serve
        await import('../../supabase/functions/deleteAccount/index.ts');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('should handle null JSON body gracefully', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
            body: 'null', // valid JSON, but null
        });

        try {
            const response = await handler(req);
            const data = await response.json();

            // Should fail here if not fixed
            expect(response.status).toBe(400);
            expect(data.error).toMatch(/Invalid JSON body|Request body must be a JSON object/);
        } catch (e) {
            // If the handler throws (as expected before fix), we catch it here
            // But strict verification means we expect the handler NOT to throw
            throw e;
        }
    });

    it('should handle primitive JSON body gracefully (number)', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
            body: '123',
        });

        const response = await handler(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/Invalid JSON body|Request body must be a JSON object/);
    });

    it('should handle primitive JSON body gracefully (string)', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
            body: '"some string"',
        });

        const response = await handler(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/Invalid JSON body|Request body must be a JSON object/);
    });

    it('should handle array JSON body gracefully', async () => {
        const req = new Request('http://localhost', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
            body: '[]',
        });

        const response = await handler(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/Invalid JSON body|Request body must be a JSON object/);
    });
});
