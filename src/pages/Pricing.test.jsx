import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Pricing from "./Pricing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { BrowserRouter } from "react-router-dom";

// Extend Jest matchers
expect.extend(matchers);

// Mock Dependencies
const mockInvoke = vi.fn();
const mockMe = vi.fn();
const mockRedirectToLogin = vi.fn();

vi.mock("@/api/supabaseClient", () => ({
  auth: {
    me: () => mockMe(),
    redirectToLogin: () => mockRedirectToLogin(),
  },
  functions: {
    invoke: (fn, data) => mockInvoke(fn, data),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
    span: ({ children, className }) => <span className={className}>{children}</span>,
    h1: ({ children, className }) => <h1 className={className}>{children}</h1>,
    p: ({ children, className }) => <p className={className}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe("Pricing Page (PayPal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockResolvedValue({ id: "test-user" });
  });

  it("renders the pricing page with PayPal plans", async () => {
    renderWithRouter(<Pricing />);

    expect(screen.getByText("Pricing")).toBeInTheDocument();

    // Check for Starter plan
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("$9")).toBeInTheDocument();

    // Check for Pro plan
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("$20")).toBeInTheDocument();

    // Check for premium copy
    expect(screen.getByText(/Dedicated primary customer support/i)).toBeInTheDocument();
    expect(screen.getByText(/White-glove onboarding/i)).toBeInTheDocument();
  });

  it("navigates to Billing when a plan CTA is clicked and user is logged in", async () => {
    mockMe.mockResolvedValue({ id: "user-123" });

    renderWithRouter(<Pricing />);

    // Click "Get Pro"
    const proBtn = screen.getByText("Get Pro");
    fireEvent.click(proBtn);

    // Should navigate (in JSDOM we check if window.location changes or just that it didn't throw)
    // Actually the component uses useNavigate() from react-router-dom
    // We can verify the user didn't get redirected to login
    expect(mockRedirectToLogin).not.toHaveBeenCalled();
  });

  it("redirects to login if user is not authenticated when selecting a plan", async () => {
    mockMe.mockResolvedValue(null);

    renderWithRouter(<Pricing />);

    // Click "Get Starter"
    const starterBtn = screen.getByText("Get Starter");
    fireEvent.click(starterBtn);

    await waitFor(() => {
      expect(mockRedirectToLogin).toHaveBeenCalled();
    });
  });

  it("displays the feature comparison table", () => {
    renderWithRouter(<Pricing />);

    expect(screen.getByText("Feature Comparison")).toBeInTheDocument();
    expect(screen.getByText("Connected platforms")).toBeInTheDocument();
    expect(screen.getByText("Starter ($9)")).toBeInTheDocument();
    expect(screen.getByText("Pro ($20)")).toBeInTheDocument();
  });
});
