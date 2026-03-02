// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { CalculationBreakdown } from './CalculationBreakdown';

expect.extend(matchers);

vi.mock('lucide-react', () => ({
  Calculator: () => <div data-testid="icon-calculator" />,
  ChevronDown: () => <div data-testid="icon-chevron-down" />,
  ChevronUp: () => <div data-testid="icon-chevron-up" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('CalculationBreakdown', () => {
  const mockRows = [
    { step: 'Gross Income', formula: 'Sum of all revenues', result: '$100,000.00', source: 'Bank Transactions' },
    { step: 'Deductions', formula: 'Sum of all expenses', result: '$20,000.00', source: 'Receipts' },
    { step: 'Net Income', formula: 'Gross - Deductions', result: '$80,000.00', source: 'Calculation' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders closed by default', () => {
    render(<CalculationBreakdown rows={mockRows} />);
    expect(screen.getByText('Detailed Calculation Breakdown')).toBeInTheDocument();
    expect(screen.getByTestId('icon-calculator')).toBeInTheDocument();
    expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-chevron-up')).not.toBeInTheDocument();
    expect(screen.queryByText('Gross Income')).not.toBeInTheDocument();
  });

  it('opens and closes on click', async () => {
    const user = userEvent.setup();
    render(<CalculationBreakdown rows={mockRows} />);

    const button = screen.getByRole('button');

    // Open
    await user.click(button);
    await waitFor(() => {
        expect(screen.getByTestId('icon-chevron-up')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('icon-chevron-down')).not.toBeInTheDocument();

    // Verify content is rendered
    expect(screen.getByText('Gross Income')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();

    // Close
    await user.click(button);
    await waitFor(() => {
        expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('icon-chevron-up')).not.toBeInTheDocument();
    expect(screen.queryByText('Gross Income')).not.toBeInTheDocument();
  });

  it('renders table headers correctly when open', async () => {
    const user = userEvent.setup();
    render(<CalculationBreakdown rows={mockRows} />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
        expect(screen.getByText('Step')).toBeInTheDocument();
    });
    expect(screen.getByText('Formula')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('renders all rows correctly', async () => {
    const user = userEvent.setup();
    render(<CalculationBreakdown rows={mockRows} />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
        expect(screen.getByText(mockRows[0].step)).toBeInTheDocument();
    });

    mockRows.forEach((row) => {
      expect(screen.getByText(row.step)).toBeInTheDocument();
      expect(screen.getByText(row.formula)).toBeInTheDocument();
      expect(screen.getByText(row.result)).toBeInTheDocument();
      expect(screen.getByText(row.source)).toBeInTheDocument();
    });
  });

  it('renders correctly with empty rows array', async () => {
    const user = userEvent.setup();
    render(<CalculationBreakdown rows={[]} />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
        // Headers should still be there
        expect(screen.getByText('Step')).toBeInTheDocument();
    });

    // But no rows
    expect(screen.queryByText('Gross Income')).not.toBeInTheDocument();
  });
});