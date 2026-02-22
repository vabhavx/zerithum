import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from './AuthContext';
import { supabase } from '@/api/supabaseClient';

// Mock the Supabase client
vi.mock('@/api/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signOut: vi.fn(),
        setSession: vi.fn(), // We will use this in the fix
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
    },
    base44: {
      auth: {
        me: vi.fn(),
      }
    }
  };
});

describe('AuthContext Security Vulnerability', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock window.location
    // Note: window.location is read-only in some environments, so we redefine it
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        hash: '',
        pathname: '/',
        search: '',
        assign: vi.fn(),
        href: 'http://localhost/',
        origin: 'http://localhost'
      },
    });

    // Mock import.meta.env
    // In Vitest/Vite, import.meta.env is populated from process.env for VITE_ prefixed variables
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call supabase.auth.setSession instead of localStorage.setItem when getSession fails but hash has token', async () => {
    // 1. Setup the scenario
    // Mock getSession to fail (throw error)
    supabase.auth.getSession.mockRejectedValue(new Error('Network error'));

    // Mock setSession to succeed
    const mockSession = {
        access_token: 'new-token',
        user: { id: '123', email: 'test@example.com' }
    };
    supabase.auth.setSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
    });

    // Set a valid looking access token in hash
    const payload = JSON.stringify({
      sub: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated'
    });
    const encodedPayload = btoa(payload);
    const validToken = `header.${encodedPayload}.signature`;

    window.location.hash = `#access_token=${validToken}&refresh_token=refresh123&expires_at=1234567890&token_type=bearer`;

    // 2. Render the component
    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    // 3. Wait for the async logic in useEffect
    await waitFor(() => {
        expect(supabase.auth.setSession).toHaveBeenCalled();
    }, { timeout: 2000 });

    // 4. Verify the arguments
    const calls = supabase.auth.setSession.mock.calls;
    expect(calls[0][0]).toEqual({
        access_token: validToken,
        refresh_token: 'refresh123'
    });

    // Ensure localStorage.setItem was NOT called for auth token
    const storageCalls = window.localStorage.setItem.mock.calls;
    const authCall = storageCalls.find(call => call[0].includes('auth-token'));
    expect(authCall).toBeUndefined();
  });

  it('should call supabase.auth.setSession when recovering from localStorage manually', async () => {
    // 1. Mock getSession to fail
    supabase.auth.getSession.mockRejectedValue(new Error('Network error'));

    // 2. Mock localStorage with valid data
    const projectId = 'test-project';
    const storageKey = `sb-${projectId}-auth-token`;
    const fakeSession = {
        access_token: 'fake-token',
        refresh_token: 'fake-refresh',
        user: { id: '123' }
    };

    window.localStorage.getItem.mockImplementation((key) => {
        if (key === storageKey) return JSON.stringify(fakeSession);
        return null;
    });

    // Mock setSession to succeed
    supabase.auth.setSession.mockResolvedValue({
        data: { session: fakeSession },
        error: null
    });

    // Render
    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    // Wait and check if setSession is called
    await waitFor(() => {
        expect(supabase.auth.setSession).toHaveBeenCalledWith({
            access_token: fakeSession.access_token,
            refresh_token: fakeSession.refresh_token
        });
    });
  });
});
