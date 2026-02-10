import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { format, addMonths, startOfMonth } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="text-foreground text-sm font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toFixed(0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueForecasting({ transactions }) {
  const forecastData = useMemo(() => {
    if (!transactions.length) return [];

    // Group transactions by month
    const monthlyRevenue = {};
    transactions.forEach(t => {
      const monthKey = format(startOfMonth(new Date(t.transaction_date)), 'yyyy-MM');
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (t.amount || 0);
    });

    // Get last 6 months of actual data
    const months = Object.keys(monthlyRevenue).sort().slice(-6);
    const actualData = months.map(m => ({
      month: format(new Date(m), 'MMM yyyy'),
      actual: monthlyRevenue[m],
      monthKey: m
    }));

    // Simple moving average forecast for next 3 months
    const avgRevenue = actualData.reduce((sum, d) => sum + d.actual, 0) / actualData.length;
    const recentTrend = actualData.length >= 3 
      ? (actualData[actualData.length - 1].actual - actualData[actualData.length - 3].actual) / 2 
      : 0;

    const forecastMonths = [];
    for (let i = 1; i <= 3; i++) {
      const nextMonth = addMonths(new Date(months[months.length - 1]), i);
      const forecast = Math.max(0, avgRevenue + (recentTrend * i));
      forecastMonths.push({
        month: format(nextMonth, 'MMM yyyy'),
        forecast: forecast,
        isForecast: true
      });
    }

    return [...actualData, ...forecastMonths];
  }, [transactions]);

  const currentMonthIndex = forecastData.findIndex(d => d.isForecast);
  const totalForecast = forecastData
    .filter(d => d.isForecast)
    .reduce((sum, d) => sum + (d.forecast || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border bg-card rounded-none p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-border flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Revenue Forecast</h3>
            <p className="text-xs text-foreground/40">3-month projection based on trends</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/40">Projected (3mo)</p>
          <p className="text-xl font-bold text-purple-400">${totalForecast.toFixed(0)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            stroke="rgba(255,255,255,0.1)"
          />
          <YAxis 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            stroke="rgba(255,255,255,0.1)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}
          />
          {currentMonthIndex > 0 && (
            <ReferenceLine 
              x={forecastData[currentMonthIndex - 1].month} 
              stroke="rgba(255,255,255,0.2)" 
              strokeDasharray="5 5"
              label={{ value: 'Forecast →', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#6366F1" 
            strokeWidth={3}
            dot={{ fill: '#6366F1', r: 4 }}
            name="Actual Revenue"
          />
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#A855F7" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#A855F7', r: 3 }}
            name="Forecasted"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-2">
        <TrendingUp className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-purple-300">
          Forecast uses moving average and recent trend analysis. Actual results may vary based on market conditions.
        </p>
      </div>
    </motion.div>
  );
}