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
            div: ({ children, layout, style, ...props }) => <div style={style} {...props}>{children}</div>,
            span: ({ children, ...props }) => <span {...props}>{children}</span>,
        },
    };
});

describe('HowItWorksSection (Quantum Ledger)', () => {
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
        expect(screen.getByText(/High-frequency reconciliation/i)).toBeInTheDocument();
        expect(screen.getByText(/System Architecture/i)).toBeInTheDocument();
    });

    it('renders the explanatory steps', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/01 Connect platforms/i)).toBeInTheDocument();
        expect(screen.getByText(/02 Connect bank feed/i)).toBeInTheDocument();
        expect(screen.getByText(/03 Reconcile & Export/i)).toBeInTheDocument();
    });

    it('renders the terminal structure', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/LIVE_FEED/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Ref/i)).toBeInTheDocument();
        expect(screen.getByText(/System Status/i)).toBeInTheDocument();
    });

    it('ingests rows rapidly', async () => {
        render(<HowItWorksSection />);

        // Initial idle state
        expect(screen.getByText(/INITIALIZING STREAM/i)).toBeInTheDocument();

        // Advance past reset (500ms) into ingest
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        // Rows should be appearing (e.g. STRIPE, YOUTUBE)
        expect(screen.getAllByText(/STRIPE/i).length).toBeGreaterThan(0);

        // Initially they are pending
        expect(screen.getAllByText(/PENDING/i).length).toBeGreaterThan(0);
    });
});
