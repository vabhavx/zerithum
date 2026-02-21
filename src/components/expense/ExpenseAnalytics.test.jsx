// @vitest-environment jsdom
import React from 'react';
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as matchers from '@testing-library/jest-dom/matchers';
import ExpenseAnalytics from "./ExpenseAnalytics";

expect.extend(matchers);

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    TrendingUp: () => <div data-testid="icon-trending-up">TrendingUp</div>,
    DollarSign: () => <div data-testid="icon-dollar-sign">DollarSign</div>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
}));

// Mock recharts
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data, label }) => (
        <div data-testid="pie">
            {data.map((entry, index) => (
                <div key={index} data-testid="pie-slice">
                    {entry.name}: {entry.value}
                </div>
            ))}
        </div>
    ),
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
    BarChart: ({ data, children }) => (
        <div data-testid="bar-chart">
            {data.map((entry, index) => (
                <div key={index} data-testid="bar-item">
                    {entry.name}: {entry.value}
                </div>
            ))}
            {children}
        </div>
    ),
    Bar: () => <div data-testid="bar" />,
}));

describe("ExpenseAnalytics", () => {
    const mockExpenses = [
        {
            id: "1",
            amount: 100,
            category: "Food",
            expense_date: "2024-01-15",
            is_tax_deductible: true,
            deduction_percentage: 50,
        },
        {
            id: "2",
            amount: 200,
            category: "Software",
            expense_date: "2024-01-20",
            is_tax_deductible: false,
            deduction_percentage: 0,
        },
        {
            id: "3",
            amount: 300,
            category: "Food",
            expense_date: "2024-02-10",
            is_tax_deductible: true,
            deduction_percentage: 100,
        },
    ];

    it("renders empty state correctly", () => {
        render(<ExpenseAnalytics expenses={[]} />);

        expect(screen.getByText("Avg Expense")).toBeInTheDocument();
        expect(screen.getByText("$0")).toBeInTheDocument();
        expect(screen.getByText("Highest")).toBeInTheDocument();
        expect(screen.getAllByText("No data yet")).toHaveLength(2);
    });

    it("calculates and displays summary metrics correctly", () => {
        render(<ExpenseAnalytics expenses={mockExpenses} />);

        // Avg: (100 + 200 + 300) / 3 = 200
        expect(screen.getByText("$200")).toBeInTheDocument();
        // Highest: 300
        expect(screen.getByText("$300")).toBeInTheDocument();
    });

    it("groups and sorts category data correctly", () => {
        render(<ExpenseAnalytics expenses={mockExpenses} />);

        // Food: 100 + 300 = 400
        // Software: 200
        // Sorted descending: Food (400), Software (200)
        const pieSlices = screen.getAllByTestId("pie-slice");
        expect(pieSlices[0]).toHaveTextContent("Food: 400");
        expect(pieSlices[1]).toHaveTextContent("Software: 200");
    });

    it("groups monthly data correctly", () => {
        render(<ExpenseAnalytics expenses={mockExpenses} />);

        // Jan: 100 + 200 = 300
        // Feb: 300
        const barItems = screen.getAllByTestId("bar-item");

        // The order might depend on toLocaleDateString implementation in the test environment
        // but typically it should have Jan and Feb
        const barTexts = barItems.map(item => item.textContent);
        expect(barTexts).toContain("Jan: 300");
        expect(barTexts).toContain("Feb: 300");
    });

    it("handles tax deductible logic correctly (internally)", () => {
        // totalDeductible is calculated but not rendered in the current component.
        // We verify the component renders without crashing with various deduction values.
        const mixedExpenses = [
            { amount: 100, category: "X", expense_date: "2024-01-01", is_tax_deductible: true, deduction_percentage: 50 },
            { amount: 100, category: "Y", expense_date: "2024-01-01", is_tax_deductible: true, deduction_percentage: 100 },
            { amount: 100, category: "Z", expense_date: "2024-01-01", is_tax_deductible: false, deduction_percentage: 0 },
        ];

        const { rerender } = render(<ExpenseAnalytics expenses={mixedExpenses} />);
        expect(screen.getByText("$100")).toBeInTheDocument(); // Avg
        expect(screen.getByText("$100")).toBeInTheDocument(); // Highest

        // Check if it handles 0 percentage or missing fields gracefully (though they should be present)
        rerender(<ExpenseAnalytics expenses={[{ amount: 100, category: "X", expense_date: "2024-01-01", is_tax_deductible: true, deduction_percentage: 0 }]} />);
        expect(screen.getByText("$100")).toBeInTheDocument();
    });
});
