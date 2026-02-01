import React from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function MRRTrendChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect rounded-lg px-4 py-2.5 border border-white/10">
          <p className="font-semibold text-white text-sm">{label}</p>
          <p className="text-xs text-zteal-400 font-medium">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="card-modern rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-6">MRR Trend</h3>
        <div className="h-64 flex items-center justify-center text-white/30 text-sm">
          No trend data available
        </div>
      </div>
    );
  }

  return (
    <div className="card-modern rounded-xl p-6 group">
      <h3 className="text-base font-semibold text-white mb-1">MRR Trend</h3>
      <p className="text-xs text-white/40 mb-6">Last 3 months performance</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#mrrGradient)"
              dot={{ fill: '#6366F1', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#818CF8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}