import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ConnectedPlatforms from './ConnectedPlatforms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import '@testing-library/jest-dom'; // Ensure this is imported

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ id: 'user123' })
    },
    entities: {
      ConnectedPlatform: {
        filter: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      SyncHistory: {
        filter: vi.fn().mockResolvedValue([])
      },
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock window.location
const originalLocation = window.location;
delete window.location;
window.location = { href: '' };

// Mock crypto.randomUUID if not present (JSDOM might have it, but to be safe)
if (!crypto.randomUUID) {
  crypto.randomUUID = () => 'test-uuid-1234';
}

describe('ConnectedPlatforms OAuth Flow', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    window.location.href = '';
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('generates a secure state token and stores it in sessionStorage when initiating OAuth', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ConnectedPlatforms />
      </QueryClientProvider>
    );

    // Wait for loading to finish and "Connect Platform" button to appear
    // The component shows "Loading platforms..." then either list or empty state.
    // Since we mocked empty list, it shows "No platforms connected" with a button.

    await waitFor(() => expect(screen.getByText('No platforms connected')).toBeInTheDocument());

    const connectButton = screen.getAllByText('Connect Platform')[0]; // There are two buttons
    fireEvent.click(connectButton);

    // Dialog opens. Click "YouTube" connect button.
    // YouTube is the first one usually. Or we can find by text "YouTube".
    // The dialog shows icons.
    const youtubeButton = screen.getByText('YouTube').closest('button');
    fireEvent.click(youtubeButton);

    // Check window.location.href
    expect(window.location.href).toContain('https://accounts.google.com/o/oauth2/v2/auth');

    // Check state parameter
    const url = new URL(window.location.href);
    const state = url.searchParams.get('state');

    expect(state).toContain('youtube:');

    const [platformId, token] = state.split(':');
    expect(platformId).toBe('youtube');
    expect(token).toBeTruthy();

    // Check sessionStorage
    const storedToken = sessionStorage.getItem('oauth_state');
    expect(storedToken).toBe(token);
  });
});
