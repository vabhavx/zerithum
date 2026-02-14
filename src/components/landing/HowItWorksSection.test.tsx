// @vitest-environment jsdom
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import HowItWorksSection from './HowItWorksSection';

expect.extend(matchers);

// Mock framer-motion
vi.mock('framer-motion', async () => {
    return {
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        },
        useReducedMotion: () => false,
    };
});

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    takeRecords: vi.fn(),
    unobserve: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

describe('HowItWorksSection', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('renders the section header', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/Revenue fusion/i)).toBeInTheDocument();
        expect(screen.getByText(/We collide platform data with bank truths/i)).toBeInTheDocument();
    });

    it('renders the fusion reactor inputs', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/Input: Platforms/i)).toBeInTheDocument();
        expect(screen.getByText(/Input: Bank/i)).toBeInTheDocument();
    });

    it('starts with initial revenue total', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
        // Assuming default value $142,050.00
        expect(screen.getByText(/\$142,050/)).toBeInTheDocument();
    });

    it('spawns particles over time', async () => {
        render(<HowItWorksSection />);

        // Initial state: No DEPOSIT text (particles array empty)
        expect(screen.queryByText(/DEPOSIT/i)).not.toBeInTheDocument();

        // Advance timers to trigger interval (1200ms)
        await act(async () => {
            vi.advanceTimersByTime(1500);
        });

        // Now particles should exist
        // We check for "DEPOSIT" which is rendered for every bank particle
        const deposits = screen.getAllByText(/DEPOSIT/i);
        expect(deposits.length).toBeGreaterThan(0);
    });

    it('shows inspection overlay on hover', async () => {
        render(<HowItWorksSection />);

        const coreText = screen.getByText(/Total Revenue/i);

        await act(async () => {
            fireEvent.mouseEnter(coreText);
        });

        // Expect overlay text
        expect(screen.getByText(/Deep Inspection Mode/i)).toBeInTheDocument();
        expect(screen.getByText(/ID:/i)).toBeInTheDocument();
    });
});
