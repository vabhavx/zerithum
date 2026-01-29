import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncHistoryRow from './SyncHistoryRow';
import { Youtube } from 'lucide-react';
import { describe, it, expect } from 'vitest';

describe('SyncHistoryRow', () => {
  const mockPlatform = {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-500'
  };

  const mockSync = {
    id: 'sync_1',
    sync_started_at: '2024-01-15T10:00:00Z',
    transactions_synced: 50,
    duration_ms: 1500,
    status: 'success'
  };

  it('renders sync details correctly', () => {
    render(<SyncHistoryRow sync={mockSync} platform={mockPlatform} />);

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
    expect(screen.getByText('50 transactions')).toBeInTheDocument();
    expect(screen.getByText('1.5s')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('returns null if no platform', () => {
    const { container } = render(<SyncHistoryRow sync={mockSync} platform={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
