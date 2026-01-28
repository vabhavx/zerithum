import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PendingReconciliationRow from './PendingReconciliationRow';
import { vi } from 'vitest';

describe('PendingReconciliationRow', () => {
  const mockTransaction = {
    id: '123',
    description: 'Test Transaction',
    platform: 'Stripe',
    category: 'Sales',
    amount: 100.00,
    transaction_date: '2023-10-27'
  };

  const mockOnMatch = vi.fn();

  it('renders transaction details correctly', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} onMatch={mockOnMatch} />);

    expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    expect(screen.getByText(/Stripe/)).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText(/Oct 27, 2023/)).toBeInTheDocument();
  });

  it('renders with accessible match button', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} onMatch={mockOnMatch} />);

    // Check for aria-label
    const button = screen.getByRole('button', { name: /Match transaction from Stripe for 100.00/i });
    expect(button).toBeInTheDocument();

    // Check for tooltip title
    expect(button).toHaveAttribute('title', 'Match this transaction');
  });

  it('calls onMatch when match button is clicked', () => {
    render(<PendingReconciliationRow transaction={mockTransaction} onMatch={mockOnMatch} />);

    const button = screen.getByRole('button', { name: /Match transaction from Stripe for 100.00/i });
    fireEvent.click(button);

    expect(mockOnMatch).toHaveBeenCalledWith(mockTransaction);
  });
});
