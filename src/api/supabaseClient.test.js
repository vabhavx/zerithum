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

// Mock supabase instance
const mockSupabaseInstance = {
    auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'fake-token' } }
        }),
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } }
        })
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'test-user-id' } }),
    storage: {
        from: vi.fn().mockReturnThis()
    }
};

// Mock supabase-js
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabaseInstance
}));

// Mock storage
const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', mockSessionStorage);

// Mock location
vi.stubGlobal('location', {
    href: '',
    origin: 'https://app.zerithum.com'
});

// Import the module under test
import { auth, functions, appLogs } from './supabaseClient';

describe('auth redirection security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.location.href = '';
    });

    it('logout should redirect to provided URL if safe', async () => {
        await auth.logout('/safe-page');
        expect(window.location.href).toBe('/safe-page');
    });

    it('logout should redirect to / if provided URL is unsafe', async () => {
        await auth.logout('https://evil.com');
        expect(window.location.href).toBe('/');
    });

    it('logout should redirect to / if no URL provided', async () => {
        await auth.logout();
        expect(window.location.href).toBe('/');
    });

    it('redirectToLogin should store redirect URL if safe', () => {
        auth.redirectToLogin('/dashboard');
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectAfterLogin', '/dashboard');
        expect(window.location.href).toBe('/login');
    });

    it('redirectToLogin should NOT store redirect URL if unsafe', () => {
        auth.redirectToLogin('https://evil.com');
        expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
    });
});

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

describe('appLogs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should log generic events', async () => {
        await expect(appLogs.logEvent('test_event', { foo: 'bar' })).resolves.toBeUndefined();
    });

    it('should log user in app', async () => {
        await expect(appLogs.logUserInApp('dashboard')).resolves.toBeUndefined();
    });
});
