import { render, screen, fireEvent } from '@testing-library/react';
import ConnectedPlatformRow from './ConnectedPlatformRow';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Clock: () => <span data-testid="icon-clock" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Loader2: () => <span data-testid="icon-loader" />,
  FileText: () => <span data-testid="icon-file" />,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, layout, initial, animate, exit, ...props }) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    )
  }
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, 'aria-label': ariaLabel }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  )
}));

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.join(' ')
}));

describe('ConnectedPlatformRow', () => {
  const MockIcon = () => <span data-testid="icon-platform" />;

  const mockPlatform = {
    id: 'youtube',
    name: 'YouTube',
    icon: MockIcon,
    color: 'bg-red-500',
    description: 'Test Description'
  };

  const mockConnection = {
    id: '123',
    platform: 'youtube',
    sync_status: 'active',
    connected_at: '2023-01-01T00:00:00Z',
    last_synced_at: '2023-01-02T00:00:00Z'
  };

  const mockHandlers = {
    onViewHistory: vi.fn(),
    onSync: vi.fn(),
    onDisconnect: vi.fn()
  };

  it('renders platform name and status', () => {
    render(
      <ConnectedPlatformRow
        connection={mockConnection}
        platform={mockPlatform}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('calls onSync when sync button is clicked', () => {
    render(
      <ConnectedPlatformRow
        connection={mockConnection}
        platform={mockPlatform}
        {...mockHandlers}
      />
    );

    const syncBtn = screen.getByLabelText('Sync YouTube data');
    fireEvent.click(syncBtn);
    expect(mockHandlers.onSync).toHaveBeenCalledWith(mockConnection);
  });

  it('calls onDisconnect when trash button is clicked', () => {
    render(
      <ConnectedPlatformRow
        connection={mockConnection}
        platform={mockPlatform}
        {...mockHandlers}
      />
    );

    const disconnectBtn = screen.getByLabelText('Disconnect YouTube');
    fireEvent.click(disconnectBtn);
    expect(mockHandlers.onDisconnect).toHaveBeenCalledWith(mockConnection, mockPlatform);
  });

  it('disables sync button when isSyncing is true', () => {
    render(
      <ConnectedPlatformRow
        connection={mockConnection}
        platform={mockPlatform}
        {...mockHandlers}
        isSyncing={true}
      />
    );

    const syncBtn = screen.getByLabelText('Sync YouTube data');
    expect(syncBtn).toBeDisabled();
  });
});
