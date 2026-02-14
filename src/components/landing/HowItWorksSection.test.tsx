// @vitest-environment jsdom
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import HowItWorksSection from './HowItWorksSection';

expect.extend(matchers);

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }) => <>{children}</>,
        motion: {
            div: ({ children, style, ...props }) => <div {...props}>{children}</div>,
            span: ({ children, ...props }) => <span {...props}>{children}</span>,
        },
    };
});

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
        expect(screen.getByText(/We connect the disconnect/i)).toBeInTheDocument();
        expect(screen.getByText(/Neural Reconciliation/i)).toBeInTheDocument();
    });

    it('renders platform and bank streams', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/Platform Signal/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Feed/i)).toBeInTheDocument();
    });

    it('renders initial pair data', () => {
        render(<HowItWorksSection />);
        // Use getAllByText because text like "YouTube" might appear in alt tags or duplicates
        const youtube = screen.getAllByText('YouTube');
        expect(youtube[0]).toBeInTheDocument();

        expect(screen.getByText('Chase Deposit')).toBeInTheDocument();
    });

    it('cycles through pairs over time', async () => {
        render(<HowItWorksSection />);

        // Initial: YouTube
        const youtube = screen.getAllByText('YouTube');
        expect(youtube[0]).toBeInTheDocument();

        // Advance 3 seconds (interval is 3000ms)
        await act(async () => {
            vi.advanceTimersByTime(3500);
        });

        // Next: Stripe
        // YouTube should be gone (or at least Stripe should be present)
        // With AnimatePresence, exit animations might keep it in DOM momentarily in real app,
        // but with our mock, it should be instant.
        expect(screen.queryByText('YouTube')).not.toBeInTheDocument();

        const stripe = screen.getAllByText('Stripe');
        expect(stripe[0]).toBeInTheDocument();
    });
});
