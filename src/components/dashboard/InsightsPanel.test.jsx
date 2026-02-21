// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import InsightsPanel from './InsightsPanel';

// Setup matchers
expect.extend(matchers);

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  TrendingUp: () => <div data-testid="icon-trending-up" />,
  DollarSign: () => <div data-testid="icon-dollar-sign" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  X: () => <div data-testid="icon-x" />,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }) => (
      <div className={className} onClick={onClick} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('InsightsPanel', () => {
  const mockInsights = [
    {
      id: '1',
      insight_type: 'concentration_risk',
      title: 'Risk Alert',
      description: 'High concentration risk detected.',
      confidence: 0.85,
    },
    {
      id: '2',
      insight_type: 'pricing_suggestion',
      title: 'Pricing Opportunity',
      description: 'Consider increasing prices.',
      confidence: 0.6,
    },
  ];

  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when insights are empty', () => {
    const { container } = render(<InsightsPanel insights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when insights are null', () => {
    const { container } = render(<InsightsPanel insights={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correct number of insights', () => {
    render(<InsightsPanel insights={mockInsights} />);
    expect(screen.getAllByTestId('motion-div')).toHaveLength(2);
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('renders insight content correctly', () => {
    render(<InsightsPanel insights={mockInsights} />);

    // Check titles
    expect(screen.getByText('Risk Alert')).toBeInTheDocument();
    expect(screen.getByText('Pricing Opportunity')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('High concentration risk detected.')).toBeInTheDocument();
    expect(screen.getByText('Consider increasing prices.')).toBeInTheDocument();

    // Check icons based on type
    expect(screen.getByTestId('icon-alert-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('icon-dollar-sign')).toBeInTheDocument();
  });

  it('renders confidence bar correctly', () => {
    render(<InsightsPanel insights={mockInsights} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<InsightsPanel insights={mockInsights} onDismiss={mockOnDismiss} />);

    const dismissButtons = screen.getAllByLabelText('Dismiss insight');
    fireEvent.click(dismissButtons[0]);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });

  it('does not render dismiss button if onDismiss is not provided', () => {
    render(<InsightsPanel insights={mockInsights} />);

    const dismissButtons = screen.queryAllByLabelText('Dismiss insight');
    expect(dismissButtons).toHaveLength(0);
  });

  it('uses default config for unknown insight type', () => {
    const unknownInsight = [{
      id: '3',
      insight_type: 'unknown_type',
      title: 'Unknown',
      description: 'Unknown type test.',
    }];

    render(<InsightsPanel insights={unknownInsight} />);

    // Should fallback to anomaly_detection icon (AlertCircle)
    expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
  });
});
