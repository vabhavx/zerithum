/**
 * Optimized Chart Component
 * High-performance charts with virtualization and progressive rendering
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// ============================================================================
// Data Sampling for Large Datasets
// ============================================================================

function lttbDownsample(data, threshold) {
  if (data.length <= threshold) return data;

  const sampled = [data[0]];
  const bucketSize = (data.length - 2) / (threshold - 2);
  let a = 0;
  let maxAreaPoint;
  let maxArea;
  let area;
  let nextA;

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < data.length ? avgRangeEnd : data.length;
    let avgRangeLength = avgRangeEnd - avgRangeStart;

    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += avgRangeStart;
      avgY += data[avgRangeStart].value;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    let rangeOffs = Math.floor((i + 0) * bucketSize) + 1;
    let rangeTo = Math.floor((i + 1) * bucketSize) + 1;
    const pointAX = a;
    const pointAY = data[a].value;

    maxArea = area = -1;

    for (; rangeOffs < rangeTo; rangeOffs++) {
      area = Math.abs(
        (pointAX - avgX) * (data[rangeOffs].value - pointAY) -
        (pointAX - rangeOffs) * (avgY - pointAY)
      ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[rangeOffs];
        nextA = rangeOffs;
      }
    }

    sampled.push(maxAreaPoint);
    a = nextA;
  }

  sampled.push(data[data.length - 1]);
  return sampled;
}

// ============================================================================
// Optimized Tooltip
// ============================================================================

const ChartTooltip = React.memo(({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-gray-500 text-xs mb-2">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
});

ChartTooltip.displayName = 'ChartTooltip';

// ============================================================================
// Optimized Area Chart
// ============================================================================

export function OptimizedAreaChart({
  data = [],
  dataKey = 'value',
  xAxisKey = 'date',
  name = 'Value',
  color = '#4F46E5',
  gradient = true,
  showGrid = true,
  showDots = false,
  height = 300,
  maxDataPoints = 500,
  formatValue = (v) => `$${v}`,
  formatLabel = (l) => l,
  className,
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy rendering
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Downsample data if needed
  const processedData = useMemo(() => {
    if (data.length <= maxDataPoints) return data;
    return lttbDownsample(data, maxDataPoints);
  }, [data, maxDataPoints]);

  // Memoized gradient
  const gradientId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} style={{ height }} className={cn("bg-gray-50 animate-pulse rounded-lg", className)} />
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {gradient && (
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          )}
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatLabel}
            stroke="#E5E7EB"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            stroke="#E5E7EB"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={formatValue}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            content={<ChartTooltip formatter={formatValue} labelFormatter={formatLabel} />}
            cursor={{ stroke: '#C7D2FE', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={color}
            strokeWidth={2}
            fill={gradient ? `url(#${gradientId})` : color}
            dot={showDots}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Optimized Bar Chart
// ============================================================================

export function OptimizedBarChart({
  data = [],
  dataKeys = ['value'],
  xAxisKey = 'name',
  colors = ['#4F46E5', '#10B981', '#F59E0B'],
  showGrid = true,
  height = 300,
  layout = 'vertical',
  stacked = false,
  formatValue = (v) => `$${v}`,
  formatLabel = (l) => l,
  className,
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} style={{ height }} className={cn("bg-gray-50 animate-pulse rounded-lg", className)} />
    );
  }

  const ChartComponent = layout === 'horizontal' ? BarChart : BarChart;

  return (
    <div ref={containerRef} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} layout={layout} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          )}
          <XAxis
            type={layout === 'horizontal' ? 'number' : 'category'}
            dataKey={layout === 'horizontal' ? undefined : xAxisKey}
            tickFormatter={layout === 'horizontal' ? formatValue : formatLabel}
            stroke="#E5E7EB"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type={layout === 'horizontal' ? 'category' : 'number'}
            dataKey={layout === 'horizontal' ? xAxisKey : undefined}
            tickFormatter={layout === 'horizontal' ? formatLabel : formatValue}
            stroke="#E5E7EB"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            content={<ChartTooltip formatter={formatValue} labelFormatter={formatLabel} />}
            cursor={{ fill: '#F3F4F6' }}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
              animationDuration={500}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Optimized Pie Chart
// ============================================================================

export function OptimizedPieChart({
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  colors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6'],
  height = 300,
  innerRadius = 0,
  outerRadius = '80%',
  showTooltip = true,
  formatValue = (v) => v,
  className,
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const total = useMemo(() => 
    data.reduce((sum, item) => sum + (item[valueKey] || 0), 0),
    [data, valueKey]
  );

  if (!isVisible) {
    return (
      <div ref={containerRef} style={{ height }} className={cn("bg-gray-50 animate-pulse rounded-lg", className)} />
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            animationBegin={0}
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke={activeIndex === index ? '#fff' : 'transparent'}
                strokeWidth={activeIndex === index ? 2 : 0}
              />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0];
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-500">
                      {formatValue(item.value)} ({percentage}%)
                    </p>
                  </div>
                );
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Sparkline Component
// ============================================================================

export function Sparkline({
  data = [],
  width = 120,
  height = 40,
  color = '#4F46E5',
  strokeWidth = 2,
  showArea = true,
  className,
}) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }));

  const pathD = points.reduce((acc, point, index) => {
    return index === 0
      ? `M ${point.x} ${point.y}`
      : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = showArea
    ? `${pathD} L ${width} ${height} L 0 ${height} Z`
    : '';

  return (
    <svg width={width} height={height} className={className}>
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showArea && (
        <path d={areaD} fill="url(#sparkline-gradient)" />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
