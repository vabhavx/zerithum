import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="text-foreground text-sm font-semibold mb-1">{payload[0].payload.name}</p>
        <p className="text-emerald-400 text-xs">
          ${payload[0].value.toFixed(0)} ({payload[0].payload.percentage}%)
        </p>
        <p className="text-foreground/40 text-xs mt-1">
          {payload[0].payload.count} transactions
        </p>
      </div>
    );
  }
  return null;
};

export default function InteractivePlatformChart({ transactions }) {
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'

  const platformData = useMemo(() => {
    const platformMap = {};
    const platformCount = {};

    transactions.forEach(t => {
      const platform = t.platform;
      platformMap[platform] = (platformMap[platform] || 0) + (t.amount || 0);
      platformCount[platform] = (platformCount[platform] || 0) + 1;
    });

    const total = Object.values(platformMap).reduce((sum, val) => sum + val, 0);

    return Object.entries(platformMap)
      .map(([platform, amount]) => ({
        platform,
        name: PLATFORM_NAMES[platform] || platform,
        amount,
        count: platformCount[platform],
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
        color: PLATFORM_COLORS[platform] || '#6366F1'
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalRevenue = platformData.reduce((sum, p) => sum + p.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border bg-card rounded-none p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-border flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Platform Performance</h3>
            <p className="text-xs text-foreground/40">Revenue distribution by source</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChartType('bar')}
            className={`h-8 px-3 ${chartType === 'bar' ? 'bg-muted text-foreground' : 'text-foreground/40'}`}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChartType('pie')}
            className={`h-8 px-3 ${chartType === 'pie' ? 'bg-muted text-foreground' : 'text-foreground/40'}`}
          >
            <PieChartIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {platformData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-foreground/40 text-sm">
          No platform data available
        </div>
      ) : (
        <>
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="grid grid-cols-2 gap-3 mt-6">
            {platformData.slice(0, 4).map((platform) => (
              <div key={platform.platform} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: platform.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{platform.name}</p>
                  <p className="text-foreground/40 text-xs">{platform.count} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-sm font-semibold">${platform.amount.toFixed(0)}</p>
                  <p className="text-foreground/40 text-xs">{platform.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}