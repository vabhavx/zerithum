import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function KPICard({ title, value, trend, trendValue, subtitle, icon: Icon, color = "#208D9E" }) {
  const isPositive = trend === "up";

  return (
    <div className="clay-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-[#5E5240]/60 mb-1">{title}</p>
          <h3 className="text-3xl font-bold" style={{ color }}>
            {value}
          </h3>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>

      {trendValue && (
        <div className="flex items-center gap-2 mb-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-[#208D9E]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#C0152F]" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? "text-[#208D9E]" : "text-[#C0152F]"}`}>
            {trendValue}
          </span>
          <span className="text-xs text-[#5E5240]/60">vs last month</span>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-[#5E5240]/60">{subtitle}</p>
      )}
    </div>
  );
}