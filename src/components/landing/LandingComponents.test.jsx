// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Hero } from './Hero';
import { WedgeReconciliation } from './WedgeReconciliation';
import { TelemetryLedger } from './TelemetryLedger';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor() {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
    this.takeRecords = vi.fn();
  }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

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
    Activity: () => <div data-testid="icon-activity" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    Database: () => <div data-testid="icon-db" />,
    Folder: () => <div />,
    HeartHandshakeIcon: () => <div />,
    SparklesIcon: () => <div />,
    Wifi: () => <div />,
    Music2: () => <div />,
    CreditCard: () => <div />,
    ShoppingBag: () => <div />,
    Youtube: () => <div />,
    Fingerprint: () => <div />,
  };
});

// Mock ContainerScroll
vi.mock('@/components/ui/container-scroll-animation', () => ({
  ContainerScroll: ({ titleComponent, children }) => (
    <div>
      {titleComponent}
      {children}
    </div>
  )
}));

// Mock DatabaseWithRestApi
vi.mock('@/components/ui/database-with-rest-api', () => ({
  default: ({ title }) => <div>{title}</div>
}));

// Mock DashboardPreview (if imported directly)
vi.mock('@/components/landing/DashboardPreview', () => ({
  DashboardPreview: () => <div>Dashboard Preview Mock</div>
}));

// Mock DemoModal
vi.mock('./DemoModal', () => ({
    DemoModal: ({ children }) => <div>{children}</div>
}));


describe('Landing Components', () => {
    it('Hero renders headline and dashboard preview', () => {
        render(
            <BrowserRouter>
                <Hero />
            </BrowserRouter>
        );
        expect(screen.getByText(/Match every payout/i)).toBeTruthy();
        expect(screen.getByText(/Start Reconciling/i)).toBeTruthy();
        expect(screen.getByText('Dashboard Preview Mock')).toBeTruthy();
    });

    it('WedgeReconciliation renders the 3 key bullets', async () => {
        render(<WedgeReconciliation />);
        expect(screen.getByText(/Bank Reconciliation/i)).toBeTruthy();
        expect(screen.getByText(/Anomaly Alerts/i)).toBeTruthy();
        expect(screen.getByText(/The Core Wedge/i)).toBeTruthy();
        expect(screen.getByText(/Platforms lie/i)).toBeTruthy();
    });

    it('TelemetryLedger renders ingestion engine and live telemetry', async () => {
        render(<TelemetryLedger />);
        expect(screen.getByText(/Real-Time Ingestion/i)).toBeTruthy();
        expect(screen.getByText(/Zerithum Sync Engine/i)).toBeTruthy(); // from mocked DatabaseWithRestApi title
        expect(screen.getByText(/Live Telemetry/i)).toBeTruthy();
    });
});
