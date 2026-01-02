import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MRRCard({ title, amount, trend, trendValue, currency = "$" }) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-600 bg-emerald-50";
    if (trend === "down") return "text-red-600 bg-red-50";
    return "text-slate-600 bg-slate-100";
  };

  const formatAmount = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="clay rounded-3xl p-6 lg:p-8 clay-hover transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        {trendValue && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
            getTrendColor()
          )}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-slate-400 text-2xl lg:text-3xl font-light">{currency}</span>
        <span className="text-4xl lg:text-5xl font-bold text-slate-800 tracking-tight">
          {formatAmount(amount)}
        </span>
      </div>
    </div>
  );
}