import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCache } from './cache';

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache(3); // Small size for testing eviction
  });

  it('should set and get values', () => {
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('non-existent')).toBe(null);
  });

  it('should evict the least recently used item when at capacity', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // access order: a, b, c

    cache.set('d', 4);
    // 'a' should be evicted
    expect(cache.get('a')).toBe(null);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update LRU order on get', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a' so it becomes most recent
    cache.get('a');
    // access order: b, c, a

    cache.set('d', 4);
    // 'b' should be evicted instead of 'a'
    expect(cache.get('b')).toBe(null);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update LRU order on set (update)', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Update 'a'
    cache.set('a', 10);
    // access order: b, c, a

    cache.set('d', 4);
    // 'b' should be evicted
    expect(cache.get('b')).toBe(null);
    expect(cache.get('a')).toBe(10);
  });

  it('should handle TTL and return null for expired entries in get()', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    cache.set('a', 1, 1000); // 1s TTL
    expect(cache.get('a')).toBe(1);

    vi.setSystemTime(now + 1001);
    // get() should return null for expired entries even if has() was not called
    expect(cache.get('a')).toBe(null);
    expect(cache.cache.has('a')).toBe(false);

    vi.useRealTimers();
  });

  it('should handle TTL in has()', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    cache.set('a', 1, 1000); // 1s TTL
    expect(cache.has('a')).toBe(true);

    vi.setSystemTime(now + 1001);
    expect(cache.has('a')).toBe(false);

    vi.useRealTimers();
  });

  it('should delete keys', () => {
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBe(null);
  });

  it('should clear all keys', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBe(null);
    expect(cache.get('b')).toBe(null);
    expect(cache.cache.size).toBe(0);
  });
});
