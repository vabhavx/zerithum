import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-modern rounded-xl p-6 group"
    >
      <div className="flex items-start justify-between mb-6">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">{title}</p>
        {trendValue && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
              trend === "up" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              trend === "down" && "bg-red-500/10 text-red-400 border border-red-500/20",
              trend === "neutral" && "bg-white/5 text-white/40 border border-white/10"
            )}
          >
            {getTrendIcon()}
            <span>{trendValue}</span>
          </motion.div>
        )}
      </div>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex items-baseline gap-2"
      >
        <span className="text-white/30 text-xl font-light">{currency}</span>
        <span className="text-4xl font-bold text-white tracking-tight">
          {formatAmount(amount)}
        </span>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
    </motion.div>
  );
}