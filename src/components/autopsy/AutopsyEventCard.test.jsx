import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AutopsyEventCard from './AutopsyEventCard';
import '@testing-library/jest-dom';

describe('AutopsyEventCard', () => {
  const mockEvent = {
    id: '1',
    event_type: 'revenue_drop',
    severity: 'critical',
    detected_at: '2023-01-01T12:00:00Z',
    impact_percentage: -10,
    impact_amount: -100,
    causal_reconstruction: {
      platform_behaviour: 'Algo change',
      creator_behaviour: 'Less uploads',
      external_timing: 'Holiday',
      historical_analogues: 'None'
    },
    exposure_score: {
      recurrence_probability: 0.8,
      expected_damage: 500,
      time_to_impact: 'immediate'
    }
  };

  it('renders event details correctly', () => {
    render(<AutopsyEventCard event={mockEvent} onDecision={() => {}} />);

    // Check for title (capitalized in component via replace)
    // "revenue_drop" -> "Revenue drop" but title case usually means first letter only capitalized?
    // Component code: event.event_type.replace(/_/g, ' ') and has class "capitalize"
    // So "revenue drop" -> "Revenue Drop" (CSS capitalize).
    // But getByText matches text content. CSS transform doesn't affect text content in DOM usually.
    // "revenue_drop".replace(/_/g, ' ') is "revenue drop".
    // Wait, let's check the code:
    // <h3 ... capitalize">{event.event_type.replace(/_/g, ' ')}</h3>
    // So text content is "revenue drop".
    expect(screen.getByText('revenue drop')).toBeInTheDocument();

    expect(screen.getByText('critical')).toBeInTheDocument();

    // Impact percentage logic:
    // {event.impact_percentage > 0 ? '+' : ''}{event.impact_percentage.toFixed(1)}%
    // -10 > 0 is false. So "" + "-10.0" + "%" = "-10.0%"
    expect(screen.getByText('-10.0%')).toBeInTheDocument();

    // Impact amount:
    // ${Math.abs(event.impact_amount || 0).toFixed(0)}
    // Math.abs(-100) = 100. So "$100"
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('calls onDecision when ignore button is clicked', () => {
    const handleDecision = vi.fn();
    render(<AutopsyEventCard event={mockEvent} onDecision={handleDecision} />);

    fireEvent.click(screen.getByText('Ignore'));
    expect(handleDecision).toHaveBeenCalledWith(mockEvent, 'ignored');
  });

  it('calls onDecision when mitigate button is clicked', () => {
    const handleDecision = vi.fn();
    render(<AutopsyEventCard event={mockEvent} onDecision={handleDecision} />);

    fireEvent.click(screen.getByText('Mitigate'));
    expect(handleDecision).toHaveBeenCalledWith(mockEvent, 'mitigated');
  });
});
