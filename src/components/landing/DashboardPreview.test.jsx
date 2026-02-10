// @vitest-environment jsdom
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPreview } from './DashboardPreview';

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }) => <div {...props}>{children}</div>,
        },
        AnimatePresence: ({ children }) => <>{children}</>,
    };
});

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Activity: () => <div data-testid="icon-activity" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    AlertTriangle: () => <div data-testid="icon-alert" />,
    ArrowRight: () => <div data-testid="icon-arrow" />,
    Youtube: () => <div data-testid="icon-youtube" />,
    DollarSign: () => <div data-testid="icon-dollar" />,
    Building2: () => <div data-testid="icon-building" />,
    Search: () => <div data-testid="icon-search" />,
  };
});

describe('DashboardPreview', () => {
    it('renders initial state correctly', () => {
        render(<DashboardPreview />);
        expect(screen.getByText('ACTION REQUIRED')).toBeTruthy();
        expect(screen.getByText('RECONCILIATION QUEUE')).toBeTruthy();
        expect(screen.getByText('USD 1,800.00')).toBeTruthy(); // Platform amount
        expect(screen.getByText('USD 1,650.00')).toBeTruthy(); // Bank amount
    });

    it('cycles through animation steps', async () => {
        vi.useFakeTimers();
        render(<DashboardPreview />);

        // Step 0: Scanning
        const scanningElements = screen.getAllByText('Scanning Deposits...');
        expect(scanningElements.length).toBeGreaterThanOrEqual(1);
        expect(scanningElements[0]).toBeTruthy();

        // Advance timer to Step 1: Mismatch Detected
        await act(async () => {
            vi.advanceTimersByTime(4500);
        });
        expect(screen.getByText('MISMATCH DETECTED')).toBeTruthy();

        // Advance timer to Step 2: Variance
        await act(async () => {
            vi.advanceTimersByTime(4500);
        });
        expect(screen.getByText('- USD 150.00')).toBeTruthy();
        expect(screen.getByText('VARIANCE')).toBeTruthy();
        expect(screen.getByText('Variance Flagged: Platform Fee?')).toBeTruthy();

        vi.useRealTimers();
    });
});
