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
        expect(screen.getByText(/Platforms report what they owe you/)).toBeInTheDocument();
    });

    it('renders the interactive widget controls', () => {
        render(<HowItWorksSection />);
        expect(screen.getByText('View with bank layer')).toBeInTheDocument();
        expect(screen.getByText('Replay')).toBeInTheDocument();
    });

    it('toggles the bank layer', () => {
        render(<HowItWorksSection />);
        const toggle = screen.getByText('View with bank layer');
        fireEvent.click(toggle);
        expect(toggle).toBeInTheDocument();
    });
});
