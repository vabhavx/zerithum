import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PendingReconciliationRow from './PendingReconciliationRow';

describe('PendingReconciliationRow', () => {
  const mockTransaction = {
    id: '123',
    description: 'Test Transaction',
    platform: 'Stripe',
    category: 'Subscription',
    amount: 150.00,
    transaction_date: '2023-11-01T10:00:00Z',
  };

  it('renders transaction details correctly', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} />);

    expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText(/Nov 1, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Stripe/)).toBeInTheDocument();
  });

  it('renders description fallback correctly', () => {
      const transactionWithoutDesc = {
          ...mockTransaction,
          description: null
      };
      render(<PendingReconciliationRow transaction={transactionWithoutDesc} />);
      expect(screen.getByText('Stripe - Subscription')).toBeInTheDocument();
  });
});
