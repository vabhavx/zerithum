// @vitest-environment jsdom
import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
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
        useAnimationFrame: (callback) => {},
        useMotionValue: (initial) => ({ get: () => initial, set: () => {} }),
        useTransform: () => ({ get: () => 0 }),
        useSpring: () => ({ get: () => 0 }),
        useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    };
});

describe('HowItWorksSection', () => {
    beforeAll(() => {
        // Setup IntersectionObserver mock globally as a class
        class IntersectionObserverMock {
            constructor(callback, options) {
                this.callback = callback;
                this.options = options;
            }
            disconnect = vi.fn();
            observe = vi.fn();
            takeRecords = vi.fn();
            unobserve = vi.fn();
        }

        vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
        window.IntersectionObserver = IntersectionObserverMock;
    });

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
        expect(screen.getByText(/We decode the noise/i)).toBeInTheDocument();
        expect(screen.getByText(/The Reality Scanner/i)).toBeInTheDocument();
    });

    it('renders raw payloads initially (inView=false default)', () => {
        render(<HowItWorksSection />);
        // Since our IntersectionObserver mock doesn't fire callbacks by default,
        // inView state remains false.
        const rawLabels = screen.getAllByText(/Raw Payload/i);
        expect(rawLabels.length).toBeGreaterThan(0);
        // Check for raw content
        expect(screen.getAllByText(/ch_1Nx/i).length).toBeGreaterThan(0);
    });

    it('renders scanner visualization', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText(/Verification Zone/i)).toBeInTheDocument();
    });
});
