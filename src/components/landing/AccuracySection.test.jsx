/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi, describe, test, afterEach, beforeEach } from 'vitest';
import AccuracySection from './AccuracySection';

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

beforeEach(() => {
    vi.useFakeTimers();
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
  Play: () => <div data-testid="icon-play" />,
  Pause: () => <div data-testid="icon-pause" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
  Activity: () => <div data-testid="icon-activity" />,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, layoutId, ...props }) => <div className={className} data-layoutid={layoutId} {...props}>{children}</div>,
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

  test('renders Live Simulation indicator', () => {
    render(<AccuracySection />);
    expect(screen.getByText(/AUTOPLAY::ACTIVE/i)).toBeInTheDocument();
  });

  test('hover pauses autoplay', async () => {
    render(<AccuracySection />);
    const widget = screen.getByText(/AUTOPLAY::ACTIVE/i).closest('div').parentElement.parentElement; // Widget header -> Widget container
    fireEvent.mouseEnter(widget);
    expect(screen.getByText(/MANUAL_OVERRIDE/i)).toBeInTheDocument();
  });

  test('manual interaction works', async () => {
    render(<AccuracySection />);
    const row = screen.getByText(/YouTube AdSense/i);
    fireEvent.click(row);
    expect(screen.getByText(/MANUAL_OVERRIDE/i)).toBeInTheDocument();
    expect(screen.getByText(/API Ingest/i)).toBeInTheDocument(); // YouTube trace
    const explainTab = screen.getByText(/EXPLAIN/i);
    fireEvent.click(explainTab);
    expect(screen.getByText(/Exact match/i)).toBeInTheDocument(); // YouTube explain
  });

  test('check for forbidden characters (em-dash)', () => {
      render(<AccuracySection />);
      const content = document.body.textContent;
      expect(content).not.toMatch(/—/);
      expect(content).not.toMatch(/–/);
  });
});
