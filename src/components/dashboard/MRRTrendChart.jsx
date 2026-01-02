import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function MRRTrendChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="clay-sm rounded-xl px-4 py-3">
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-sm text-violet-600 font-medium">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="clay rounded-3xl p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">MRR Trend</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          No trend data available
        </div>
      </div>
    );
  }

  return (
    <div className="clay rounded-3xl p-6 lg:p-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">MRR Trend</h3>
      <p className="text-sm text-slate-500 mb-6">Last 3 months performance</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#8b5cf6"
              strokeWidth={3}
              fill="url(#mrrGradient)"
              dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#7c3aed' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}