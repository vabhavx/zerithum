import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

export const hoverScale = {
  scale: 1.01,
  transition: { duration: 0.15 },
};

export function GlassCard({
  children,
  className,
  hoverEffect = false,
  glowEffect = false,
  variant = "default",
  ...props
}) {
  const baseStyles = "relative overflow-hidden transition-all duration-200";

  const variants = {
    default: "rounded-lg border border-gray-200 bg-white shadow-sm",
    hud: "rounded-lg border border-gray-200 bg-white shadow-sm",
    panel: "rounded-lg border border-gray-200 bg-white shadow-sm",
  };

  const hoverStyles = hoverEffect
    ? "hover:border-gray-300 hover:shadow-md cursor-pointer"
    : "";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={hoverEffect ? hoverScale : undefined}
      className={cn(baseStyles, variants[variant], hoverStyles, className)}
      {...props}
    >
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

export function InteractiveMetricCard({
  title,
  value,
  sub,
  tone = "neutral",
  trend = null,
  onClick,
  ...props
}) {
  const valueClass =
    tone === "teal"
      ? "text-gray-900"
      : tone === "orange"
        ? "text-amber-600"
        : tone === "red"
          ? "text-red-600"
          : "text-gray-900";

  return (
    <GlassCard hoverEffect={!!onClick} onClick={onClick} className="p-4" {...props}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
        {trend && (
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", trend > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </GlassCard>
  );
}
