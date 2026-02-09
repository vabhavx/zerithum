import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import LandingReconciliation from './LandingReconciliation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('LandingReconciliation', () => {
  it('renders the component with new data sources', () => {
    render(<LandingReconciliation />);

    // Check for new items
    expect(screen.getByText('20+ Integrations')).toBeInTheDocument();
    expect(screen.getByText('Connect Custom / API')).toBeInTheDocument();

    // Check for consolidation/dashboard elements
    expect(screen.getByText('Consolidating')).toBeInTheDocument();
    expect(screen.getByText('Zerithum Core')).toBeInTheDocument();
    expect(screen.getByText('Live Dashboard')).toBeInTheDocument();
  });

  it('updates active source on hover', async () => {
    render(<LandingReconciliation />);

    const integrationsButton = screen.getByText('20+ Integrations').closest('button');

    // Initial state (YouTube is usually first)
    expect(screen.getByText('AdSense & Memberships')).toBeInTheDocument();

    // Hover over Integrations
    fireEvent.mouseEnter(integrationsButton);

    // Should now show Ecosystem details
    expect(await screen.findByText('Ecosystem')).toBeInTheDocument();
    expect(await screen.findByText('Substack Newsletter')).toBeInTheDocument();
  });
});
