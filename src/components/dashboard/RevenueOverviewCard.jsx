import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RevenueOverviewCard({ title, amount, change, changePercent, currency = 'USD' }) {
  const isPositive = change >= 0;
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/50 text-sm mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{formatCurrency(amount)}</h3>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-zteal-400/20 to-purple-500/20 border border-white/10"
        )}>
          <DollarSign className="w-5 h-5 text-zteal-400" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
          isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{Math.abs(changePercent).toFixed(1)}%</span>
        </div>
        <p className="text-white/40 text-xs">
          {isPositive ? '+' : ''}{formatCurrency(change)} vs last month
        </p>
      </div>
    </motion.div>
  );
}