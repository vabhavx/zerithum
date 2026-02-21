import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Pricing from "./Pricing";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Jest matchers
expect.extend(matchers);

// Mock Dependencies
vi.mock("@/api/supabaseClient", () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue(null),
      redirectToLogin: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Recharts
vi.mock("recharts", () => {
  const OriginalModule = vi.importActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
  };
});

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Check: () => <div data-testid="icon-check" />,
  ChevronDown: () => <div data-testid="icon-chevron" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Calculator: () => <div data-testid="icon-calculator" />,
  TrendingUp: () => <div data-testid="icon-trending" />,
  Clock: () => <div data-testid="icon-clock" />,
  DollarSign: () => <div data-testid="icon-dollar" />,
}));

describe("Pricing Page - ROI Calculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pricing page and allows switching to ROI calculator mode", async () => {
    render(<Pricing />);

    // Verify initial render (Plans view)
    expect(screen.getByText("Monthly creator revenue estimate")).toBeInTheDocument();

    // Switch to ROI Calculator
    const calculatorBtn = screen.getByText("ROI calculator");
    fireEvent.click(calculatorBtn);

    // Verify calculator elements are present
    expect(screen.getByText("Annual Value Unlocked")).toBeInTheDocument();
    expect(screen.getByText("Time Investment")).toBeInTheDocument();
    expect(screen.getByText("Hard Costs")).toBeInTheDocument();
  });

  it("updates ROI metrics when inputs change", async () => {
    render(<Pricing />);

    // Switch to calculator
    fireEvent.click(screen.getByText("ROI calculator"));

    // Find inputs
    const inputs = screen.getAllByRole("slider");
    // 0: Revenue
    // 1: Admin Hours
    // 2: Hourly Rate
    // 3: Accountant Cost

    const adminHoursInput = inputs[1];
    const hourlyRateInput = inputs[2];

    // Change Admin Hours to 10
    fireEvent.change(adminHoursInput, { target: { value: "10" } });

    // Change Hourly Rate to 100
    fireEvent.change(hourlyRateInput, { target: { value: "100" } });

    // Verify the output
    // We expect "Annual Value Unlocked" to be ~$45,378

    await waitFor(() => {
      const label = screen.getByText("Annual Value Unlocked");
      const valueElement = label.nextElementSibling; // The <p> tag with the value

      // We check if the text contains the expected value format
      expect(valueElement).toHaveTextContent("45,378");
    });
  });

  it("updates intelligent defaults when revenue changes", async () => {
    render(<Pricing />);

    // Revenue slider is the first one
    const revenueInput = screen.getAllByRole("slider")[0];

    // Change Revenue to 50,000 (High tier)
    fireEvent.change(revenueInput, { target: { value: "50000" } });

    // Switch to calculator to see effects
    fireEvent.click(screen.getByText("ROI calculator"));

    // Check if inputs updated automatically
    const inputs = screen.getAllByRole("slider");
    const adminHoursInput = inputs[1];
    const accountantCostInput = inputs[3];

    // For 50k revenue:
    // Admin hours should be 12 ( > 20k)
    // Accountant cost should be 500 ( > 20k)

    await waitFor(() => {
        expect(adminHoursInput.value).toBe("12");
        expect(accountantCostInput.value).toBe("500");
    });
  });
});
