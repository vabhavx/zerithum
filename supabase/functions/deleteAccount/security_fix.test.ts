
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt } from '../_shared/utils/encryption.ts';

// 1. Mock Deno Globals
const mockEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  ENCRYPTION_KEY: '0000000000000000000000000000000000000000000000000000000000000000' // 32 bytes hex
};

vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => mockEnv[key],
  },
  serve: vi.fn(),
});

// 2. Mock Dependencies
// Mock Supabase Client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: { provider: 'google' }
        }
      },
      error: null
    }),
    signInWithPassword: vi.fn(),
    admin: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
    }
  },
  from: vi.fn(),
  rpc: vi.fn().mockResolvedValue({ data: [{ current_count: 0, current_reset_at: new Date() }], error: null }),
};

// Mock chainable methods
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

// Setup default behavior for chain
mockSupabase.from.mockReturnValue(mockChain);

vi.mock('npm:@supabase/supabase-js@2', () => ({
  createClient: () => mockSupabase
}));

// Mock revokeToken
const mockRevokeToken = vi.fn().mockResolvedValue(true);
vi.mock('../_shared/logic/revokeToken.ts', () => ({
  revokeToken: mockRevokeToken
}));

// Mock audit log to prevent errors
vi.mock('../_shared/utils/audit.ts', () => ({
  logAudit: vi.fn().mockResolvedValue(true)
}));

// Mock CORS
vi.mock('../_shared/utils/cors.ts', () => ({
  getCorsHeaders: () => ({})
}));

describe('deleteAccount Security Fix', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Re-import the module to capture the handler passed to Deno.serve
    // We need to bust cache if we want to re-run, but for a single run it's fine
    // Or we assume it runs once per test file execution
    // Since Deno.serve is called at top level, we import it once.
    if (!handler) {
      await import('./index.ts');
      const calls = (Deno.serve as any).mock.calls;
      if (calls.length > 0) {
        handler = calls[0][0];
      }
    }
  });

  it('should decrypt tokens before calling revokeToken', async () => {
    // Setup Test Data
    const plainToken = 'access_token_plain';
    const plainRefresh = 'refresh_token_plain';
    const encryptedToken = await encrypt(plainToken);
    const encryptedRefresh = await encrypt(plainRefresh);

    // Configure Mocks for this specific test
    // 1. Existing Request Check (Idempotency) -> None
    mockChain.single.mockResolvedValueOnce({ data: null }); // deletion_requests check

    // 2. Create Request -> Success
    mockChain.single.mockResolvedValueOnce({ data: { id: 'req-123' }, error: null }); // insert deletion_request

    // 3. Fetch Connected Platforms -> Return Encrypted Tokens
    // We need to identify which call corresponds to which query.
    // Ideally we'd use mockImplementation based on table name, but 'from' is called with table name.

    mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'connected_platforms') {
            return {
                ...mockChain,
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ // .eq('user_id', user.id) returns the promise result for select query
                    data: [{
                        platform: 'google',
                        oauth_token: encryptedToken,
                        refresh_token: encryptedRefresh,
                        shop_name: null,
                        user_id: 'user-123'
                    }],
                    error: null
                })
            }
        }
        if (table === 'verification_codes') {
             const chain: any = {};
             chain.select = vi.fn().mockReturnValue(chain);
             chain.eq = vi.fn().mockReturnValue(chain);
             chain.is = vi.fn().mockReturnValue(chain);
             chain.gt = vi.fn().mockReturnValue(chain);
             chain.order = vi.fn().mockReturnValue(chain);
             chain.limit = vi.fn().mockReturnValue(chain);
             chain.single = vi.fn().mockResolvedValue({
                 data: { id: 'code-123', code: '123456' },
                 error: null
             });
             chain.update = vi.fn().mockReturnValue(chain);
             return chain;
        }
        if (table === 'deletion_requests') {
             // Handle complex logic for deletion requests
             // 1. check existing: select('*').eq().single()
             // 2. insert: insert().select().single()
             // 3. update: update().eq()
             const chain = {
                 ...mockChain,
                 select: vi.fn().mockReturnThis(),
                 eq: vi.fn().mockImplementation((col, val) => {
                     if (col === 'id' && val === 'req-123') return Promise.resolve({ data: {}, error: null }); // update
                     // user_id check
                     return {
                         single: vi.fn().mockResolvedValue({ data: null }) // no existing request
                     };
                 }),
                 insert: vi.fn().mockReturnThis(),
                 single: vi.fn().mockResolvedValue({ data: { id: 'req-123' }, error: null }) // insert result
             };
             return chain;
        }
        // Default for other tables (user data deletion)
        return {
            ...mockChain,
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
        };
    });

    // Execute
    const req = new Request('http://localhost:54321/functions/v1/deleteAccount', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirmationText: 'DELETE',
        verificationCode: '123456'
      })
    });

    if (!handler) throw new Error('Handler not captured from Deno.serve');

    const response = await handler(req);
    const body = await response.json();

    // Assert Success
    expect(response.status).not.toBe(500);
    expect(body.ok).toBe(true);

    // Assert Revocation Logic
    // Verify that revokeToken was called
    expect(mockRevokeToken).toHaveBeenCalled();

    // Verify arguments - expecting PLAIN TEXT tokens
    const calls = mockRevokeToken.mock.calls;
    const args = calls[0]; // [ctx, platform, token, refresh, shop]

    expect(args[1]).toBe('google');
    expect(args[2]).toBe(plainToken); // This is the CRITICAL check
    expect(args[3]).toBe(plainRefresh);
  });
});
