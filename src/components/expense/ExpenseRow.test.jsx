import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpenseRow from './ExpenseRow';
import { CATEGORIES } from '@/lib/expenseCategories';
import { vi } from 'vitest';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
  }
}));

describe('ExpenseRow', () => {
  const mockExpense = {
    id: '123',
    merchant: 'Test Merchant',
    description: 'Test Description',
    amount: 100.50,
    expense_date: '2023-10-27',
    category: 'software_subscriptions',
    is_tax_deductible: true,
    deduction_percentage: 50
  };

  const mockOnDelete = vi.fn();

  it('renders expense details correctly', () => {
    render(<ExpenseRow expense={mockExpense} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Merchant')).toBeInTheDocument();
    expect(screen.getByText('$100.50')).toBeInTheDocument();
    expect(screen.getByText(/Oct 27, 2023/)).toBeInTheDocument();
    expect(screen.getByText('50% deductible')).toBeInTheDocument();
  });

  it('renders category info correctly', () => {
    render(<ExpenseRow expense={mockExpense} onDelete={mockOnDelete} />);

    const category = CATEGORIES.software_subscriptions;
    expect(screen.getByText(category.icon)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(category.label))).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<ExpenseRow expense={mockExpense} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /Delete expense/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });

  it('renders default category if category is invalid', () => {
    const invalidExpense = { ...mockExpense, category: 'invalid_category' };
    render(<ExpenseRow expense={invalidExpense} onDelete={mockOnDelete} />);

    const defaultCategory = CATEGORIES.other;
    expect(screen.getByText(defaultCategory.icon)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(defaultCategory.label))).toBeInTheDocument();
  });
});
