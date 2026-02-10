import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Hero } from './Hero';
import { WedgeReconciliation } from './WedgeReconciliation';
import { TelemetryLedger } from './TelemetryLedger';
import { BrowserRouter } from 'react-router-dom';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Scale: () => <div data-testid="icon-scale" />,
    ShieldAlert: () => <div data-testid="icon-shield" />,
    FileText: () => <div data-testid="icon-file" />,
    ArrowRight: () => <div data-testid="icon-arrow" />,
    PlayCircle: () => <div data-testid="icon-play" />,
  };
});

// Mock BeamsBackground
vi.mock('@/components/ui/beams-background', () => ({
  BeamsBackground: ({ children }) => <div>{children}</div>
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }) => <div {...props}>{children}</div>,
            h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
            p: ({ children, ...props }) => <p {...props}>{children}</p>,
            span: ({ children, ...props }) => <span {...props}>{children}</span>,
            path: (props) => <path {...props} />,
        }
    };
});


describe('Landing Components', () => {
    it('Hero renders headline', () => {
        render(
            <BrowserRouter>
                <Hero />
            </BrowserRouter>
        );
        // getByText throws if not found, so this implicitly asserts existence
        expect(screen.getByText(/Match every payout/i)).toBeTruthy();
        expect(screen.getByText(/Bank Reconciliation/i)).toBeTruthy();
    });

    it('WedgeReconciliation renders split view', async () => {
        render(<WedgeReconciliation />);
        expect(screen.getByText(/The Truth Gap/i)).toBeTruthy();
        expect(screen.getByText('Platform')).toBeTruthy();
        expect(screen.getByText('Bank')).toBeTruthy();
    });

    it('TelemetryLedger renders log and stats', async () => {
        render(<TelemetryLedger />);
        expect(screen.getByText(/System Telemetry/i)).toBeTruthy();
        expect(screen.getByText(/Ledger Status/i)).toBeTruthy();
    });
});
