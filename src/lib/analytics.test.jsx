import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePageView, analytics } from './analytics';

// @vitest-environment jsdom

describe('usePageView hook', () => {
  beforeEach(() => {
    // Spy on the analytics.trackPageView method
    vi.spyOn(analytics, 'trackPageView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks page view on initial render', () => {
    renderHook(() => usePageView('Home Page'));

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
    expect(analytics.trackPageView).toHaveBeenCalledWith('Home Page');
  });

  it('tracks page view when dependencies change', () => {
    const { rerender } = renderHook(
      ({ pageName, deps }) => usePageView(pageName, deps),
      { initialProps: { pageName: 'User Profile', deps: ['user123'] } }
    );

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
    expect(analytics.trackPageView).toHaveBeenCalledWith('User Profile');

    // Change dependencies
    rerender({ pageName: 'User Profile', deps: ['user456'] });

    expect(analytics.trackPageView).toHaveBeenCalledTimes(2);
    expect(analytics.trackPageView).toHaveBeenLastCalledWith('User Profile');
  });

  it('does not track page view when re-rendered with same dependencies', () => {
    const { rerender } = renderHook(
      ({ pageName, deps }) => usePageView(pageName, deps),
      { initialProps: { pageName: 'Dashboard', deps: ['data'] } }
    );

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);

    // Re-render with exact same dependencies array content
    rerender({ pageName: 'Dashboard', deps: ['data'] });

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
  });

  it('tracks page view only once with default dependencies', () => {
    const { rerender } = renderHook(() => usePageView('Settings'));

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);

    // Default deps is [], so it should not re-run on generic rerender
    rerender();

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
  });

  it('handles missing or undefined pageName', () => {
    renderHook(() => usePageView(undefined));

    expect(analytics.trackPageView).toHaveBeenCalledTimes(1);
    expect(analytics.trackPageView).toHaveBeenCalledWith(undefined);
  });
});
