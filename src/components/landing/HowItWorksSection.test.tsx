// @vitest-environment jsdom
import { render, screen, act, cleanup, waitFor } from '@testing-library/react';
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
            div: ({ children, layout, ...props }) => <div {...props}>{children}</div>,
            span: ({ children, ...props }) => <span {...props}>{children}</span>,
        },
    };
});

describe('HowItWorksSection (Living Ledger)', () => {
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
        expect(screen.getByText(/The source of truth/i)).toBeInTheDocument();
        expect(screen.getByText(/Live Ledger Construction/i)).toBeInTheDocument();
    });

    it('renders the ledger widget structure', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/Zerithum Ledger v2.1/i)).toBeInTheDocument();
        expect(screen.getByText(/Platform Source/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Verification/i)).toBeInTheDocument();
    });

    it('populates rows over time', async () => {
        render(<HowItWorksSection />);

        // Initial state: Empty
        expect(screen.getByText(/Waiting for transaction stream/i)).toBeInTheDocument();

        // Advance 2s (Row 1 appears)
        await act(async () => {
            vi.advanceTimersByTime(2100);
        });

        expect(screen.getByText('YouTube')).toBeInTheDocument();
        // At 2.1s, it's in 'ingest' or 'match' phase.
        // Ingest = only platform. Match (800ms after ingest) = Bank appears.
        // 2100ms > 2000ms (Ingest) + 100ms. So bank might not be there yet?
        // Wait, loop runs at 2000ms.
        // T=2000ms: Row 1 added (Stage: Ingest).
        // T=2800ms: Row 1 -> Match (Bank appears).
        // T=3600ms: Row 1 -> Verified.

        // So at 2100ms, only YouTube should be visible. Bank "Chase" might be hidden or skeleton.
        // The skeleton is rendered if !isMatched.

        // Let's advance to T=3000ms to see Bank
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        // Now at 3100ms total. Row 1 is matched.
        // We look for "CH" circle or text.
        expect(screen.getByText('Chase')).toBeInTheDocument();
    });

    it('verifies rows eventually', async () => {
        render(<HowItWorksSection />);

        // Advance enough for first row to be verified (3600ms+)
        await act(async () => {
            vi.advanceTimersByTime(4000);
        });

        expect(screen.getByText(/Reconciled/i)).toBeInTheDocument();
    });
});
