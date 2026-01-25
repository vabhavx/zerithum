import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConnectedPlatformRow from './ConnectedPlatformRow';
import { TooltipProvider } from '@/components/ui/tooltip';
import { vi } from 'vitest';
import { FileText } from 'lucide-react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, layout, initial, animate, ...props }) => <div className={className} {...props}>{children}</div>
  }
}));

// Mock ResizeObserver for Recharts/UI components if needed
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('ConnectedPlatformRow', () => {
  const mockPlatform = {
    id: 'test-platform',
    name: 'Test Platform',
    icon: FileText,
    color: 'bg-red-500',
    description: 'Test Description'
  };

  const mockConnection = {
    id: 'conn-1',
    platform: 'test-platform',
    sync_status: 'active',
    connected_at: '2023-01-01T00:00:00Z',
    last_synced_at: '2023-01-02T00:00:00Z'
  };

  const mockOnViewHistory = vi.fn();
  const mockOnSync = vi.fn();
  const mockOnDisconnect = vi.fn();

  const renderWithTooltip = (ui) => {
    return render(
      <TooltipProvider>
        {ui}
      </TooltipProvider>
    );
  };

  it('renders platform details correctly', () => {
    renderWithTooltip(
      <ConnectedPlatformRow
        platform={mockPlatform}
        connection={mockConnection}
        onViewHistory={mockOnViewHistory}
        onSync={mockOnSync}
        onDisconnect={mockOnDisconnect}
      />
    );

    expect(screen.getByText('Test Platform')).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders View History button with tooltip accessibility', () => {
    renderWithTooltip(
      <ConnectedPlatformRow
        platform={mockPlatform}
        connection={mockConnection}
        onViewHistory={mockOnViewHistory}
        onSync={mockOnSync}
        onDisconnect={mockOnDisconnect}
      />
    );

    const historyButton = screen.getByRole('button', { name: /View sync history/i });
    expect(historyButton).toBeInTheDocument();

    // Test click
    fireEvent.click(historyButton);
    expect(mockOnViewHistory).toHaveBeenCalledWith(mockConnection);
  });

  it('renders Disconnect button with tooltip accessibility', () => {
    renderWithTooltip(
      <ConnectedPlatformRow
        platform={mockPlatform}
        connection={mockConnection}
        onViewHistory={mockOnViewHistory}
        onSync={mockOnSync}
        onDisconnect={mockOnDisconnect}
      />
    );

    const disconnectButton = screen.getByRole('button', { name: /Disconnect Test Platform/i });
    expect(disconnectButton).toBeInTheDocument();

    // Test click
    fireEvent.click(disconnectButton);
    expect(mockOnDisconnect).toHaveBeenCalledWith(mockConnection, mockPlatform);
  });
});
