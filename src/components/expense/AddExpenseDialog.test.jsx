// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as matchers from '@testing-library/jest-dom/matchers';
import AddExpenseDialog from "./AddExpenseDialog";
import { toast } from "sonner";
import { base44 } from "@/api/supabaseClient";

expect.extend(matchers);

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock base44
vi.mock("@/api/supabaseClient", () => ({
    base44: {
        entities: {
            Expense: {
                create: vi.fn(),
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

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    Loader2: () => <div data-testid="loader">Loader</div>,
    Plus: () => <div data-testid="plus">Plus</div>,
    Sparkles: () => <div data-testid="sparkles">Sparkles</div>,
    Receipt: () => <div data-testid="receipt">Receipt</div>,
    X: () => <div data-testid="x">X</div>,
    ChevronDown: () => <div data-testid="chevron-down">ChevronDown</div>,
    ChevronUp: () => <div data-testid="chevron-up">ChevronUp</div>,
    Check: () => <div data-testid="check">Check</div>,
}));

// Mock framer-motion to avoid animation issues
vi.mock("framer-motion", () => {
    const motion = new Proxy({}, {
        get: (target, prop) => {
            return ({ children, ...props }) => {
                const { initial, animate, exit, variants, transition, whileHover, whileTap, ...domProps } = props;
                const Component = prop;
                // Avoid attempting to render 'undefined' or creating invalid React elements
                if (typeof Component === 'string') {
                    return <Component {...domProps}>{children}</Component>;
                }
                return <div {...domProps}>{children}</div>;
            };
        }
    });
    return { motion, AnimatePresence: ({ children }) => <>{children}</> };
});

describe("AddExpenseDialog", () => {
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it("displays error toast when expense creation fails", async () => {
        // Arrange
        const error = new Error("Network Error");
        base44.entities.Expense.create.mockRejectedValue(error);

        render(
            <AddExpenseDialog
                open={true}
                onOpenChange={onOpenChange}
                onSuccess={onSuccess}
            />
        );

        // Act - Fill form
        // Amount input (placeholder="0.00")
        const amountInput = screen.getByPlaceholderText("0.00");
        fireEvent.change(amountInput, { target: { value: "100" } });

        // Submit
        const submitButton = screen.getByRole("button", { name: /Add Expense/i });
        fireEvent.click(submitButton);

        // Assert
        await waitFor(() => {
            expect(base44.entities.Expense.create).toHaveBeenCalled();
        });

        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Failed to add expense"));
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Network Error"));

        // Ensure modal didn't close
        expect(onOpenChange).not.toHaveBeenCalledWith(false);
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it("successfully creates an expense", async () => {
         // Arrange
        base44.entities.Expense.create.mockResolvedValue({ id: "123" });

        render(
            <AddExpenseDialog
                open={true}
                onOpenChange={onOpenChange}
                onSuccess={onSuccess}
            />
        );

        // Act - Fill form
        const amountInput = screen.getByPlaceholderText("0.00");
        fireEvent.change(amountInput, { target: { value: "50.50" } });

        // We can fill other fields if needed, but defaults should work for success path too
        // Default date is today, category is software_subscriptions, etc.

        // Submit
        const submitButton = screen.getByRole("button", { name: /Add Expense/i });
        fireEvent.click(submitButton);

        // Assert
        await waitFor(() => {
            expect(base44.entities.Expense.create).toHaveBeenCalled();
        });

        // Verify payload
        const callArgs = base44.entities.Expense.create.mock.calls[0][0];
        expect(callArgs).toMatchObject({
            amount: 50.5, // coerce number
            category: "software_subscriptions",
            payment_method: "credit_card",
            is_tax_deductible: true,
            deduction_percentage: 100
        });

        expect(toast.success).toHaveBeenCalledWith("Expense added successfully");
        expect(onSuccess).toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
