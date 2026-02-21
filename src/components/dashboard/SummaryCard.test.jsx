// @vitest-environment jsdom
import React from 'react';
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as matchers from '@testing-library/jest-dom/matchers';
import SummaryCard from "./SummaryCard";

expect.extend(matchers);

// Mock lucide-react icons since we are testing the component logic, not the icons themselves
vi.mock("lucide-react", () => ({
    TrendingUp: () => <div data-testid="icon-trending-up">TrendingUp</div>,
    TrendingDown: () => <div data-testid="icon-trending-down">TrendingDown</div>,
    Minus: () => <div data-testid="icon-minus">Minus</div>,
    DollarSign: (props) => <div data-testid="icon-dollar" className={props.className}>DollarSign</div>,
}));

describe("SummaryCard", () => {
    const defaultProps = {
        icon: ({ className }) => <div data-testid="test-icon" className={className} />,
        label: "Total Revenue",
        value: "$12,345.00",
    };

    it("renders basic props correctly", () => {
        render(<SummaryCard {...defaultProps} />);

        expect(screen.getByText("Total Revenue")).toBeInTheDocument();
        expect(screen.getByText("$12,345.00")).toBeInTheDocument();
        expect(screen.getByTestId("test-icon")).toBeInTheDocument();
        // Check default icon color class
        expect(screen.getByTestId("test-icon")).toHaveClass("text-[#32B8C6]");
    });

    it("renders with custom icon color", () => {
        render(<SummaryCard {...defaultProps} iconColor="text-red-500" />);
        expect(screen.getByTestId("test-icon")).toHaveClass("text-red-500");
    });

    describe("Trend indicator", () => {
        it("renders positive trend correctly", () => {
            render(
                <SummaryCard
                    {...defaultProps}
                    trend="up"
                    trendValue="+15%"
                />
            );

            const trendValue = screen.getByText("+15%");
            expect(trendValue).toBeInTheDocument();
            expect(screen.getByTestId("icon-trending-up")).toBeInTheDocument();
            // Check parent container for color class - looking for parent of trend icon
            const trendContainer = trendValue.parentElement;
            expect(trendContainer).toHaveClass("text-emerald-400");
        });

        it("renders negative trend correctly", () => {
            render(
                <SummaryCard
                    {...defaultProps}
                    trend="down"
                    trendValue="-5%"
                />
            );

            const trendValue = screen.getByText("-5%");
            expect(trendValue).toBeInTheDocument();
            expect(screen.getByTestId("icon-trending-down")).toBeInTheDocument();
            const trendContainer = trendValue.parentElement;
            expect(trendContainer).toHaveClass("text-[#FF5459]");
        });

        it("renders neutral trend correctly", () => {
            render(
                <SummaryCard
                    {...defaultProps}
                    trend="neutral"
                    trendValue="0%"
                />
            );

            const trendValue = screen.getByText("0%");
            expect(trendValue).toBeInTheDocument();
            expect(screen.getByTestId("icon-minus")).toBeInTheDocument();
            const trendContainer = trendValue.parentElement;
            expect(trendContainer).toHaveClass("text-[var(--z-text-3)]");
        });

        it("does not render trend section if trend prop is missing", () => {
            render(<SummaryCard {...defaultProps} trendValue="+15%" />);
            expect(screen.queryByText("+15%")).not.toBeInTheDocument();
        });
    });

    describe("Badge rendering", () => {
        it("renders info badge by default when variant is missing", () => {
            render(<SummaryCard {...defaultProps} badge={{ text: "New" }} />);

            const badge = screen.getByText("New");
            expect(badge).toBeInTheDocument();
            // Default (info) styles
            expect(badge).toHaveClass("bg-[#32B8C6]/15");
            expect(badge).toHaveClass("text-[#32B8C6]");
        });

        it("renders danger badge correctly", () => {
            render(<SummaryCard {...defaultProps} badge={{ text: "Risk", variant: "danger" }} />);

            const badge = screen.getByText("Risk");
            expect(badge).toHaveClass("bg-[#FF5459]/15");
            expect(badge).toHaveClass("text-[#FF5459]");
        });

        it("renders success badge correctly", () => {
            render(<SummaryCard {...defaultProps} badge={{ text: "Safe", variant: "success" }} />);

            const badge = screen.getByText("Safe");
            expect(badge).toHaveClass("bg-emerald-500/15");
            expect(badge).toHaveClass("text-emerald-400");
        });
    });

    describe("Optional content", () => {
        it("renders subtitle when provided", () => {
            render(<SummaryCard {...defaultProps} subtitle="vs last month" />);
            expect(screen.getByText("vs last month")).toBeInTheDocument();
        });

        it("renders microcopy when provided", () => {
            render(<SummaryCard {...defaultProps} microcopy="Last updated 2m ago" />);
            expect(screen.getByText("Last updated 2m ago")).toBeInTheDocument();
        });

        it("renders secondary value when provided", () => {
            render(<SummaryCard {...defaultProps} secondaryValue="$500 pending" />);
            expect(screen.getByText("$500 pending")).toBeInTheDocument();
        });
    });

    describe("Styling props", () => {
        it("applies monospace font to value by default", () => {
            render(<SummaryCard {...defaultProps} />);
            const valueElement = screen.getByText("$12,345.00");
            expect(valueElement).toHaveClass("font-mono-financial");
        });

        it("does not apply monospace font when isMonospace is false", () => {
            render(<SummaryCard {...defaultProps} isMonospace={false} />);
            const valueElement = screen.getByText("$12,345.00");
            expect(valueElement).not.toHaveClass("font-mono-financial");
        });
    });
});
