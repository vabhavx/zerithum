import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom'; // Import custom matchers
import Landing from './Landing';
import { BrowserRouter } from 'react-router-dom';

// Mock child components that might use window/canvas APIs not fully supported in JSDOM
vi.mock('../components/ui/beams-background', () => ({
  BeamsBackground: ({ children }) => <div data-testid="beams-background">{children}</div>
}));

vi.mock('../components/landing/LandingReconciliation', () => ({
  default: () => <div data-testid="landing-reconciliation">Mocked Reconciliation</div>
}));

vi.mock('../components/landing/LandingTelemetry', () => ({
  default: () => <div data-testid="landing-telemetry">Mocked Telemetry</div>
}));

vi.mock('../components/landing/LandingExport', () => ({
  default: () => <div data-testid="landing-export">Mocked Export</div>
}));

// Mock IntersectionObserver
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

class IntersectionObserver {
  observe = observe;
  unobserve = unobserve;
  disconnect = disconnect;
}

window.IntersectionObserver = IntersectionObserver;

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useSpring: () => ({ get: () => 0 }),
}));

describe('Landing Page', () => {
  it('renders the main sections', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Check for main text content
    expect(screen.getByText(/Revenue Control Plane/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete Financial/i)).toBeInTheDocument();
    expect(screen.getByText(/Setup your zerithum/i)).toBeInTheDocument();

    // Check for the mocked child components
    expect(screen.getByTestId('beams-background')).toBeInTheDocument();
    expect(screen.getByTestId('landing-reconciliation')).toBeInTheDocument();
    expect(screen.getByTestId('landing-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('landing-export')).toBeInTheDocument();
  });
});
