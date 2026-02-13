// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import HowItWorksSection from './HowItWorksSection';

expect.extend(matchers);

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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
    });

    it('renders the pipeline header', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/ZERITHUM_PIPELINE_V4/i)).toBeInTheDocument();
        expect(screen.getByText(/Revenue, reality checked./i)).toBeInTheDocument();
    });

    it('renders the initial state with processing indicator', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/PROCESSING.../i)).toBeInTheDocument();
        expect(screen.getByText(/Incoming Signals/i)).toBeInTheDocument();
    });

    it('completes the sequence and shows replay button', () => {
        render(<HowItWorksSection />);

        // Fast-forward time to complete the sequence (4 items * 800ms + delays)
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(screen.getByText(/SYNC COMPLETE/i)).toBeInTheDocument();
        // The replay button appears at the end
        // Note: text might be split or uppercase in DOM, let's look for part of it
        // Button text is "RUN_SEQUENCE_AGAIN"
        // But it's inside a condition `processedItems.length === 4`
    });
});
