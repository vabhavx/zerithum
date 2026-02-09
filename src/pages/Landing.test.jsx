// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Landing from './Landing';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Setup shared state using vi.hoisted
const { mockedScroll } = vi.hoisted(() => ({ mockedScroll: { value: 0 } }));

// Setup mocks
vi.mock('@/components/ui/beams-background', () => ({
  BeamsBackground: ({ children }) => <div data-testid="beams-background">{children}</div>
}));

vi.mock('@/components/landing/LandingReconciliation', () => ({
  default: () => <div data-testid="landing-reconciliation">Reconciliation</div>
}));

vi.mock('@/components/landing/LandingTelemetry', () => ({
  default: () => <div data-testid="landing-telemetry">Telemetry</div>
}));

vi.mock('@/components/landing/LandingExport', () => ({
  default: () => <div data-testid="landing-export">Export</div>
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ style, children, ...props }) => (
      <div
        style={style}
        data-testid={props.className?.includes('absolute') ? 'motion-frame' : undefined}
        data-display={style?.display}
        {...props}
      >
        {children}
      </div>
    ),
    h1: ({ children }) => <h1>{children}</h1>,
    p: ({ children }) => <p>{children}</p>,
  },
  useScroll: () => ({ scrollYProgress: mockedScroll.value }),
  useTransform: (value, mapOrFunc, outputRange) => {
    if (typeof mapOrFunc === 'function') {
      return mapOrFunc(value);
    }
    // Handle array form roughly just to not crash
    return 1;
  },
}));

// Mock IntersectionObserver
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();
window.IntersectionObserver = vi.fn(() => ({
  observe,
  unobserve,
  disconnect,
}));

describe('Landing Page Visibility Logic', () => {
  const renderLanding = () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // Helper to get the 3 main frames, ignoring the hero absolute div
  const getMainFrames = () => {
    const allFrames = screen.getAllByTestId('motion-frame');
    return allFrames.slice(1);
  };

  it('shows Frame 1 and hides others at scroll 0', () => {
    mockedScroll.value = 0;
    renderLanding();
    const frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-display', 'flex');
    expect(frames[1]).toHaveAttribute('data-display', 'none');
    expect(frames[2]).toHaveAttribute('data-display', 'none');
  });

  it('shows Frame 1 and Frame 2 during transition (0.25)', () => {
    mockedScroll.value = 0.25;
    renderLanding();
    const frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-display', 'flex');
    expect(frames[1]).toHaveAttribute('data-display', 'flex');
    expect(frames[2]).toHaveAttribute('data-display', 'none');
  });

  it('hides Frame 1 and shows Frame 2 at scroll 0.4', () => {
    mockedScroll.value = 0.4;
    renderLanding();
    const frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-display', 'none');
    expect(frames[1]).toHaveAttribute('data-display', 'flex');
    expect(frames[2]).toHaveAttribute('data-display', 'none');
  });

  it('shows Frame 2 and Frame 3 during transition (0.55)', () => {
    mockedScroll.value = 0.55;
    renderLanding();
    const frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-display', 'none');
    expect(frames[1]).toHaveAttribute('data-display', 'flex');
    expect(frames[2]).toHaveAttribute('data-display', 'flex');
  });

  it('hides Frame 2 and shows Frame 3 at scroll 0.8', () => {
    mockedScroll.value = 0.8;
    renderLanding();
    const frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-display', 'none');
    expect(frames[1]).toHaveAttribute('data-display', 'none');
    expect(frames[2]).toHaveAttribute('data-display', 'flex');
  });
});
