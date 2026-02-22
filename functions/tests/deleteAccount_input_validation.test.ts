
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('deleteAccount vulnerability repro', () => {
    let handler: any;

    beforeEach(async () => {
        vi.resetModules();

        // Mock Deno globals
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

        // Mock dependencies to avoid import errors
        vi.mock('npm:@supabase/supabase-js@2', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn(() => ({ data: { user: { id: 'test-user' } }, error: null })),
                },
            })),
        }));

        // Use paths relative to the test file which is in functions/tests/
        // functions/deleteAccount.ts imports '../_shared/utils/audit.ts' (relative to functions/deleteAccount.ts)
        // This resolves to functions/_shared/utils/audit.ts
        // Since it doesn't exist, we must mock it to prevent resolution error?
        // Or vitest might handle it if we mock the module ID.

        vi.mock('../_shared/utils/audit.ts', () => ({
            logAudit: vi.fn(),
        }));

        vi.mock('../_shared/logic/security.ts', () => ({
            checkRateLimit: vi.fn(),
            isValidOTPFormat: vi.fn(),
            RATE_LIMITS: { DELETE_ACCOUNT: 1 },
            SECURITY_ACTIONS: {},
            extractClientInfo: vi.fn(() => ({})),
            sanitizeErrorMessage: vi.fn(),
            OAUTH_PROVIDERS: [],
        }));

        vi.mock('../logic/revokeToken.ts', () => ({
            revokeToken: vi.fn(),
        }));

        vi.mock('../_shared/utils/cors.ts', () => ({
            getCorsHeaders: vi.fn(() => ({})),
        }));

        vi.mock('../utils/encryption.ts', () => ({
            decrypt: vi.fn(),
        }));

        // Load the module to trigger Deno.serve
        // We use dynamic import to ensure mocks are active
        await import('../deleteAccount.ts');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should crash when body is null (or primitive) due to missing validation', async () => {
        if (!handler) {
            throw new Error('Handler not captured from Deno.serve');
        }

        const req = {
            method: 'POST',
            headers: {
                get: (key: string) => {
                    if (key === 'Authorization') return 'Bearer token';
                    return null;
                }
            },
            json: async () => null, // Returns null, simulating valid JSON 'null'
        };

        // Expect the handler to return 400 with "Request body must be a JSON object"
        const res = await handler(req);
        expect(res.status).toBe(400);
        const resBody = await res.json();
        expect(resBody.error).toBe('Request body must be a JSON object');
    });
});
