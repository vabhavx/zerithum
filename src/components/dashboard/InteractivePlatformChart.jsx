import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLATFORM_COLORS = { youtube: '#DC2626', patreon: '#F87171', stripe: '#6366F1', gumroad: '#EC4899', instagram: '#E11D48', tiktok: '#111827' };
const PLATFORM_NAMES = { youtube: 'YouTube', patreon: 'Patreon', stripe: 'Stripe', gumroad: 'Gumroad', instagram: 'Instagram', tiktok: 'TikTok' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-gray-900 text-sm font-semibold mb-1">{payload[0].payload.name}</p>
        <p className="text-gray-700 text-xs">${payload[0].value.toFixed(0)} ({payload[0].payload.percentage}%)</p>
        <p className="text-gray-400 text-xs mt-1">{payload[0].payload.count} transactions</p>
      </div>
    );
  }
  return null;
};

export default function InteractivePlatformChart({ transactions }) {
  const [chartType, setChartType] = useState('bar');

  const platformData = useMemo(() => {
    const platformMap = {}, platformCount = {};
    transactions.forEach(t => { platformMap[t.platform] = (platformMap[t.platform] || 0) + (t.amount || 0); platformCount[t.platform] = (platformCount[t.platform] || 0) + 1; });
    const total = Object.values(platformMap).reduce((s, v) => s + v, 0);
    return Object.entries(platformMap).map(([p, a]) => ({ platform: p, name: PLATFORM_NAMES[p] || p, amount: a, count: platformCount[p], percentage: total > 0 ? ((a / total) * 100).toFixed(1) : 0, color: PLATFORM_COLORS[p] || '#6366F1' })).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center"><Activity className="w-5 h-5 text-gray-500" /></div>
          <div><h3 className="text-sm font-semibold text-gray-900">Platform Performance</h3><p className="text-xs text-gray-400">Revenue distribution by source</p></div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setChartType('bar')} className={`h-8 px-3 ${chartType === 'bar' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><BarChart3 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setChartType('pie')} className={`h-8 px-3 ${chartType === 'pie' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><PieChartIcon className="w-4 h-4" /></Button>
        </div>
      </div>
      {platformData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No platform data available</div>
      ) : (
        <>
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} stroke="#E5E7EB" />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} stroke="#E5E7EB" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>{platformData.map((e, i) => (<Cell key={`cell-${i}`} fill={e.color} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={platformData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name} ${percentage}%`} outerRadius={100} dataKey="amount">{platformData.map((e, i) => (<Cell key={`cell-${i}`} fill={e.color} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {platformData.slice(0, 4).map((p) => (
              <div key={p.platform} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0"><p className="text-gray-900 text-sm font-medium truncate">{p.name}</p><p className="text-gray-400 text-xs">{p.count} transactions</p></div>
                <div className="text-right"><p className="text-gray-900 text-sm font-semibold">${p.amount.toFixed(0)}</p><p className="text-gray-400 text-xs">{p.percentage}%</p></div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}