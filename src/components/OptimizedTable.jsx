/**
 * Optimized Table Component with Virtualization
 * High-performance table for large datasets
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Virtual List Hook
// ============================================================================

function useVirtualList({ items, itemHeight, overscan = 5, containerRef }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });

    resizeObserver.observe(containerRef.current);
    setContainerHeight(containerRef.current.clientHeight);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  const virtualItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(items.length, startIndex + visibleCount + overscan);

    return {
      items: items.slice(start, end).map((item, index) => ({
        data: item,
        index: start + index,
        style: {
          position: 'absolute',
          top: (start + index) * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      })),
      startIndex: start,
      totalHeight: items.length * itemHeight,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return { virtualItems, onScroll, totalHeight: virtualItems.totalHeight };
}

// ============================================================================
// Optimized Table Component
// ============================================================================

export function OptimizedTable({
  data = [],
  columns = [],
  keyExtractor,
  rowHeight = 52,
  maxHeight = 600,
  sortable = true,
  onRowClick,
  selectedRows = new Set(),
  onSelectionChange,
  emptyMessage = 'No data available',
  loading = false,
  className,
  enableVirtualization = true,
}) {
  const containerRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState(() => 
    columns.filter(col => !col.hidden).map(col => col.key)
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      const aVal = column?.sortAccessor ? column.sortAccessor(a) : a[sortConfig.key];
      const bVal = column?.sortAccessor ? column.sortAccessor(b) : b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, columns]);

  // Handle sort
  const handleSort = useCallback((key) => {
    if (!sortable) return;
    
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, [sortable]);

  // Virtual list for large datasets
  const { virtualItems, onScroll, totalHeight } = useVirtualList({
    items: sortedData,
    itemHeight: rowHeight,
    overscan: 5,
    containerRef,
  });

  // Toggle row selection
  const toggleSelection = useCallback((id) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  }, [selectedRows, onSelectionChange]);

  // Select all
  const selectAll = useCallback(() => {
    if (!onSelectionChange) return;
    
    if (selectedRows.size === sortedData.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(sortedData.map(keyExtractor)));
    }
  }, [sortedData, selectedRows, onSelectionChange, keyExtractor]);

  const visibleColumnDefs = columns.filter(col => visibleColumns.includes(col.key));
  const allSelected = sortedData.length > 0 && selectedRows.size === sortedData.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < sortedData.length;

  return (
    <div className={cn("border border-gray-200 rounded-lg overflow-hidden bg-white", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {onSelectionChange && (
            <div className="w-10 flex items-center justify-center py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected; }}
                onChange={selectAll}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          )}
          {visibleColumnDefs.map(column => (
            <div
              key={column.key}
              className={cn(
                "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                sortable && column.sortable !== false && "cursor-pointer hover:bg-gray-100 select-none",
                column.className
              )}
              style={{ width: column.width, flex: column.flex }}
              onClick={() => column.sortable !== false && handleSort(column.key)}
            >
              <div className="flex items-center gap-1">
                {column.title}
                {sortable && column.sortable !== false && (
                  <span className="text-gray-400">
                    {sortConfig.key === column.key ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full mx-auto mb-4" />
            Loading...
          </div>
        ) : sortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{emptyMessage}</div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            {virtualItems.items.map(({ data: item, index, style }) => {
              const key = keyExtractor(item, index);
              const isSelected = selectedRows.has(key);
              
              return (
                <motion.div
                  key={key}
                  layoutId={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={style}
                  className={cn(
                    "flex items-center hover:bg-gray-50 transition-colors",
                    isSelected && "bg-indigo-50 hover:bg-indigo-100",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {onSelectionChange && (
                    <div 
                      className="w-10 flex items-center justify-center py-3"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(key)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  {visibleColumnDefs.map(column => (
                    <div
                      key={column.key}
                      className={cn("px-4 py-3 text-sm", column.cellClassName)}
                      style={{ width: column.width, flex: column.flex }}
                    >
                      {column.render 
                        ? column.render(item[column.key], item, index)
                        : item[column.key]
                      }
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedRows.size > 0 && (
        <div className="border-t border-gray-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {selectedRows.size} row(s) selected
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Paginated Table
// ============================================================================

export function PaginatedTable({
  data,
  pageSize = 20,
  ...tableProps
}) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const pages = useMemo(() => {
    const result = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4">
      <OptimizedTable data={paginatedData} {...tableProps} />
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length} results
          </p>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {pages[0] > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-8 h-8 rounded hover:bg-gray-100 text-sm"
                >
                  1
                </button>
                {pages[0] > 2 && <span className="px-2">...</span>}
              </>
            )}
            
            {pages.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded text-sm transition-colors",
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100"
                )}
              >
                {page}
              </button>
            ))}
            
            {pages[pages.length - 1] < totalPages && (
              <>
                {pages[pages.length - 1] < totalPages - 1 && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 rounded hover:bg-gray-100 text-sm"
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
