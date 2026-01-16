import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ConnectedApps from './ConnectedApps';
import { BrowserRouter } from 'react-router-dom';
import * as ReactQuery from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Mock dependencies
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn(),
    },
    entities: {
      PlatformConnection: {
        list: vi.fn(),
      },
    },
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('ConnectedApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connected platforms with accessible buttons', async () => {
    // Mock user
    base44.auth.me.mockResolvedValue({ email: 'test@example.com' });

    // Mock query data
    const mockConnections = [
      {
        id: '123',
        platform: 'youtube',
        sync_status: 'active',
        created_by: 'test@example.com',
        last_synced: new Date().toISOString(),
      },
    ];

    vi.spyOn(ReactQuery, 'useQuery').mockReturnValue({
      data: mockConnections,
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <ConnectedApps />
      </BrowserRouter>
    );

    // Wait for user to be fetched and component to re-render
    await waitFor(() => {
      // Check for the "YouTube" text to ensure the row is rendered
      expect(screen.getByText('YouTube')).toBeInTheDocument();
    });

    // Verify accessible buttons are present
    const refreshBtn = screen.getByLabelText('Refresh YouTube connection');
    expect(refreshBtn).toBeInTheDocument();

    const disconnectBtn = screen.getByLabelText('Disconnect YouTube');
    expect(disconnectBtn).toBeInTheDocument();

    // Check form elements
    expect(screen.getByLabelText('Auto-sync frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Notify when token expires')).toBeInTheDocument();
  });
});
