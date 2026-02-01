import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * KPICard - Reusable key performance indicator card
 * Updated to use dark theme consistent with the rest of the app.
 */
export default function KPICard({ title, value, subtitle, trend, trendValue, icon: Icon }) {
  const isPositive = trend === 'up';

  return (
    <div className="card-modern rounded-xl p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-white/50">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-white/30" />}
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-zteal-400">{value}</div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">{subtitle}</p>

        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}