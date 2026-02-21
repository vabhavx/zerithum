import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

// ── Custom tooltip ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[var(--z-bg-3)] border border-[var(--z-border-2)] rounded-lg p-3 shadow-lg min-w-[160px]">
      <p className="text-[var(--z-text-1)] text-[12px] font-semibold mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-[var(--z-text-3)]">{entry.name}</span>
          </div>
          <span className="text-[12px] font-semibold text-[var(--z-text-1)] font-mono-financial tabular-nums">
            ${Number(entry.value).toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Empty state ─────────────────────────────────────────────────────────────

function ChartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center mb-4">
        <BarChart3 className="w-5 h-5 text-[var(--z-text-3)]" />
      </div>
      <p className="text-sm font-medium text-[var(--z-text-2)] mb-1">
        No revenue data yet
      </p>
      <p className="text-[12px] text-[var(--z-text-3)] max-w-xs">
        Revenue data will appear here after your first successful platform sync.
      </p>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

/**
 * RevenueTrendChart — 90-day daily revenue trend.
 * Single teal line. Monochrome grid. Plain-language explanation text.
 *
 * Props:
 *  - transactions: Array of revenue transactions { transaction_date, amount }
 */
export default function RevenueTrendChart({ transactions = [] }) {
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const start = subDays(startOfDay(now), 89);
    const end = startOfDay(now);

    // Sum by day
    const dailyMap = {};
    transactions.forEach((t) => {
      const key = format(startOfDay(new Date(t.transaction_date)), "yyyy-MM-dd");
      dailyMap[key] = (dailyMap[key] || 0) + (t.amount || 0);
    });

    // Fill all 90 days
    return eachDayOfInterval({ start, end }).map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return {
        date: format(day, "MMM d"),
        revenue: dailyMap[key] || 0,
      };
    });
  }, [transactions]);

  // Y-axis tick formatter
  const formatYAxis = (val) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--z-text-1)] mb-0.5">
            What changed
          </h3>
          <p className="text-[12px] text-[var(--z-text-3)]">
            Daily earnings across all connected platforms — last 90 days
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-[#32B8C6]" />
        </div>
      </div>

      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260} className="mt-5">
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(167,169,169,0.55)", fontSize: 11 }}
                stroke="rgba(255,255,255,0.05)"
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: "rgba(167,169,169,0.55)", fontSize: 11 }}
                stroke="transparent"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Daily Revenue"
                stroke="#32B8C6"
                strokeWidth={1.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#32B8C6",
                  stroke: "var(--z-bg-2)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Plain-language explanation */}
          <p className="text-[11px] text-[var(--z-text-3)] mt-3 leading-relaxed border-t border-[var(--z-border-1)] pt-3">
            This chart shows your gross daily earnings from all connected platforms for the last 90 days.
            Fees are not deducted here — see the table above for net figures.
            Revenue calculated from synced transactions only.
          </p>
        </>
      )}
    </div>
  );
}