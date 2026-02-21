// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as matchers from '@testing-library/jest-dom/matchers';
import ExpenseRow from "./ExpenseRow";

expect.extend(matchers);

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    Trash2: () => <div data-testid="icon-trash">Trash2</div>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => {
    const motion = new Proxy({}, {
        get: (target, prop) => {
            return ({ children, ...props }) => {
                // Filter out animation props
                // eslint-disable-next-line no-unused-vars
                const { initial, animate, exit, variants, transition, whileHover, whileTap, ...domProps } = props;
                const Component = prop;
                return <Component {...domProps}>{children}</Component>;
            };
        }
    });
    return { motion, AnimatePresence: ({ children }) => <>{children}</> };
});

describe("ExpenseRow", () => {
    const mockOnDelete = vi.fn();
    const defaultExpense = {
        id: "exp-123",
        merchant: "Amazon",
        amount: 59.99,
        category: "office_supplies",
        expense_date: "2024-03-15T10:00:00Z",
        is_tax_deductible: true,
        deduction_percentage: 100,
    };

    it("renders expense details correctly", () => {
        render(<ExpenseRow expense={defaultExpense} onDelete={mockOnDelete} />);

        // Check merchant
        expect(screen.getByText("Amazon")).toBeInTheDocument();

        // Check amount (formatted)
        expect(screen.getByText("$59.99")).toBeInTheDocument();

        // Check date (formatted) - exact format depends on date-fns/locale but should contain parts
        // "MMM d, yyyy" -> "Mar 15, 2024"
        expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument();

        // Check category label (office_supplies -> "Office Supplies")
        expect(screen.getByText(/Office Supplies/)).toBeInTheDocument();

        // Check tax deductible badge
        expect(screen.getByText("100% deductible")).toBeInTheDocument();
    });

    it("renders description if merchant is missing", () => {
        const expenseWithoutMerchant = {
            ...defaultExpense,
            merchant: null,
            description: "Printer Paper",
        };
        render(<ExpenseRow expense={expenseWithoutMerchant} onDelete={mockOnDelete} />);

        expect(screen.getByText("Printer Paper")).toBeInTheDocument();
    });

    it("hides tax deductible badge when not deductible", () => {
        const expenseNotDeductible = {
            ...defaultExpense,
            is_tax_deductible: false,
        };
        render(<ExpenseRow expense={expenseNotDeductible} onDelete={mockOnDelete} />);

        expect(screen.queryByText(/% deductible/)).not.toBeInTheDocument();
    });

    it("calls onDelete with expense id when delete button is clicked", () => {
        render(<ExpenseRow expense={defaultExpense} onDelete={mockOnDelete} />);

        const deleteButton = screen.getByRole("button", { name: /Delete expense/i });
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith("exp-123");
    });

    it("handles unknown category gracefully (falls back to Other)", () => {
        const expenseUnknownCategory = {
            ...defaultExpense,
            category: "unknown_category_123",
        };
        render(<ExpenseRow expense={expenseUnknownCategory} onDelete={mockOnDelete} />);

        expect(screen.getByText(/Other/)).toBeInTheDocument();
    });
});
