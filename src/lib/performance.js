/**
 * Performance Utilities - JavaScript version for compatibility
 */

import { useRef, useEffect, useCallback, useState } from 'react';

// ============================================================================
// MEMOIZATION
// ============================================================================

export class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }
}

export function memoize(fn, maxSize = 100, keyGenerator) {
  const cache = new LRUCache(maxSize);

  return function (...args) {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// ============================================================================
// HOOKS
// ============================================================================

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle(callback, limit) {
  const inThrottle = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    if (!inThrottle.current) {
      callbackRef.current(...args);
      inThrottle.current = true;
      setTimeout(() => { inThrottle.current = false; }, limit);
    }
  }, [limit]);
}

export function useIsVisible(options) {
  const [isVisible, setIsVisible] = useState(false);
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, options]);

  return [setNode, isVisible];
}

export function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

export function useMount(callback) {
  useEffect(() => { callback(); }, []);
}

export function useUnmount(callback) {
  useEffect(() => { return () => callback(); }, []);
}
