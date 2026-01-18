import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import React from 'react';
import AuthCallback from './AuthCallback';
import { MemoryRouter } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import '@testing-library/jest-dom';

// Mock base44
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('AuthCallback CSRF Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Reset window.location
    // Note: In JSDOM, window.location is a bit tricky to mock directly if navigation happens,
    // but here we just read search params.
    // jsdom defines window.location as non-configurable, but let's try.
    // Ideally we use a URL in jsdom config, but overriding search property works in some envs.
    // Better way: use history.pushState or redefine window.location properly.

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '' }
    });
  });

  it('rejects request if no stored token (session expired)', async () => {
    window.location.search = '?code=123&state=youtube:token123';
    // No token in sessionStorage

    render(
        <MemoryRouter>
            <AuthCallback />
        </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Security session expired/i)).toBeInTheDocument());
    expect(base44.functions.invoke).not.toHaveBeenCalled();
  });

  it('rejects request if token mismatch', async () => {
    window.location.search = '?code=123&state=youtube:token123';
    sessionStorage.setItem('oauth_state', 'differentToken');

    render(
        <MemoryRouter>
            <AuthCallback />
        </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Security validation failed/i)).toBeInTheDocument());
    expect(base44.functions.invoke).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('oauth_state')).toBeNull(); // Should be cleared
  });

  it('rejects request if state format is invalid (legacy/attack)', async () => {
    window.location.search = '?code=123&state=youtube';
    sessionStorage.setItem('oauth_state', 'token123'); // We expect token

    render(
        <MemoryRouter>
            <AuthCallback />
        </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Security error: Invalid state format/i)).toBeInTheDocument());
    expect(base44.functions.invoke).not.toHaveBeenCalled();
  });

  it('proceeds if token matches', async () => {
    const token = 'validToken123';
    window.location.search = `?code=123&state=youtube:${token}`;
    sessionStorage.setItem('oauth_state', token);

    base44.functions.invoke.mockResolvedValue({ data: { success: true } });

    render(
        <MemoryRouter>
            <AuthCallback />
        </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument());
    expect(base44.functions.invoke).toHaveBeenCalledWith('exchangeOAuthTokens', {
      code: '123',
      platform: 'youtube'
    });
    expect(sessionStorage.getItem('oauth_state')).toBeNull(); // Should be consumed
  });
});
