import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 600, damping: 40 } },
};

export function GlassCard({ children, className, ...props }) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "bg-white border border-gray-100 rounded-xl shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const toneConfig = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500", badge: "bg-red-100 text-red-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500", badge: "bg-amber-100 text-amber-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500", badge: "bg-blue-100 text-blue-700" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "text-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
  neutral: { bg: "bg-gray-50", text: "text-gray-700", icon: "text-gray-500", badge: "bg-gray-100 text-gray-600" },
};

export function InteractiveMetricCard({
  title, value, subtitle, trend, trendLabel, icon: Icon, tone = "neutral", className, onClick, ...props
}) {
  const colors = toneConfig[tone] || toneConfig.neutral;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendTone = trend > 0 ? "green" : trend < 0 ? "red" : "neutral";
  const trendColors = toneConfig[trendTone];

  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={cn(
        "group rounded-xl p-5 transition-all duration-200",
        "bg-white border border-gray-100 shadow-sm",
        "hover:shadow-md hover:border-gray-200",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[13px] font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors.bg)}>
            <Icon className={cn("w-[18px] h-[18px]", colors.icon)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight font-mono-financial">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend !== undefined && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md", trendColors.badge)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </span>
        )}
        {(subtitle || trendLabel) && (
          <span className="text-xs text-gray-400">{trendLabel || subtitle}</span>
        )}
      </div>
    </motion.div>
  );
}
