import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncHistoryRow from './SyncHistoryRow';
import { describe, it, expect } from 'vitest';

describe('SyncHistoryRow', () => {
  const mockPlatform = {
    id: 'youtube',
    name: 'YouTube',
    icon: () => <svg data-testid="icon" />,
    color: 'bg-red-500',
  };

  const mockSync = {
    id: '123',
    sync_started_at: '2023-01-01T12:00:00Z',
    transactions_synced: 100,
    duration_ms: 2500,
    status: 'success',
  };

  it('renders correctly with given props', () => {
    render(<SyncHistoryRow sync={mockSync} platform={mockPlatform} />);

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('100 transactions')).toBeInTheDocument();
    expect(screen.getByText('2.5s')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders error status correctly', () => {
    const errorSync = { ...mockSync, status: 'error' };
    render(<SyncHistoryRow sync={errorSync} platform={mockPlatform} />);

    const statusElement = screen.getByText('error');
    expect(statusElement).toHaveClass('text-red-400');
  });

  it('returns null if platform is missing', () => {
     const { container } = render(<SyncHistoryRow sync={mockSync} platform={null} />);
     expect(container).toBeEmptyDOMElement();
  });
});
