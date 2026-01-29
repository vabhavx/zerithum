import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TransactionAnalysis from './TransactionAnalysis';
import '@testing-library/jest-dom';
import { useQuery } from '@tanstack/react-query';

// Mock Tanstack Query
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  };
});

// Mock Base44
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      RevenueTransaction: {
        list: vi.fn(),
      },
    },
  },
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  },
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('TransactionAnalysis', () => {
  const mockTransactions = [
    {
      id: '1',
      transaction_date: '2023-01-01',
      platform: 'youtube',
      category: 'ad_revenue',
      description: 'YouTube Ad Revenue',
      amount: 100.0,
      platform_fee: 10.0,
      platform_transaction_id: 'yt-1',
    },
    {
      id: '2',
      transaction_date: '2023-01-02',
      platform: 'patreon',
      category: 'membership',
      description: 'Patreon Pledge',
      amount: 50.0,
      platform_fee: 5.0,
      platform_transaction_id: 'pt-1',
    },
    {
      id: '3',
      transaction_date: '2023-01-03',
      platform: 'stripe',
      category: 'product_sale',
      description: 'Stripe Sale',
      amount: 200.0,
      platform_fee: 20.0,
      platform_transaction_id: 'st-1',
    },
  ];

  beforeEach(() => {
    useQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });
  });

  it('renders transactions correctly', () => {
    render(<TransactionAnalysis />);
    expect(screen.getByText('YouTube Ad Revenue')).toBeInTheDocument();
    expect(screen.getByText('Patreon Pledge')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('filters transactions by search query', async () => {
    render(<TransactionAnalysis />);
    const searchInput = screen.getByPlaceholderText('Search transactions...');

    // Type in search box
    fireEvent.change(searchInput, { target: { value: 'YouTube' } });

    // Wait for potential debounce (if implemented) or immediate update
    await waitFor(() => {
      expect(screen.getByText('YouTube Ad Revenue')).toBeInTheDocument();
      expect(screen.queryByText('Patreon Pledge')).not.toBeInTheDocument();
    });
  });

  it('calculates totals correctly', () => {
    render(<TransactionAnalysis />);
    // Total Revenue: 100 + 50 + 200 = 350
    expect(screen.getByText('$350')).toBeInTheDocument();
    // Total Fees: 10 + 5 + 20 = 35
    expect(screen.getByText('$35')).toBeInTheDocument();
  });
});
