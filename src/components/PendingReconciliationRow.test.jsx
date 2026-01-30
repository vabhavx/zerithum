import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import PendingReconciliationRow from './PendingReconciliationRow';

describe('PendingReconciliationRow', () => {
  const mockTransaction = {
    id: 'tx_1',
    description: 'Patreon Payout',
    amount: 50.25,
    transaction_date: '2024-02-15T10:00:00Z',
    platform: 'Patreon',
    category: 'Subscription'
  };

  it('renders transaction details correctly', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} />);

    expect(screen.getByText('Patreon Payout')).toBeInTheDocument();
    expect(screen.getByText('$50.25')).toBeInTheDocument();
    expect(screen.getByText(/Feb 15, 2024/)).toBeInTheDocument();
    // Use getAllByText because 'Patreon' appears in description and platform label
    expect(screen.getAllByText(/Patreon/).length).toBeGreaterThan(0);
  });

  it('renders fallback description if missing', () => {
    const fallbackTx = { ...mockTransaction, description: null };
    render(<PendingReconciliationRow transaction={fallbackTx} />);

    expect(screen.getByText('Patreon - Subscription')).toBeInTheDocument();
  });

  it('calls onMatch when button is clicked', () => {
    const handleMatch = vi.fn();
    render(<PendingReconciliationRow transaction={mockTransaction} onMatch={handleMatch} />);

    const button = screen.getByRole('button', { name: /Match transaction/ });
    fireEvent.click(button);

    expect(handleMatch).toHaveBeenCalledTimes(1);
    expect(handleMatch).toHaveBeenCalledWith(mockTransaction);
  });

  it('has accessible aria-label on button', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Match transaction of $50.25 from Patreon');
  });
});
