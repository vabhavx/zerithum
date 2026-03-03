/**
 * Instant Router - Sub-50ms navigation with predictive prefetching
 * Enterprise-grade routing with aggressive optimization
 */

import React, { 
  createContext, 
  useContext, 
  useCallback, 
  useRef, 
  useEffect,
  Suspense,
  lazy,
  ComponentType
} from 'react';
import { useNavigate, useLocation, NavigateOptions } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

interface RoutePrefetchConfig {
  path: string;
  component: () => Promise<{ default: ComponentType }>;
  preloadDelay?: number;
  priority?: 'immediate' | 'idle' | 'interaction';
}

interface PrefetchCache {
  [key: string]: {
    component: ComponentType | null;
    promise: Promise<void> | null;
    loaded: boolean;
    timestamp: number;
  };
}

interface InstantRouterContextValue {
  prefetch: (path: string) => void;
  preload: (path: string) => void;
  navigateInstant: (path: string, options?: NavigateOptions) => void;
  isPrefetching: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PREFETCH_CACHE_MAX_SIZE = 10;
const PREFETCH_TIMEOUT = 5000;
const PRELOAD_DELAY = 100;

// ============================================================================
// CONTEXT
// ============================================================================

const InstantRouterContext = createContext<InstantRouterContextValue>({
  prefetch: () => {},
  preload: () => {},
  navigateInstant: () => {},
  isPrefetching: false,
});

export const useInstantRouter = () => useContext(InstantRouterContext);

// ============================================================================
// PREFETCH ENGINE
// ============================================================================

class PrefetchEngine {
  private cache: PrefetchCache = {};
  private routeMap: Map<string, RoutePrefetchConfig> = new Map();
  private observer: IntersectionObserver | null = null;
  private idleCallbackId: number | null = null;

  registerRoute(config: RoutePrefetchConfig) {
    this.routeMap.set(config.path, config);
  }

  private cleanupCache() {
    const entries = Object.entries(this.cache);
    if (entries.length <= PREFETCH_CACHE_MAX_SIZE) return;

    const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sorted.slice(0, entries.length - PREFETCH_CACHE_MAX_SIZE);
    toRemove.forEach(([key]) => delete this.cache[key]);
  }

  async prefetch(path: string): Promise<void> {
    if (this.cache[path]?.loaded) return;
    
    const config = this.routeMap.get(path);
    if (!config) return;

    if (this.cache[path]?.promise) {
      return this.cache[path].promise!;
    }

    const promise = this.loadComponent(path, config);
    this.cache[path] = {
      ...this.cache[path],
      promise,
      timestamp: Date.now(),
    };

    return promise;
  }

  private async loadComponent(path: string, config: RoutePrefetchConfig): Promise<void> {
    try {
      const module = await config.component();
      this.cache[path] = {
        component: module.default,
        promise: null,
        loaded: true,
        timestamp: Date.now(),
      };
      this.cleanupCache();
    } catch (error) {
      console.error(`Failed to prefetch ${path}:`, error);
      delete this.cache[path];
    }
  }

  preloadOnHover(path: string) {
    const config = this.routeMap.get(path);
    if (!config) return;

    const delay = config.preloadDelay ?? PRELOAD_DELAY;
    
    if ('requestIdleCallback' in window) {
      this.idleCallbackId = window.requestIdleCallback(() => {
        setTimeout(() => this.prefetch(path), delay);
      }, { timeout: 1000 });
    } else {
      setTimeout(() => this.prefetch(path), delay);
    }
  }

  cancelPreload() {
    if (this.idleCallbackId !== null) {
      window.cancelIdleCallback?.(this.idleCallbackId);
      this.idleCallbackId = null;
    }
  }

  getComponent(path: string): ComponentType | null {
    return this.cache[path]?.component ?? null;
  }

  isReady(path: string): boolean {
    return this.cache[path]?.loaded ?? false;
  }

  setupVisiblePrefetch(selector: string = '[data-prefetch]') {
    if (this.observer) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const path = entry.target.getAttribute('data-prefetch');
            if (path) this.prefetch(path);
          }
        });
      },
      { rootMargin: '100px' }
    );

    document.querySelectorAll(selector).forEach((el) => {
      this.observer?.observe(el);
    });
  }
}

const prefetchEngine = new PrefetchEngine();

// ============================================================================
// PROVIDER
// ============================================================================

export const InstantRouterProvider: React.FC<{
  children: React.ReactNode;
  routes: RoutePrefetchConfig[];
}> = ({ children, routes }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPrefetching, setIsPrefetching] = React.useState(false);
  const navigationStartTime = useRef<number>(0);

  useEffect(() => {
    routes.forEach((route) => prefetchEngine.registerRoute(route));
  }, [routes]);

  useEffect(() => {
    const currentPath = location.pathname;
    const currentRoute = routes.find(r => r.path === currentPath);
    
    if (currentRoute?.priority === 'immediate') {
      const relatedRoutes = routes.filter(r => 
        r.path !== currentPath && 
        r.path.startsWith(currentPath.split('/')[1])
      );
      
      relatedRoutes.forEach((route, index) => {
        setTimeout(() => prefetchEngine.prefetch(route.path), index * 50);
      });
    }
  }, [location.pathname, routes]);

  const prefetch = useCallback((path: string) => {
    prefetchEngine.prefetch(path);
  }, []);

  const preload = useCallback((path: string) => {
    prefetchEngine.preloadOnHover(path);
  }, []);

  const navigateInstant = useCallback((path: string, options?: NavigateOptions) => {
    navigationStartTime.current = performance.now();
    
    if (prefetchEngine.isReady(path)) {
      navigate(path, options);
      const duration = performance.now() - navigationStartTime.current;
      console.log(`[InstantRouter] Navigation to ${path}: ${duration.toFixed(2)}ms`);
    } else {
      setIsPrefetching(true);
      prefetchEngine.prefetch(path).then(() => {
        navigate(path, options);
        setIsPrefetching(false);
        const duration = performance.now() - navigationStartTime.current;
        console.log(`[InstantRouter] Navigation to ${path} (with prefetch): ${duration.toFixed(2)}ms`);
      });
    }
  }, [navigate]);

  return (
    <InstantRouterContext.Provider value={{ prefetch, preload, navigateInstant, isPrefetching }}>
      {children}
    </InstantRouterContext.Provider>
  );
};

// ============================================================================
// PREFETCH LINK COMPONENT
// ============================================================================

export const PrefetchLink: React.FC<{
  to: string;
  children: React.ReactNode;
  className?: string;
  preloadDelay?: number;
}> = ({ to, children, className, preloadDelay = 100 }) => {
  const { preload, navigateInstant } = useInstantRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      preload(to);
    }, preloadDelay);
  }, [preload, to, preloadDelay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigateInstant(to);
  }, [navigateInstant, to]);

  return (
    <a
      href={to}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-prefetch={to}
      className={className}
    >
      {children}
    </a>
  );
};

// ============================================================================
// PAGE TRANSITION
// ============================================================================

export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(timer);
  }, [location.pathname]);

  return (
    <div
      className={`transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ 
        willChange: 'opacity',
        contain: 'layout style paint',
      }}
    >
      {children}
    </div>
  );
};
