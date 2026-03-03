/**
 * Performance Library - Enterprise-grade speed optimizations
 * Export all performance utilities
 */

export * from './InstantRouter';
export * from './VirtualList';
export * from './OptimisticUI';

// ============================================================================
// RENDER OPTIMIZATION UTILITIES
// ============================================================================

import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * useRaf - Synchronize state updates with browser refresh rate
 * Ensures smooth 60fps animations and reduced CPU usage
 */
export function useRaf(callback: (time: number) => void, isActive: boolean = true) {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const loop = (time: number) => {
      callbackRef.current(time);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive]);
}

/**
 * useIdleCallback - Execute non-critical work when browser is idle
 * Improves perceived performance by deferring low-priority tasks
 */
export function useIdleCallback<T extends (...args: any[]) => any>(
  callback: T,
  options?: IdleRequestOptions
) {
  const callbackRef = useRef(callback);
  const idRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if ('requestIdleCallback' in window) {
      idRef.current = window.requestIdleCallback(() => {
        callbackRef.current(...args);
      }, options);
    } else {
      // Fallback for Safari
      setTimeout(() => callbackRef.current(...args), 1);
    }

    return () => {
      if (idRef.current !== null) {
        window.cancelIdleCallback?.(idRef.current);
      }
    };
  }, [options]);
}

/**
 * useIntersectionObserver - Efficiently detect element visibility
 * Perfect for lazy loading, infinite scroll, and viewport-based triggers
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!node) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [node, options]);

  return [setNode, entry] as const;
}

/**
 * useDebounce - Delay expensive operations until user stops typing/interacting
 * Essential for search inputs, resize handlers, and scroll events
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useThrottle - Limit operation frequency to maintain responsiveness
 * Critical for scroll events, mouse movements, and resize handlers
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (!inThrottle.current) {
      callbackRef.current(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [limit]) as T;
}

/**
 * useWhyDidYouUpdate - Development tool to identify unnecessary re-renders
 * Helps optimize component performance during development
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>({});

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj);
      }
    }

    previousProps.current = props;
  });
}

/**
 * useMeasure - Efficiently measure DOM element dimensions
 * Uses ResizeObserver for high-performance size tracking
 */
export function useMeasure<T extends Element>() {
  const ref = useRef<T>(null);
  const [rect, setRect] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setRect(entry.contentRect);
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return [ref, rect] as const;
}

/**
 * useIsVisible - Track element visibility in viewport
 * Useful for lazy loading images, triggering animations, or analytics
 */
export function useIsVisible<T extends Element>(
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<T | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isVisible] as const;
}

/**
 * useLayoutEffectOnce - Run layout effect only once, safely
 * Avoids double execution in React StrictMode
 */
export function useLayoutEffectOnce(effect: React.EffectCallback) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      return effect();
    }
  }, [effect]);
}

/**
 * useStableCallback - Get a stable callback reference that never changes
 * Useful when passing callbacks to memoized child components
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef(callback);
  
  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}

/**
 * usePrevious - Get the previous value of a prop or state
 * Useful for comparing changes and triggering side effects
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useMount - Execute callback only on component mount
 * Equivalent to componentDidMount
 */
export function useMount(callback: () => void) {
  useEffect(() => {
    callback();
  }, []);
}

/**
 * useUnmount - Execute callback only on component unmount
 * Equivalent to componentWillUnmount
 */
export function useUnmount(callback: () => void) {
  useEffect(() => {
    return () => callback();
  }, []);
}

/**
 * useUpdateEffect - Execute effect only on updates, not initial mount
 * Skips first execution, runs on subsequent updates
 */
export function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
  }, deps);
}

// ============================================================================
// WEB WORKER UTILITIES
// ============================================================================

/**
 * createWorker - Create a typed Web Worker for heavy computations
 * Offloads CPU-intensive tasks from the main thread
 */
export function createWorker<T extends (...args: any[]) => any>(fn: T) {
  const blob = new Blob(
    [`self.onmessage = function(e) { self.postMessage((${fn.toString()})(...e.data)); }`],
    { type: 'application/javascript' }
  );
  
  const worker = new Worker(URL.createObjectURL(blob));

  return {
    execute: (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = reject;
        worker.postMessage(args);
      });
    },
    terminate: () => worker.terminate(),
  };
}

// ============================================================================
// BUNDLE SPLITTING UTILITIES
// ============================================================================

/**
 * lazyWithPreload - React.lazy with preload capability
 * Allows manual preloading of components before they're needed
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(factory);
  let preloadPromise: Promise<void> | null = null;

  const PreloadableComponent = (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={null}>
      <LazyComponent {...props} />
    </React.Suspense>
  );

  PreloadableComponent.preload = () => {
    if (!preloadPromise) {
      preloadPromise = factory().then(() => {});
    }
    return preloadPromise;
  };

  return PreloadableComponent;
}

// ============================================================================
// CSS PERFORMANCE
// ============================================================================

/**
 * Critical CSS - Inline critical styles for instant first paint
 * These styles are applied immediately, before JS loads
 */
export const criticalCSS = `
  /* Critical rendering path optimizations */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  /* Prevent layout shift from images */
  img {
    max-width: 100%;
    height: auto;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/**
 * Inject critical CSS into the document head
 */
export function injectCriticalCSS() {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * LRU Cache implementation with size limit
 * Automatically evicts least recently used items
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize function with LRU cache
 * Caches function results to avoid recomputation
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  return function (...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator 
      ? keyGenerator(...args) 
      : JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T;
}
