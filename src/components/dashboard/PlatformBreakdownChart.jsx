import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const PLATFORM_COLORS = {
  youtube: '#FF0000',
  patreon: '#FF424D',
  stripe: '#635BFF',
  gumroad: '#FF90E8',
  instagram: '#E4405F',
  tiktok: '#000000'
};

const PLATFORM_NAMES = {
  youtube: 'YouTube',
  patreon: 'Patreon',
  stripe: 'Stripe',
  gumroad: 'Gumroad',
  instagram: 'Instagram',
  tiktok: 'TikTok'
};

export default function PlatformBreakdownChart({ data }) {
  const chartData = data
    .filter(item => item.amount > 0)
    .map(item => ({
      name: PLATFORM_NAMES[item.platform] || item.platform,
      value: item.amount,
      platform: item.platform
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-white/60 text-xs">
            ${data.value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-modern rounded-xl p-8 text-center"
      >
        <p className="text-white/40">No revenue data to display</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern rounded-xl p-6"
    >
      <h3 className="text-lg font-bold text-white mb-6">Revenue by Platform</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.platform] || '#6366F1'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {chartData.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{item.name}</p>
                <p className="text-white/40 text-xs">{percentage}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}