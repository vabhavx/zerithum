import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PendingReconciliationRow from './PendingReconciliationRow';
import { vi, describe, it, expect } from 'vitest';

describe('PendingReconciliationRow', () => {
  const mockTransaction = {
    id: 'txn_1',
    description: 'Test Transaction',
    platform: 'Stripe',
    category: 'Sale',
    transaction_date: '2024-01-15T10:00:00Z',
    amount: 123.45
  };

  it('renders transaction details correctly', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} />);

    expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    // Use flexible regex for date as format might depend on timezone or locale
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });

  it('renders match button with accessible aria-label', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} />);

    const button = screen.getByRole('button', { name: /Match transaction Test Transaction of amount \$123.45/ });
    expect(button).toBeInTheDocument();
  });

  it('renders default description if missing', () => {
    const txnWithoutDesc = { ...mockTransaction, description: null };
    render(<PendingReconciliationRow transaction={txnWithoutDesc} />);

    expect(screen.getByText('Stripe - Sale')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Match transaction Stripe - Sale of amount \$123.45/ });
    expect(button).toBeInTheDocument();
  });
});
