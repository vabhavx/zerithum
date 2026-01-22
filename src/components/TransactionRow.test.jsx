import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionRow from './TransactionRow';
import '@testing-library/jest-dom';

describe('TransactionRow', () => {
  const mockTransaction = {
    id: '123',
    transaction_date: '2023-10-27',
    platform: 'youtube',
    amount: 50.00,
    net_amount: 50.00,
    fees_amount: 0,
    category: 'ad_revenue',
    status: 'completed',
    platform_transaction_id: 'yt-123',
    created_date: '2023-10-27',
    description: 'AdSense Payment',
    currency: 'USD'
  };

  const onToggleExpand = vi.fn();

  const renderComponent = (props = {}) => {
    return render(
      <table>
        <tbody>
          <TransactionRow
            transaction={mockTransaction}
            isExpanded={false}
            onToggleExpand={onToggleExpand}
            {...props}
          />
        </tbody>
      </table>
    );
  };

  it('renders correctly with basic info', () => {
    renderComponent();
    expect(screen.getByText('youtube')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('ad revenue')).toBeInTheDocument();
  });

  it('displays the correct aria-label on the details button when collapsed', () => {
    renderComponent({ isExpanded: false });
    const button = screen.getByRole('button', { name: /show details/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Show details for youtube transaction of $50.00');
  });

  it('displays the correct aria-label on the details button when expanded', () => {
    renderComponent({ isExpanded: true });
    const button = screen.getByRole('button', { name: /hide details/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Hide details for youtube transaction of $50.00');
  });

  it('calls onToggleExpand when details button is clicked', () => {
    renderComponent();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggleExpand).toHaveBeenCalledWith('123');
  });
});
