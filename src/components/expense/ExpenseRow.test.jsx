import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpenseRow from './ExpenseRow';
import { vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }) => (
      <div className={className} onClick={onClick} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

describe('ExpenseRow', () => {
  const mockExpense = {
    id: '123',
    merchant: 'Test Merchant',
    description: 'Test Description',
    amount: 50.00,
    expense_date: '2023-01-01',
    is_tax_deductible: true,
    deduction_percentage: 50,
  };

  const mockCategory = {
    label: 'Test Category',
    icon: '🧪',
    color: 'bg-test-color',
  };

  const mockOnDelete = vi.fn();

  it('renders expense information correctly', () => {
    render(
      <ExpenseRow
        expense={mockExpense}
        category={mockCategory}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Merchant')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText(/Test Category/)).toBeInTheDocument();
    expect(screen.getByText('50% deductible')).toBeInTheDocument();
  });

  it('calls onDelete with expense id when delete button is clicked', () => {
    render(
      <ExpenseRow
        expense={mockExpense}
        category={mockCategory}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });
});
