import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InsightsPanel from './InsightsPanel';
import LendingSignalsCard from './LendingSignalsCard';
import AlertBanner from './AlertBanner';

// Mock framer-motion to avoid JSDOM issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('Dashboard Components', () => {
  describe('InsightsPanel', () => {
    it('renders null when no insights provided', () => {
      const { container } = render(<InsightsPanel insights={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders insights correctly', () => {
      const insights = [
        {
          id: '1',
          insight_type: 'concentration_risk',
          title: 'Risk Detected',
          description: 'High concentration.',
          confidence: 0.9
        }
      ];
      render(<InsightsPanel insights={insights} />);
      expect(screen.getByText('Risk Detected')).toBeInTheDocument();
      expect(screen.getByText('High concentration.')).toBeInTheDocument();
    });
  });

  describe('LendingSignalsCard', () => {
    it('renders null when no predictions provided', () => {
      const { container } = render(<LendingSignalsCard insight={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders prediction data', () => {
      const insight = {
        confidence: 0.85,
        data: {
          predictions: [
            {
              platform: 'youtube',
              predictedAmount: 100,
              predictedDate: '2023-01-01',
              confidenceInterval: 10
            }
          ]
        }
      };
      render(<LendingSignalsCard insight={insight} />);
      expect(screen.getByText('Cashflow Forecast')).toBeInTheDocument();
      const amounts = screen.getAllByText('$100');
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  describe('AlertBanner', () => {
    it('renders null when no alerts provided', () => {
      const { container } = render(<AlertBanner alerts={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders alerts and handles dismiss', () => {
      const onDismiss = vi.fn();
      const alerts = [
        {
          id: '1',
          type: 'error',
          title: 'Error Alert',
          dismissible: true
        }
      ];
      render(<AlertBanner alerts={alerts} onDismiss={onDismiss} />);
      expect(screen.getByText('Error Alert')).toBeInTheDocument();

      const button = screen.getByLabelText('Dismiss Error Alert');
      fireEvent.click(button);
      expect(onDismiss).toHaveBeenCalledWith('1');
    });
  });
});
