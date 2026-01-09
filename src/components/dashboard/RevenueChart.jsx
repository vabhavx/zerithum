import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function RevenueChart({ data }) {
  const COLORS = {
    youtube: "#FF0000",
    patreon: "#FF424D",
    gumroad: "#FF90E8",
    stripe: "#635BFF",
    instagram: "#E1306C",
    tiktok: "#000000",
  };

  const chartData = data.map((item) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.amount,
    color: COLORS[item.platform],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FFFFFE] p-3 rounded-lg shadow-lg border border-[#5E5240]/10">
          <p className="font-semibold text-[#5E5240]">{payload[0].name}</p>
          <p className="text-[#208D9E] font-bold">${payload[0].value.toLocaleString()}</p>
          <p className="text-xs text-[#5E5240]/60">
            {((payload[0].value / data.reduce((sum, item) => sum + item.amount, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="clay-card">
      <h3 className="text-lg font-bold text-[#5E5240] mb-4">Revenue by Platform</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
            <span className="text-xs text-[#5E5240]/80">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}