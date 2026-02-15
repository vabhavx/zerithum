import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock supabaseClient module because it executes code on import (createClient)
// But we want to test the functions.invoke part which uses fetch.

// Mock the environment variables before import
vi.stubGlobal('import.meta', {
    env: {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key'
    }
});

// Mock supabase-js
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'fake-token' } }
            })
        }
    })
}));

// Import the module under test
import { functions } from './supabaseClient';

describe('functions.invoke error handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should throw the specific error message from JSON response even if requiresReauth is missing', async () => {
        const errorResponse = { error: 'Internal Server Error: Database failure' };
        let bodyUsed = false;

        // Mock fetch to return a 500 error with JSON body
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => {
                if (bodyUsed) throw new TypeError('Body already used');
                bodyUsed = true;
                return errorResponse;
            },
            text: async () => {
                if (bodyUsed) throw new TypeError('Body already used');
                bodyUsed = true;
                return JSON.stringify(errorResponse);
            }
        });

        // Verify that it throws the specific error message, NOT the generic one
        // This expectation should FAIL with current implementation
        await expect(functions.invoke('test-function')).rejects.toThrow('Internal Server Error: Database failure');
    });

    it('should fall back to status text if JSON parsing fails', async () => {
        let bodyUsed = false;
        // Mock fetch to return a 500 error with non-JSON body
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => {
                if (bodyUsed) throw new TypeError('Body already used');
                bodyUsed = true; // Consumed even if failed? Usually yes.
                throw new SyntaxError('Unexpected token');
            },
            text: async () => {
                 if (bodyUsed) throw new TypeError('Body already used');
                 bodyUsed = true;
                 return 'Raw error text';
            }
        });

        // Verify that it throws the raw text or status message
        // Since json() failed and consumed body (in real fetch), text() also fails.
        // So it returns status code message.
        await expect(functions.invoke('test-function')).rejects.toThrow(/Edge Function returned a non-2xx status code/);
    });
});
