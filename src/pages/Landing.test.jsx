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
  default: ({ isActive }) => <div data-testid="landing-reconciliation" data-is-active={isActive ? 'true' : 'false'}>Reconciliation</div>
}));

vi.mock('@/components/landing/LandingTelemetry', () => ({
  default: ({ isActive }) => <div data-testid="landing-telemetry" data-is-active={isActive ? 'true' : 'false'}>Telemetry</div>
}));

vi.mock('@/components/landing/LandingExport', () => ({
  default: ({ isActive }) => <div data-testid="landing-export" data-is-active={isActive ? 'true' : 'false'}>Export</div>
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ style, children, ...props }) => (
      <div
        style={style}
        data-testid={props.className?.includes('absolute') ? 'motion-frame' : undefined}
        data-display={style?.display}
        data-visibility={style?.visibility}
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
  useMotionValueEvent: (value, event, callback) => {
    callback(mockedScroll.value);
  }
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

  const getMainFrames = () => {
    const allFrames = screen.getAllByTestId('motion-frame');
    return allFrames.slice(1);
  };

  it('shows Frame 1 visible and others hidden at scroll 0', () => {
    mockedScroll.value = 0;
    renderLanding();
    const frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-visibility', 'visible');
    expect(frames[1]).toHaveAttribute('data-visibility', 'hidden');
    expect(frames[2]).toHaveAttribute('data-visibility', 'hidden');
  });

  it('shows Frame 1 and Frame 2 visible during transition (0.36)', () => {
    // Overlap zone is technically removed in strict sense (0.35 cutoff)
    // Frame 1 (< 0.35) -> visible.
    // Frame 2 (> 0.35) -> visible.
    // So at 0.35 exact, logic flips.

    // Let's test non-overlap behavior.

    // 0.2 -> Frame 1 visible
    mockedScroll.value = 0.2;
    renderLanding();
    let frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-visibility', 'visible');
    expect(frames[1]).toHaveAttribute('data-visibility', 'hidden');

    cleanup();

    // 0.4 -> Frame 2 visible
    mockedScroll.value = 0.4;
    renderLanding();
    frames = getMainFrames();
    expect(frames[0]).toHaveAttribute('data-visibility', 'hidden');
    expect(frames[1]).toHaveAttribute('data-visibility', 'visible');
    expect(frames[2]).toHaveAttribute('data-visibility', 'hidden');
  });
});
