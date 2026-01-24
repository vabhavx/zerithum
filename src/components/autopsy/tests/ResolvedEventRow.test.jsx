import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import ResolvedEventRow from '../ResolvedEventRow';
import '@testing-library/jest-dom';

describe('ResolvedEventRow', () => {
  it('renders correctly', () => {
    const mockEvent = {
      id: '1',
      status: 'mitigated',
      event_type: 'revenue_drop',
      decision_made_at: '2023-10-27T10:00:00Z',
      impact_percentage: -12.5
    };

    render(<ResolvedEventRow event={mockEvent} />);

    expect(screen.getByText('MITIGATED')).toBeInTheDocument();
    expect(screen.getByText('revenue drop')).toBeInTheDocument();
    expect(screen.getByText('Oct 27, 2023')).toBeInTheDocument();
    expect(screen.getByText('-12.5% impact')).toBeInTheDocument();
  });

  it('renders ignored status correctly', () => {
     const mockEvent = {
      id: '2',
      status: 'ignored',
      event_type: 'payout_delay',
      decision_made_at: '2023-10-28T10:00:00Z',
      impact_percentage: 5.0
    };

    render(<ResolvedEventRow event={mockEvent} />);
    expect(screen.getByText('IGNORED')).toBeInTheDocument();
  });
});
