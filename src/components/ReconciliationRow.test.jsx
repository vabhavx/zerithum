import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import ReconciliationRow from './ReconciliationRow';

describe('ReconciliationRow', () => {
  const mockRec = {
    id: 'rec_1',
    match_category: 'exact_match',
    reconciled_by: 'auto',
    match_confidence: 1.0,
    revenue_transaction_id: 'rev_1',
    bank_transaction_id: 'bank_1'
  };

  const mockRevenue = {
    id: 'rev_1',
    description: 'YouTube Ad Revenue',
    amount: 100.00,
    transaction_date: '2024-01-01T10:00:00Z',
    platform: 'YouTube'
  };

  const mockBank = {
    id: 'bank_1',
    description: 'Deposit from Google',
    amount: 100.00,
    transaction_date: '2024-01-02T10:00:00Z'
  };

  it('renders correctly with full data', () => {
    render(
      <ReconciliationRow
        rec={mockRec}
        revenueTransaction={mockRevenue}
        bankTransaction={mockBank}
      />
    );

    expect(screen.getByText('YouTube Ad Revenue')).toBeInTheDocument();
    expect(screen.getByText('Deposit from Google')).toBeInTheDocument();
    expect(screen.getAllByText('$100.00')).toHaveLength(2);
    expect(screen.getByText('Exact Match')).toBeInTheDocument();
    expect(screen.getByText('Auto-matched')).toBeInTheDocument();
    expect(screen.getByText('100% confidence')).toBeInTheDocument();
  });

  it('renders unknown placeholders when transactions are missing', () => {
    render(
      <ReconciliationRow
        rec={mockRec}
        revenueTransaction={null}
        bankTransaction={null}
      />
    );

    expect(screen.getByText(/Unknown Transaction \(rev_1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Unknown Transaction \(bank_1\)/)).toBeInTheDocument();
  });

  it('renders different match categories correctly', () => {
    const feeRec = { ...mockRec, match_category: 'fee_deduction', match_confidence: 0.9 };
    render(
      <ReconciliationRow
        rec={feeRec}
        revenueTransaction={mockRevenue}
        bankTransaction={mockBank}
      />
    );

    expect(screen.getByText('Fee Deduction')).toBeInTheDocument();
    expect(screen.getByText('90% confidence')).toBeInTheDocument();
  });
});
