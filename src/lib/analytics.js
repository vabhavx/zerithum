/**
 * Analytics & Performance Monitoring
 * Privacy-focused analytics with performance tracking
 */

// ============================================================================
// Core Analytics
// ============================================================================

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const ANALYTICS_KEY = import.meta.env.VITE_ANALYTICS_KEY;

class Analytics {
  constructor() {
    this.queue = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.enabled = !this.isDoNotTrack();
    this.flushInterval = null;
    this.performanceMetrics = [];
  }

  init() {
    if (!this.enabled) return;

    this.setupPerformanceObserver();
    this.setupErrorTracking();
    this.startFlushInterval();
    this.trackPageView();
  }

  isDoNotTrack() {
    return (
      navigator.doNotTrack === '1' ||
      window.doNotTrack === '1' ||
      navigator.globalPrivacyControl === true
    );
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  // ============================================================================
  // Event Tracking
  // ============================================================================

  track(event, properties = {}) {
    if (!this.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.queue.push(eventData);

    // Flush immediately for important events
    if (['error', 'crash', 'signup', 'purchase'].includes(event)) {
      this.flush();
    }
  }

  trackPageView(pageName) {
    this.track('page_view', {
      page: pageName || window.location.pathname,
      title: document.title,
    });
  }

  trackEvent(category, action, label, value) {
    this.track('custom_event', {
      category,
      action,
      label,
      value,
    });
  }

  trackTiming(category, variable, time) {
    this.track('timing', {
      category,
      variable,
      time,
    });
  }

  // ============================================================================
  // Performance Tracking
  // ============================================================================

  setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    // Core Web Vitals
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      observer.observe({ entryTypes: ['web-vitals', 'navigation', 'resource', 'paint'] });
    } catch (e) {
      // Fallback for browsers without web-vitals support
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.track('web_vital', {
          metric: 'LCP',
          value: lastEntry.startTime,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {}

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const delay = entry.processingStart - entry.startTime;
          this.track('web_vital', {
            metric: 'FID',
            value: delay,
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {}

    // Cumulative Layout Shift
    let clsValue = 0;
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Report CLS on page unload
      window.addEventListener('beforeunload', () => {
        this.track('web_vital', {
          metric: 'CLS',
          value: clsValue,
        });
      });
    } catch (e) {}
  }

  handlePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'navigation':
        this.track('navigation_timing', {
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          connect: entry.connectEnd - entry.connectStart,
          ttfb: entry.responseStart - entry.requestStart,
          download: entry.responseEnd - entry.responseStart,
          domInteractive: entry.domInteractive,
          domComplete: entry.domComplete,
          loadComplete: entry.loadEventEnd - entry.loadEventStart,
        });
        break;

      case 'paint':
        this.track('paint_timing', {
          metric: entry.name,
          time: entry.startTime,
        });
        break;

      case 'resource':
        // Sample resource timing (don't track all)
        if (Math.random() < 0.1) {
          this.track('resource_timing', {
            name: entry.name.split('?')[0], // Strip query params
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
        break;
    }
  }

  // ============================================================================
  // Error Tracking
  // ============================================================================

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled_promise_rejection',
      });
    });
  }

  trackError(error, context = {}) {
    this.track('error', {
      message: error?.message || String(error),
      stack: error?.stack?.substring(0, 1000),
      ...context,
    });
  }

  // ============================================================================
  // Data Flushing
  // ============================================================================

  startFlushInterval() {
    this.flushInterval = setInterval(() => this.flush(), 30000); // 30 seconds
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      if (navigator.sendBeacon && ANALYTICS_ENDPOINT) {
        const blob = new Blob([JSON.stringify(events)], {
          type: 'application/json',
        });
        navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
      } else if (ANALYTICS_ENDPOINT) {
        await fetch(ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(events),
          keepalive: true,
        });
      } else {
        // Dev mode: log to console
        console.log('Analytics events:', events);
      }
    } catch (e) {
      // Restore events on failure
      this.queue.unshift(...events);
    }
  }

  // ============================================================================
  // User Timing API Integration
  // ============================================================================

  mark(name) {
    if ('performance' in window) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if ('performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name);
        const lastEntry = entries[entries.length - 1];
        this.trackTiming('custom', name, lastEntry.duration);
      } catch (e) {
        console.warn('Performance measure failed:', e);
      }
    }
  }

  // ============================================================================
  // Feature Detection
  // ============================================================================

  trackFeatureSupport() {
    const features = {
      serviceWorker: 'serviceWorker' in navigator,
      indexedDB: 'indexedDB' in window,
      webWorkers: 'Worker' in window,
      webSockets: 'WebSocket' in window,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      touch: 'ontouchstart' in window,
      crypto: 'crypto' in window && 'getRandomValues' in crypto,
      notifications: 'Notification' in window,
      push: 'PushManager' in window,
    };

    this.track('feature_support', features);
  }
}

// Export singleton
export const analytics = new Analytics();

// ============================================================================
// React Hooks
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';

export function usePageView(pageName, dependencies = []) {
  useEffect(() => {
    analytics.trackPageView(pageName);
  }, dependencies);
}

export function useEventTracking() {
  return useCallback((event, properties) => {
    analytics.track(event, properties);
  }, []);
}

export function usePerformanceMeasure(name) {
  const startTimeRef = useRef(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    analytics.mark(`${name}_start`);
  }, [name]);

  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      analytics.trackTiming('component', name, duration);
      analytics.measure(name, `${name}_start`);
    }
  }, [name]);

  useEffect(() => {
    start();
    return end;
  }, [start, end]);

  return { start, end };
}

export function useErrorTracking() {
  return useCallback((error, context) => {
    analytics.trackError(error, context);
  }, []);
}

// ============================================================================
// Component Usage Tracking
// ============================================================================

export function useComponentTrack(componentName, props = {}) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;

    if (renderCount.current === 1) {
      analytics.track('component_mount', {
        component: componentName,
        props: Object.keys(props),
      });
    }

    return () => {
      const lifetime = Date.now() - mountTime.current;
      analytics.track('component_unmount', {
        component: componentName,
        lifetime,
        renderCount: renderCount.current,
      });
    };
  }, [componentName]);

  useEffect(() => {
    analytics.track('component_update', {
      component: componentName,
      renderCount: renderCount.current,
    });
  });
}
