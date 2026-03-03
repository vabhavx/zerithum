/**
 * Performance Optimization Utilities
 * Advanced memoization, virtualization helpers, and render optimization
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Memoization & Caching Utilities
// ============================================================================

/**
 * LRU Cache implementation for expensive computations
 */
export class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
      return item;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.cache.has(key);
  }
}

// Global computation cache
export const computationCache = new LRUCache(500);

/**
 * Memoized computation hook with caching
 */
export function useMemoizedComputation(key, computeFn, deps) {
  const cacheKey = useMemo(() => {
    const depsString = JSON.stringify(deps);
    return `${key}:${depsString}`;
  }, deps);

  return useMemo(() => {
    const cached = computationCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = computeFn();
    computationCache.set(cacheKey, result);
    return result;
  }, [cacheKey, computeFn]);
}

// ============================================================================
// Debounce & Throttle with React Integration
// ============================================================================

/**
 * Advanced debounce hook with leading/trailing options
 */
export function useDebounce(value, delay, options = {}) {
  const { leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const leadingCalledRef = useRef(false);

  useEffect(() => {
    if (leading && !leadingCalledRef.current) {
      setDebouncedValue(value);
      leadingCalledRef.current = true;
    }

    timeoutRef.current = setTimeout(() => {
      if (trailing) {
        setDebouncedValue(value);
      }
      leadingCalledRef.current = false;
    }, delay);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
}

/**
 * Throttle hook for performance-critical operations
 */
export function useThrottle(callback, limit) {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= limit) {
        lastRunRef.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          timeoutRef.current = null;
          callback(...args);
        }, limit - timeSinceLastRun);
      }
    },
    [callback, limit]
  );
}

// ============================================================================
// Optimized Data Fetching Hooks
// ============================================================================

/**
 * Optimized query hook with prefetching and stale-while-revalidate
 */
export function useOptimizedQuery(queryKey, queryFn, options = {}) {
  const queryClient = useQueryClient();
  const { 
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    prefetchNext = false,
    ...restOptions 
  } = options;

  const query = useQuery({
    queryKey,
    queryFn,
    staleTime,
    gcTime: cacheTime,
    ...restOptions,
  });

  // Prefetch next page/data if specified
  useEffect(() => {
    if (prefetchNext && query.data && !query.isFetchingNextPage) {
      const nextKey = [...queryKey, 'next'];
      queryClient.prefetchQuery({
        queryKey: nextKey,
        queryFn,
        staleTime,
      });
    }
  }, [query.data, prefetchNext, queryKey, queryFn, staleTime, queryClient, query.isFetchingNextPage]);

  return query;
}

/**
 * Infinite scroll hook with intersection observer
 */
export function useInfiniteScroll(loadMore, hasMore, options = {}) {
  const { threshold = 0.1, rootMargin = '100px' } = options;
  const observerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, threshold, rootMargin]);

  return elementRef;
}

// ============================================================================
// Virtualization Helpers
// ============================================================================

/**
 * Virtual list calculation hook
 */
export function useVirtualList(itemCount, itemHeight, overscan = 5) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const virtualItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil((containerRef.current?.clientHeight || 600) / itemHeight);
    
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(itemCount, startIndex + visibleCount + overscan);

    const items = [];
    for (let i = start; i < end; i++) {
      items.push({
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        },
      });
    }

    return {
      items,
      startIndex: start,
      endIndex: end,
      totalHeight: itemCount * itemHeight,
    };
  }, [scrollTop, itemCount, itemHeight, overscan]);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    virtualItems,
    onScroll,
    scrollTop,
  };
}

// ============================================================================
// Render Optimization
// ============================================================================

/**
 * Use this to prevent unnecessary re-renders of expensive components
 */
export function useRenderCount(componentName) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered: ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

/**
 * Optimized selector hook to prevent unnecessary re-renders
 */
export function useSelector(data, selector) {
  const prevResultRef = useRef();
  
  return useMemo(() => {
    const result = selector(data);
    // Shallow comparison to prevent re-renders
    if (JSON.stringify(result) === JSON.stringify(prevResultRef.current)) {
      return prevResultRef.current;
    }
    prevResultRef.current = result;
    return result;
  }, [data, selector]);
}

// ============================================================================
// Web Worker Integration
// ============================================================================

/**
 * Web Worker hook for offloading heavy computations
 */
export function useWorker(workerScript) {
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map());
  const idCounterRef = useRef(0);

  useEffect(() => {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      const { id, result, error } = e.data;
      const { resolve, reject } = pendingRef.current.get(id);
      pendingRef.current.delete(id);

      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    };

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [workerScript]);

  const postMessage = useCallback((data) => {
    return new Promise((resolve, reject) => {
      const id = ++idCounterRef.current;
      pendingRef.current.set(id, { resolve, reject });
      workerRef.current?.postMessage({ id, data });
    });
  }, []);

  return postMessage;
}

// ============================================================================
// Bundle Splitting Helpers
// ============================================================================

/**
 * Preload component for faster navigation
 */
export function preloadComponent(importFn) {
  const Component = React.lazy(importFn);
  Component.preload = importFn;
  return Component;
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Cleanup hook for large datasets
 */
export function useMemoryCleanup(data, maxSize = 10000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (data && data.length > maxSize) {
      // Force garbage collection hint by releasing references
      console.warn(`Large dataset detected: ${data.length} items. Consider pagination.`);
    }
  }, [data, maxSize]);

  const cleanup = useCallback(() => {
    queryClient.clear();
    computationCache.clear();
  }, [queryClient]);

  return cleanup;
}
