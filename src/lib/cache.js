/**
 * Advanced Caching Layer
 * Multi-tier caching with IndexedDB, localStorage, and memory
 */

// ============================================================================
// IndexedDB Cache
// ============================================================================

const DB_NAME = 'zerithum_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache_entries';

class IndexedDBCache {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async get(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check expiration
        if (result.expires && result.expires < Date.now()) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(result.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async set(key, value, ttlMs = 3600000) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const entry = {
        key,
        value,
        expires: ttlMs ? Date.now() + ttlMs : null,
        created: Date.now(),
      };

      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('expires');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async keys() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================================
// Memory Cache with LRU Eviction
// ============================================================================

class MemoryCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    // Update access order
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return this.cache.get(key).value;
  }

  set(key, value, ttlMs = null) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
    }

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    this.cache.set(key, {
      value,
      expires: ttlMs ? Date.now() + ttlMs : null,
    });
    this.accessOrder.push(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires && entry.expires < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
}

// ============================================================================
// Multi-Tier Cache
// ============================================================================

class MultiTierCache {
  constructor() {
    this.memory = new MemoryCache(100);
    this.indexedDB = new IndexedDBCache();
    this.listeners = new Set();
  }

  async get(key, options = {}) {
    const { skipMemory = false, skipIndexedDB = false } = options;

    // Try memory first
    if (!skipMemory) {
      const memValue = this.memory.get(key);
      if (memValue !== null) {
        return memValue;
      }
    }

    // Try IndexedDB
    if (!skipIndexedDB) {
      const dbValue = await this.indexedDB.get(key);
      if (dbValue !== null) {
        // Promote to memory
        this.memory.set(key, dbValue);
        return dbValue;
      }
    }

    return null;
  }

  async set(key, value, options = {}) {
    const { ttl = 3600000, memoryOnly = false } = options;

    this.memory.set(key, value, ttl);
    
    if (!memoryOnly) {
      await this.indexedDB.set(key, value, ttl);
    }

    this.notifyListeners('set', { key, value });
  }

  async delete(key) {
    this.memory.delete(key);
    await this.indexedDB.delete(key);
    this.notifyListeners('delete', { key });
  }

  async clear() {
    this.memory.clear();
    await this.indexedDB.clear();
    this.notifyListeners('clear', {});
  }

  async cleanup() {
    await this.indexedDB.cleanup();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (e) {
        console.error('Cache listener error:', e);
      }
    });
  }
}

// Export singleton instance
export const cache = new MultiTierCache();

// ============================================================================
// React Hooks
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

export function useCachedData(key, fetcher, options = {}) {
  const { 
    ttl = 300000, // 5 minutes
    staleWhileRevalidate = true,
    onError,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const fetchRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (fetchRef.current && !force) return;
    fetchRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // Try cache first
      const cached = await cache.get(key);
      
      if (cached && !force) {
        setData(cached);
        setIsLoading(false);
        
        if (staleWhileRevalidate) {
          setIsStale(true);
        } else {
          return;
        }
      }

      // Fetch fresh data
      const fresh = await fetcher();
      
      await cache.set(key, fresh, { ttl });
      setData(fresh);
      setIsStale(false);
    } catch (err) {
      setError(err);
      onError?.(err);
    } finally {
      setIsLoading(false);
      fetchRef.current = false;
    }
  }, [key, fetcher, ttl, staleWhileRevalidate, onError]);

  const invalidate = useCallback(async () => {
    await cache.delete(key);
    setData(null);
    fetchData(true);
  }, [key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch: () => fetchData(true),
    invalidate,
  };
}

export function useCacheInvalidation(pattern) {
  const invalidateMatching = useCallback(async () => {
    const keys = await cache.indexedDB.keys();
    const matching = keys.filter(key => 
      typeof key === 'string' && key.includes(pattern)
    );
    
    await Promise.all(matching.map(key => cache.delete(key)));
  }, [pattern]);

  return invalidateMatching;
}

// ============================================================================
// Service Worker Cache Integration
// ============================================================================

export const swCache = {
  async addToCache(urls) {
    if (!('caches' in window)) return;
    
    const cache = await caches.open('zerithum-assets-v1');
    await cache.addAll(urls);
  },

  async getFromCache(url) {
    if (!('caches' in window)) return null;
    
    const cache = await caches.open('zerithum-assets-v1');
    return cache.match(url);
  },

  async clearCache() {
    if (!('caches' in window)) return;
    
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  },
};

// ============================================================================
// Background Sync
// ============================================================================

export const backgroundSync = {
  async register(tag) {
    if (!('serviceWorker' in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await registration.sync.register(tag);
    }
  },

  async queueAction(action) {
    const queue = JSON.parse(localStorage.getItem('action_queue') || '[]');
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    });
    localStorage.setItem('action_queue', JSON.stringify(queue));
    
    // Try to trigger sync
    await this.register('sync-actions');
  },

  async processQueue(processor) {
    const queue = JSON.parse(localStorage.getItem('action_queue') || '[]');
    const failed = [];

    for (const action of queue) {
      try {
        await processor(action);
      } catch (e) {
        failed.push(action);
      }
    }

    localStorage.setItem('action_queue', JSON.stringify(failed));
    return { processed: queue.length - failed.length, failed: failed.length };
  },
};
