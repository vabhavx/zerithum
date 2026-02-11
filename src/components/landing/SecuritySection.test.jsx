import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import SecuritySection from './SecuritySection';

// Mock SecurityAnimation to avoid animation/timer issues in tests
vi.mock('./SecurityAnimation', () => ({
    default: () => <div data-testid="security-animation">Security Animation Mock</div>
}));

describe('SecuritySection', () => {
    it('renders the main headline and subheadline', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        expect(screen.getByText(/Data minimized. Read only. Auditable./i)).toBeInTheDocument();
        expect(screen.getByText(/Zerithum observes revenue and deposits after settlement/i)).toBeInTheDocument();
    });

    it('renders the Data Boundaries section', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        expect(screen.getByText(/What Zerithum Can Do/i)).toBeInTheDocument();
        expect(screen.getByText(/What Zerithum Cannot Do/i)).toBeInTheDocument();
        // Check a sample item
        expect(screen.getByText(/Move, hold, route, or settle your funds/i)).toBeInTheDocument();
    });

    it('renders the Trust Controls grid', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        expect(screen.getByRole('heading', { name: /No custody of funds/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Immutable audit trail/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Encryption/i })).toBeInTheDocument();
    });

    it('renders the What We Never Store list', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        expect(screen.getByText(/What we never store:/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank passwords or login credentials/i)).toBeInTheDocument();
    });

    it('renders the SecurityAnimation component', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        expect(screen.getByTestId('security-animation')).toBeInTheDocument();
    });

    it('renders the CTA buttons with correct links', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        const methodologyLink = screen.getByRole('link', { name: /View reconciliation methodology/i });
        expect(methodologyLink).toHaveAttribute('href', '/methodology');

        const privacyLink = screen.getByRole('link', { name: /Read privacy policy/i });
        expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('renders the retention footnote', () => {
        render(
            <MemoryRouter>
                <SecuritySection />
            </MemoryRouter>
        );
        expect(screen.getByText(/Audit logs and reconciliation history are retained for long term record keeping/i)).toBeInTheDocument();
    });
});
