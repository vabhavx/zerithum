import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const PLATFORM_COLORS = {
  youtube: "#FF0000",
  patreon: "#FF424D",
  stripe: "#635BFF",
  gumroad: "#FF90E8"
};

const PLATFORM_LABELS = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad"
};

export default function RevenueBreakdownChart({ data, concentrationRisk }) {
  const chartData = Object.entries(data).map(([platform, value]) => ({
    name: PLATFORM_LABELS[platform] || platform,
    value: value,
    platform: platform
  })).filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="clay-sm rounded-xl px-4 py-3">
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-sm text-slate-600">
            ${item.value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => {
          const percentage = ((entry.payload.value / total) * 100).toFixed(1);
          const isRisky = concentrationRisk && entry.payload.platform === concentrationRisk.platform;
          return (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                isRisky ? "bg-amber-50 border border-amber-200" : "bg-slate-50"
              )}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-slate-700">
                {entry.value} · {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="clay rounded-3xl p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Breakdown</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          No revenue data available
        </div>
      </div>
    );
  }

  return (
    <div className="clay rounded-3xl p-6 lg:p-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Revenue Breakdown</h3>
      <p className="text-sm text-slate-500 mb-6">Distribution across platforms</p>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PLATFORM_COLORS[entry.platform] || "#94a3b8"}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}