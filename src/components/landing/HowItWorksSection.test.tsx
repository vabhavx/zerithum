// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import HowItWorksSection from './HowItWorksSection';

expect.extend(matchers);

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
            p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        },
        useReducedMotion: () => false,
        useInView: () => true, // Mock visible
    };
});

describe('HowItWorksSection', () => {
    beforeEach(() => {
        // Reset mocks/timers if any
        vi.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('renders the section headline', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText('Revenue, reality checked.')).toBeInTheDocument();
        expect(screen.getByText(/Stop guessing. We verify every single payout/)).toBeInTheDocument();
    });

    it('renders the interactive widget controls', () => {
        render(<HowItWorksSection />);
        // "Reset" button
        expect(screen.getByText('Reset')).toBeInTheDocument();
        // "Auto-Cycle" indicator
        expect(screen.getByText('Auto-Cycle')).toBeInTheDocument();
    });

    it('renders the data content', () => {
        render(<HowItWorksSection />);
        // Total balance
        expect(screen.getByText('$17,043.34')).toBeInTheDocument();
        // Platforms (only first 3 are rendered in the dashboard view)
        expect(screen.getByText('YouTube')).toBeInTheDocument();
        expect(screen.getByText('Patreon')).toBeInTheDocument();
        expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    it('toggles manual control on hover', () => {
        render(<HowItWorksSection />);
        const widget = screen.getByRole('region', { name: /Revenue Unification Simulation/ });

        // Initial state
        expect(screen.getByText('Auto-Cycle')).toBeInTheDocument();

        // Hover
        fireEvent.mouseEnter(widget);
        expect(screen.getByText('Manual Control')).toBeInTheDocument();

        // Unhover
        fireEvent.mouseLeave(widget);
        expect(screen.getByText('Auto-Cycle')).toBeInTheDocument();
    });
});
