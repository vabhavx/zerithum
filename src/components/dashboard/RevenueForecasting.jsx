import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { format, addMonths, startOfMonth } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-gray-900 text-sm font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (<p key={index} className="text-xs" style={{ color: entry.color }}>{entry.name}: ${entry.value.toFixed(0)}</p>))}
      </div>
    );
  }
  return null;
};

export default function RevenueForecasting({ transactions }) {
  const forecastData = useMemo(() => {
    if (!transactions.length) return [];
    const monthlyRevenue = {};
    transactions.forEach(t => { const mk = format(startOfMonth(new Date(t.transaction_date)), 'yyyy-MM'); monthlyRevenue[mk] = (monthlyRevenue[mk] || 0) + (t.amount || 0); });
    const months = Object.keys(monthlyRevenue).sort().slice(-6);
    const actualData = months.map(m => ({ month: format(new Date(m), 'MMM yyyy'), actual: monthlyRevenue[m], monthKey: m }));
    const avgRevenue = actualData.reduce((sum, d) => sum + d.actual, 0) / actualData.length;
    const recentTrend = actualData.length >= 3 ? (actualData[actualData.length - 1].actual - actualData[actualData.length - 3].actual) / 2 : 0;
    const forecastMonths = [];
    for (let i = 1; i <= 3; i++) { const nm = addMonths(new Date(months[months.length - 1]), i); forecastMonths.push({ month: format(nm, 'MMM yyyy'), forecast: Math.max(0, avgRevenue + (recentTrend * i)), isForecast: true }); }
    return [...actualData, ...forecastMonths];
  }, [transactions]);

  const currentMonthIndex = forecastData.findIndex(d => d.isForecast);
  const totalForecast = forecastData.filter(d => d.isForecast).reduce((sum, d) => sum + (d.forecast || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center"><Activity className="w-5 h-5 text-gray-500" /></div>
          <div><h3 className="text-sm font-semibold text-gray-900">Revenue Forecast</h3><p className="text-xs text-gray-400">3-month projection based on trends</p></div>
        </div>
        <div className="text-right"><p className="text-xs text-gray-400">Projected (3mo)</p><p className="text-xl font-bold text-gray-900">${totalForecast.toFixed(0)}</p></div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} stroke="#E5E7EB" />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} stroke="#E5E7EB" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#6B7280', fontSize: '12px' }} />
          {currentMonthIndex > 0 && (<ReferenceLine x={forecastData[currentMonthIndex - 1].month} stroke="#E5E7EB" strokeDasharray="5 5" label={{ value: 'Forecast →', fill: '#9CA3AF', fontSize: 10 }} />)}
          <Line type="monotone" dataKey="actual" stroke="#111827" strokeWidth={3} dot={{ fill: '#111827', r: 4 }} name="Actual Revenue" />
          <Line type="monotone" dataKey="forecast" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#9CA3AF', r: 3 }} name="Forecasted" />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-start gap-2">
        <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">Forecast uses moving average and recent trend analysis. Actual results may vary based on market conditions.</p>
      </div>
    </motion.div>
  );
}