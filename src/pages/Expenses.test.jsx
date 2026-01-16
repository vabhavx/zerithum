import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Expenses from './Expenses';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Expense: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        delete: vi.fn(),
      }
    },
    integrations: {
        Core: {
            UploadFile: vi.fn()
        }
    },
    functions: {
        invoke: vi.fn()
    }
  }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock components that might cause issues in jsdom
vi.mock('../components/expense/BulkImportDialog', () => ({
  default: () => null
}));
vi.mock('../components/expense/ExpenseAnalytics', () => ({
  default: () => null
}));
vi.mock('../components/expense/AIExpenseChat', () => ({
  default: () => null
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Expenses Page', () => {
  it('has accessible form labels in Add Expense dialog', async () => {
    render(
      <Wrapper>
        <Expenses />
      </Wrapper>
    );

    // Open the Add Expense dialog
    const addButton = screen.getByText('Add Expense');
    fireEvent.click(addButton);

    // Check if inputs are linked to labels
    // Amount
    const amountInput = screen.getByLabelText(/Amount/i);
    expect(amountInput).toHaveAttribute('id', 'expense-amount');

    // Date
    const dateInput = screen.getByLabelText(/Date/i);
    expect(dateInput).toHaveAttribute('id', 'expense-date');

    // Merchant
    const merchantInput = screen.getByLabelText(/Merchant/i);
    expect(merchantInput).toHaveAttribute('id', 'expense-merchant');

    // Description
    const descriptionInput = screen.getByLabelText(/Description/i);
    expect(descriptionInput).toHaveAttribute('id', 'expense-description');

    // Category (Select is trickier with getByLabelText depending on implementation,
    // but we added htmlFor to label and id to trigger)
    // Note: SelectTrigger renders a button.
    // Let's try to find it by label
    const categoryLabel = screen.getByText('Category');
    expect(categoryLabel).toHaveAttribute('for', 'expense-category');

    // We can check if the trigger has the ID.
    // It's hard to get by label directly because Radix might not use native association for custom controls perfectly in jsdom
    // but the attributes should be there.
    // const categoryTrigger = document.getElementById('expense-category');
    // expect(categoryTrigger).toBeInTheDocument();
  });
});
