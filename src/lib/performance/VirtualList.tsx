/**
 * Virtual List - Render only what's visible
 * Enterprise-grade virtualization for massive datasets
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
}

interface VirtualListRef {
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getVisibleRange: () => { start: number; end: number };
}

// ============================================================================
// VIRTUAL LIST COMPONENT
// ============================================================================

export const VirtualList = forwardRef<VirtualListRef, VirtualListProps<any>>(
  <T,>(
    {
      items,
      itemHeight,
      renderItem,
      overscan = 5,
      className = '',
      onEndReached,
      endReachedThreshold = 200,
      header,
      footer,
      emptyComponent,
      keyExtractor = (_, index) => String(index),
    }: VirtualListProps<T>,
    ref: React.Ref<VirtualListRef>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const endReachedCalled = useRef(false);
    const itemCache = useRef<Map<number, React.ReactNode>>(new Map());

    // Update container height
    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        setContainerHeight(entries[0].contentRect.height);
      });

      resizeObserver.observe(containerRef.current);
      setContainerHeight(containerRef.current.clientHeight);

      return () => resizeObserver.disconnect();
    }, []);

    // Calculate visible range
    const { virtualItems, totalHeight, startIndex, endIndex } = useMemo(() => {
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      
      const overscanStart = Math.max(0, start - overscan);
      const overscanEnd = Math.min(items.length, start + visibleCount + overscan);

      const virtualItems = [];
      for (let i = overscanStart; i < overscanEnd; i++) {
        virtualItems.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        });
      }

      return {
        virtualItems,
        totalHeight: items.length * itemHeight,
        startIndex: overscanStart,
        endIndex: overscanEnd,
      };
    }, [items, itemHeight, scrollTop, containerHeight, overscan]);

    // Clear cache when items change significantly
    useEffect(() => {
      itemCache.current.clear();
    }, [items.length]);

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);

      // Check for end reached
      if (onEndReached && !endReachedCalled.current) {
        const scrollBottom = newScrollTop + containerHeight;
        const threshold = totalHeight - endReachedThreshold;
        
        if (scrollBottom >= threshold) {
          endReachedCalled.current = true;
          onEndReached();
        }
      }
    }, [containerHeight, totalHeight, endReachedThreshold, onEndReached]);

    // Reset end reached when items change
    useEffect(() => {
      endReachedCalled.current = false;
    }, [items.length]);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number, behavior: ScrollBehavior = 'smooth') => {
        containerRef.current?.scrollTo({
          top: index * itemHeight,
          behavior,
        });
      },
      scrollToTop: () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      },
      scrollToBottom: () => {
        containerRef.current?.scrollTo({ top: totalHeight, behavior: 'smooth' });
      },
      getVisibleRange: () => ({ start: startIndex, end: endIndex }),
    }), [itemHeight, totalHeight, startIndex, endIndex]);

    // Render item with caching
    const renderVirtualItem = useCallback((virtualItem: typeof virtualItems[0]) => {
      const cacheKey = virtualItem.index;
      
      if (!itemCache.current.has(cacheKey)) {
        itemCache.current.set(
          cacheKey,
          renderItem(virtualItem.item, virtualItem.index, virtualItem.style)
        );
      }

      return (
        <div key={keyExtractor(virtualItem.item, virtualItem.index)} style={virtualItem.style}>
          {itemCache.current.get(cacheKey)}
        </div>
      );
    }, [renderItem, keyExtractor]);

    if (items.length === 0 && emptyComponent) {
      return (
        <div ref={containerRef} className={`overflow-auto ${className}`}>
          {header}
          {emptyComponent}
          {footer}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`overflow-auto ${className}`}
        style={{ contain: 'strict' }}
      >
        {header}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map(renderVirtualItem)}
        </div>
        {footer}
      </div>
    );
  }
);

VirtualList.displayName = 'VirtualList';

// ============================================================================
// WINDOW SCROLL VIRTUAL LIST (for full-page lists)
// ============================================================================

export const WindowVirtualList = forwardRef<VirtualListRef, VirtualListProps<any>>(
  <T,>(props: VirtualListProps<T>, ref: React.Ref<VirtualListRef>) => {
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <VirtualList
        ref={ref}
        {...props}
        // Override container height with window height
      />
    );
  }
);

WindowVirtualList.displayName = 'WindowVirtualList';

// ============================================================================
// DYNAMIC HEIGHT VIRTUAL LIST (for variable item heights)
// ============================================================================

interface DynamicVirtualListProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  estimateHeight: (item: T, index: number) => number;
  measureRef?: React.RefObject<HTMLDivElement>;
}

export const DynamicVirtualList = forwardRef<VirtualListRef, DynamicVirtualListProps<any>>(
  <T,>(
    {
      items,
      estimateHeight,
      renderItem,
      overscan = 5,
      className = '',
      keyExtractor = (_, index) => String(index),
    }: DynamicVirtualListProps<T>,
    ref: React.Ref<VirtualListRef>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const measuredHeights = useRef<Map<number, number>>(new Map());
    const itemElements = useRef<Map<number, HTMLElement>>(new Map());

    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        setContainerHeight(entries[0].contentRect.height);
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    // Calculate positions based on measured/estimated heights
    const { virtualItems, totalHeight } = useMemo(() => {
      const positions = [];
      let currentPosition = 0;

      for (let i = 0; i < items.length; i++) {
        const measured = measuredHeights.current.get(i);
        const height = measured ?? estimateHeight(items[i], i);
        
        positions.push({
          index: i,
          top: currentPosition,
          height,
        });
        
        currentPosition += height;
      }

      // Find visible items
      const startIdx = Math.max(0, positions.findIndex(p => p.top + p.height > scrollTop) - overscan);
      const endIdx = Math.min(
        positions.length,
        positions.findIndex(p => p.top > scrollTop + containerHeight) + overscan
      );

      const virtualItems = positions.slice(startIdx, endIdx).map(pos => ({
        index: pos.index,
        item: items[pos.index],
        style: {
          position: 'absolute' as const,
          top: pos.top,
          left: 0,
          right: 0,
        },
      }));

      return { virtualItems, totalHeight: currentPosition };
    }, [items, estimateHeight, scrollTop, containerHeight, overscan]);

    // Measure actual heights after render
    useEffect(() => {
      itemElements.current.forEach((el, index) => {
        const height = el.getBoundingClientRect().height;
        if (height > 0 && measuredHeights.current.get(index) !== height) {
          measuredHeights.current.set(index, height);
        }
      });
    });

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number, behavior: ScrollBehavior = 'smooth') => {
        // Calculate position
        let position = 0;
        for (let i = 0; i < index; i++) {
          position += measuredHeights.current.get(i) ?? estimateHeight(items[i], i);
        }
        window.scrollTo({ top: position, behavior });
      },
      scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      scrollToBottom: () => window.scrollTo({ top: totalHeight, behavior: 'smooth' }),
      getVisibleRange: () => ({ 
        start: virtualItems[0]?.index ?? 0, 
        end: virtualItems[virtualItems.length - 1]?.index ?? 0 
      }),
    }), [items, estimateHeight, totalHeight, virtualItems]);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`overflow-auto ${className}`}
        style={{ contain: 'strict' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map((virtualItem) => (
            <div
              key={keyExtractor(virtualItem.item, virtualItem.index)}
              ref={(el) => {
                if (el) itemElements.current.set(virtualItem.index, el);
              }}
              style={virtualItem.style}
            >
              {renderItem(virtualItem.item, virtualItem.index, virtualItem.style)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DynamicVirtualList.displayName = 'DynamicVirtualList';
