import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import SyncHistoryRow from './SyncHistoryRow';

// Mock Lucide icon
const MockIcon = () => <div data-testid="mock-icon">Icon</div>;

describe('SyncHistoryRow', () => {
  const mockPlatform = {
    id: 'youtube',
    name: 'YouTube',
    icon: MockIcon,
    color: 'bg-red-500/10'
  };

  const mockSync = {
    id: 'sync_1',
    platform: 'youtube',
    sync_started_at: '2024-03-01T12:00:00Z',
    duration_ms: 1500,
    transactions_synced: 42,
    status: 'success'
  };

  it('renders sync details correctly', () => {
    render(<SyncHistoryRow sync={mockSync} platform={mockPlatform} />);

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('42 transactions')).toBeInTheDocument();
    expect(screen.getByText('1.5s')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText(/Mar 1, 12:00 PM/)).toBeInTheDocument();
  });

  it('renders different statuses correctly', () => {
    const errorSync = { ...mockSync, status: 'error' };
    render(<SyncHistoryRow sync={errorSync} platform={mockPlatform} />);

    const statusBadge = screen.getByText('error');
    expect(statusBadge).toHaveClass('text-red-400');
  });

  it('returns null if platform is missing', () => {
    const { container } = render(<SyncHistoryRow sync={mockSync} platform={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
