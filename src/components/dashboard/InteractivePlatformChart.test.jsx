import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import InteractivePlatformChart from './InteractivePlatformChart';
import '@testing-library/jest-dom';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => {
      const { initial, animate, exit, ...validProps } = props;
      return <div className={className} {...validProps}>{children}</div>;
    },
  },
}));

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
}));

describe('InteractivePlatformChart', () => {
  it('renders "No platform data available" when transactions list is empty', () => {
    render(<InteractivePlatformChart transactions={[]} />);
    expect(screen.getByText('No platform data available')).toBeInTheDocument();
  });

  it('renders charts when transactions are provided', () => {
    const transactions = [
      { platform: 'youtube', amount: 100 },
      { platform: 'patreon', amount: 200 },
    ];
    render(<InteractivePlatformChart transactions={transactions} />);
    expect(screen.getByText('Platform Performance')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Patreon')).toBeInTheDocument();
    // Check for chart container
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
