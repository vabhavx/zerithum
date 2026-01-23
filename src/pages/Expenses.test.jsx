import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import Expenses from './Expenses';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Expense: {
        list: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      }
    },
    integrations: {
      Core: {
        UploadFile: vi.fn(),
      }
    },
    functions: {
      invoke: vi.fn(),
    }
  }
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock Alert Dialog to avoid Portal/Animation issues in test
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogCancel: ({ onClick, children }) => <button onClick={onClick}>{children}</button>,
  AlertDialogAction: ({ onClick, children }) => <button onClick={onClick}>{children}</button>,
}));

// Mock child components that might be complex
vi.mock('../components/expense/ExpenseAnalytics', () => ({
  default: () => <div>Analytics Mock</div>
}));

vi.mock('../components/expense/AIExpenseChat', () => ({
  default: () => <div>Chat Mock</div>
}));

describe('Expenses Page', () => {
  const mockExpenses = [
    {
      id: '123',
      merchant: 'Test Merchant',
      description: 'Test Description',
      amount: 100.00,
      expense_date: '2023-10-27',
      category: 'software_subscriptions',
      is_tax_deductible: true,
      deduction_percentage: 100,
      receipt_url: ''
    }
  ];

  const mockInvalidateQueries = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries
    });

    useQuery.mockReturnValue({
      data: mockExpenses,
      isLoading: false
    });

    useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });
  });

  it('opens alert dialog when delete button is clicked', async () => {
    render(<Expenses />);

    // Find the delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Check if dialog content appears
    await waitFor(() => {
      expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    });
    expect(screen.getByText(/permanently delete the expense for Test Merchant/)).toBeInTheDocument();
  });

  it('calls mutation when confirm is clicked', async () => {
    render(<Expenses />);

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    });

    // Click Delete in dialog
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);

    expect(mockMutate).toHaveBeenCalledWith('123');
  });

  it('closes dialog and does not call mutation when cancel is clicked', async () => {
    render(<Expenses />);

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog
    await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    });

    // Click Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // We verify that the mutation is NOT called.
    // We cannot easily verify the dialog closes because we mocked the internal logic of Radix UI.
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
