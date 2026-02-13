
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi, describe, test, afterEach } from 'vitest';
import AccuracySection from './AccuracySection';

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="icon-check" />,
  X: () => <div data-testid="icon-x" />,
  Search: () => <div data-testid="icon-search" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  ShieldCheck: () => <div data-testid="icon-shield-check" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Link: () => <div data-testid="icon-link" />,
  Clock: () => <div data-testid="icon-clock" />,
  User: () => <div data-testid="icon-user" />,
  Eye: () => <div data-testid="icon-eye" />,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className}>{children}</div>,
    button: ({ children, className, ...props }) => <button className={className}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  LayoutGroup: ({ children }) => <>{children}</>,
}));

describe('AccuracySection', () => {
  test('renders section headline and copy', () => {
    render(<AccuracySection />);
    expect(screen.getByText(/Verification logic you can see/i)).toBeInTheDocument();
  });

  test('renders Proof Widget text', () => {
    render(<AccuracySection />);
    // Use queryAll to debug if multiple exist, but with cleanup it should be one
    expect(screen.getByText(/Live Proof Mode/i)).toBeInTheDocument();
  });

  test('renders sample events', () => {
    render(<AccuracySection />);
    expect(screen.getByText(/YouTube AdSense/i)).toBeInTheDocument();
  });

  test('interactive widget expansion', async () => {
    render(<AccuracySection />);

    // Find a "See proof" button
    const expandButtons = screen.getAllByLabelText('See proof');
    expect(expandButtons.length).toBeGreaterThan(0);

    // Click the first one
    fireEvent.click(expandButtons[0]);

    // Check if tabs appear
    await waitFor(() => {
        expect(screen.getByText('Trace')).toBeInTheDocument();
        expect(screen.getByText('Explain')).toBeInTheDocument();
        expect(screen.getByText('Resolve')).toBeInTheDocument();
    });
  });

  test('filtering mismatches', async () => {
    render(<AccuracySection />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(toggle).toBeInTheDocument();
  });

  test('check for forbidden characters (em-dash)', () => {
      render(<AccuracySection />);
      const content = document.body.textContent;
      expect(content).not.toMatch(/—/);
      expect(content).not.toMatch(/–/);
  });
});
