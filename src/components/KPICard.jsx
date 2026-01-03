import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, subtitle, trend, trendValue, icon: Icon }) {
  const isPositive = trend === 'up';

  return (
    <div className="clay-card p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-[#5E5240]/70">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-[#5E5240]/40" />}
      </div>
      
      <div className="mb-2">
        <div className="text-3xl font-bold text-[#208D9E]">{value}</div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#5E5240]/60">{subtitle}</p>
        
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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