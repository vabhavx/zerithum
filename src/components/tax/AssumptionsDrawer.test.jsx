// @vitest-environment jsdom
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, afterEach, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { AssumptionsDrawer } from "./AssumptionsDrawer";

vi.mock("lucide-react", () => ({
  X: () => <div data-testid="mock-x-icon">X</div>,
}));

afterEach(() => {
  cleanup();
});

describe("AssumptionsDrawer", () => {
  const mockAssumptions = {
    stateLabel: "California",
    stateRate: 0.093,
  };

  it("renders correctly when open is true", () => {
    render(
      <AssumptionsDrawer
        open={true}
        onOpenChange={vi.fn()}
        assumptions={mockAssumptions}
      />
    );

    expect(screen.getByText("Tax Estimator Assumptions")).toBeInTheDocument();
    expect(screen.getByText(/This model is conservative and transparent/i)).toBeInTheDocument();

    expect(screen.getByText("Federal tax method")).toBeInTheDocument();
    expect(screen.getByText("Self-employment tax")).toBeInTheDocument();
    expect(screen.getByText("State estimate")).toBeInTheDocument();

    expect(screen.getByText(/Self-employment tax is estimated at 15\.30%/)).toBeInTheDocument();
    expect(screen.getByText(/For California, the rate applied is 9\.30%/)).toBeInTheDocument();
  });

  it("does not render content when open is false", () => {
    render(
      <AssumptionsDrawer
        open={false}
        onOpenChange={vi.fn()}
        assumptions={mockAssumptions}
      />
    );

    expect(screen.queryByText("Tax Estimator Assumptions")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when closing the drawer", async () => {
    const onOpenChangeMock = vi.fn();
    render(
      <AssumptionsDrawer
        open={true}
        onOpenChange={onOpenChangeMock}
        assumptions={mockAssumptions}
      />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    });
  });
});
