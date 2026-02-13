import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--z-bg-3)] border border-[var(--z-border-2)] rounded-lg p-3 shadow-lg min-w-[160px]">
        <p className="text-[var(--z-text-1)] text-xs font-semibold mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[11px] text-[var(--z-text-3)]">
                {entry.name}
              </span>
            </div>
            <span className="text-[12px] font-semibold text-[var(--z-text-1)] font-mono-financial">
              ${entry.value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * RevenueTrendChart — 90-day revenue trend with 7-day moving average overlay.
 *
 * Props:
 * - transactions: Array of revenue transactions with transaction_date and amount
 */
export default function RevenueTrendChart({ transactions = [] }) {
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const start = subDays(startOfDay(now), 89);
    const end = startOfDay(now);

    // Create a map of daily revenue
    const dailyMap = {};
    transactions.forEach((t) => {
      const dateKey = format(
        startOfDay(new Date(t.transaction_date)),
        "yyyy-MM-dd"
      );
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + (t.amount || 0);
    });

    // Fill all 90 days
    const days = eachDayOfInterval({ start, end });
    const rawData = days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return {
        date: format(day, "MMM d"),
        dateRaw: key,
        revenue: dailyMap[key] || 0,
      };
    });

    // Calculate 7-day moving average
    return rawData.map((point, idx) => {
      const windowStart = Math.max(0, idx - 6);
      const window = rawData.slice(windowStart, idx + 1);
      const avg = window.reduce((sum, p) => sum + p.revenue, 0) / window.length;
      return {
        ...point,
        movingAvg: Math.round(avg * 100) / 100,
      };
    });
  }, [transactions]);

  return (
    <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-[var(--z-text-1)] mb-0.5">
            Revenue Trend
          </h3>
          <p className="text-[13px] text-[var(--z-text-3)]">
            Last 90 days with 7-day average
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-[#32B8C6]" />
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5 text-[var(--z-text-3)]" />
          </div>
          <p className="text-sm text-[var(--z-text-2)] mb-1">
            No revenue data yet
          </p>
          <p className="text-[12px] text-[var(--z-text-3)]">
            Revenue data will appear after your first sync
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--z-border-1)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--z-text-3)", fontSize: 11 }}
              stroke="var(--z-border-1)"
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "var(--z-text-3)", fontSize: 11 }}
              stroke="var(--z-border-1)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                color: "var(--z-text-3)",
                paddingTop: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Daily Revenue"
              stroke="#32B8C6"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: "#32B8C6", stroke: "var(--z-bg-2)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="movingAvg"
              name="7-Day Average"
              stroke="#E68161"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3, fill: "#E68161", stroke: "var(--z-bg-2)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}