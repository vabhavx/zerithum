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
  it('renders the component with unified dashboard elements', () => {
    render(<LandingReconciliation />);

    // Check for new items in the source list
    expect(screen.getByText('20+ Integrations')).toBeInTheDocument();
    expect(screen.getByText('Connect Custom / API')).toBeInTheDocument();

    // Check for consolidation/dashboard elements
    expect(screen.getByText('Processing Stream')).toBeInTheDocument();
    expect(screen.getByText('Normalization: Active')).toBeInTheDocument();
    expect(screen.getByText('Zerithum // Main_View')).toBeInTheDocument();
    expect(screen.getByText('Total Balance (Unified)')).toBeInTheDocument();
  });

  it('updates dashboard view on source hover', async () => {
    render(<LandingReconciliation />);

    const integrationsButton = screen.getByText('20+ Integrations').closest('button');

    // Initial state: YouTube transactions should be visible (and highlighted/active)
    // We check for a specific transaction label
    expect(screen.getByText('Video: "My Studio Setup 2024"')).toBeInTheDocument();

    // Hover over Integrations
    fireEvent.mouseEnter(integrationsButton);

    // Wait for the UI to update and show the new transactions
    // "Substack Newsletter" is a transaction under "20+ Integrations"
    expect(await screen.findByText('Substack Newsletter')).toBeInTheDocument();
  });
});
