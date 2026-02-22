// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import Reconciliation from './Reconciliation';

expect.extend(matchers);
import { base44 } from '@/api/supabaseClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the base44 client
vi.mock('@/api/supabaseClient', () => ({
  base44: {
    entities: {
      RevenueTransaction: {
        list: vi.fn(),
        count: vi.fn(),
        paginate: vi.fn(),
        fetchAllIds: vi.fn(),
        filter: vi.fn(),
      },
      BankTransaction: {
        list: vi.fn(),
        filter: vi.fn(),
      },
      Reconciliation: {
        list: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
        paginate: vi.fn(),
        fetchAllIds: vi.fn(),
      },
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Reconciliation Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats and lists correctly', async () => {
    // Mock data
    const mockRevenue = [
      { id: 'r1', amount: 100, transaction_date: '2023-01-01', platform: 'Platform A' },
      { id: 'r2', amount: 200, transaction_date: '2023-01-02', platform: 'Platform B' },
    ];
    const mockBank = [
      { id: 'b1', amount: 100, transaction_date: '2023-01-01' },
    ];
    const mockReconciliations = [
      { id: 'rec1', revenue_transaction_id: 'r1', bank_transaction_id: 'b1', match_category: 'exact_match', reconciled_by: 'auto', reconciled_at: '2023-01-02' },
    ];

    // Mocks for useReconciliationStats
    base44.entities.RevenueTransaction.count.mockResolvedValue(2); // Total
    base44.entities.Reconciliation.count.mockImplementation(async (filters) => {
        if (filters?.match_category?.$neq === 'unmatched') return 1; // Matched
        if (filters?.reconciled_by === 'auto') return 1; // AutoMatched
        return 0;
    });

    // Mocks for useUnreconciledTransactions
    base44.entities.Reconciliation.fetchAllIds.mockResolvedValue(['r1']); // Reconciled Revenue ID
    base44.entities.RevenueTransaction.fetchAllIds.mockResolvedValue(['r2', 'r1']); // All Revenue IDs (r2 is unreconciled)

    // Smart mock for filter to handle both hooks
    base44.entities.RevenueTransaction.filter.mockImplementation(async (filters) => {
        const ids = filters?.id?.$in || [];
        if (ids.includes('r2')) return [mockRevenue[1]]; // unreconciled
        if (ids.includes('r1')) return [mockRevenue[0]]; // reconciled
        return [];
    });

    // Mocks for useReconciliations
    base44.entities.Reconciliation.paginate.mockResolvedValue({ data: mockReconciliations, count: 1 });
    // base44.entities.RevenueTransaction.filter is already mocked above
    base44.entities.BankTransaction.filter.mockResolvedValue([mockBank[0]]); // Details for b1

    render(<Reconciliation />, { wrapper: createWrapper() });

    // Check stats
    // Total: 2, Matched: 1, Unmatched: 1
    await waitFor(() => {
        screen.getByText('2'); // Total
        screen.getAllByText('1'); // Matched, Unmatched (might appear multiple times)
        screen.getByText('50.0%'); // Match Rate

        // Check Unreconciled list
        // Should show r2 (Platform B)
        screen.getAllByText(/Platform B/);
    });

    // Check Reconciliation History
    // Should show 1 item (ReconciliationRow is rendered)
    // The component renders "Reconciliation History" title
    screen.getByText('Reconciliation History');
  });
});
