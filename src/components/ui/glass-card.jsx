import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export function GlassCard({
  children,
  className,
  hoverEffect = false,
  glowEffect = false,
  variant = "default", // default | hud | panel
  ...props
}) {
  const baseStyles = "relative overflow-hidden transition-all duration-300 backdrop-blur-xl";

  const variants = {
    default: "rounded-xl border border-white/10 bg-[#121214]/60",
    hud: "rounded-lg border border-[#56C5D0]/20 bg-[#0A0A0A]/80 shadow-[0_0_15px_-5px_rgba(86,197,208,0.1)]",
    panel: "rounded-2xl border border-white/5 bg-[#18181B]/40",
  };

  const hoverStyles = hoverEffect
    ? "hover:border-[#56C5D0]/30 hover:bg-white/[0.03] hover:shadow-[0_0_30px_-5px_rgba(86,197,208,0.15)] cursor-pointer"
    : "";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={hoverEffect ? hoverScale : undefined}
      className={cn(baseStyles, variants[variant], hoverStyles, className)}
      {...props}
    >
      {/* Dynamic Glow Effect */}
      {glowEffect && (
        <div className="absolute -inset-[100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#56C5D0_50%,#0000_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
      )}

      {/* Subtle top gradient for "light source" feel - Only for default/panel */}
      {variant !== "hud" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      )}

      {/* HUD Corner Accents */}
      {variant === "hud" && (
        <>
          <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-[#56C5D0]/50" />
          <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-[#56C5D0]/50" />
          <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[#56C5D0]/50" />
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[#56C5D0]/50" />
        </>
      )}

      {/* Content Container */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

export function InteractiveMetricCard({ title, value, sub, tone = "neutral", trend = null, onClick }) {
  const valueClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <GlassCard hoverEffect={!!onClick} onClick={onClick} className="p-4">
      <div className="flex justify-between items-start">
        <p className="text-xs uppercase tracking-wide text-white/60">{title}</p>
        {trend && (
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", trend > 0 ? "bg-[#56C5D0]/10 text-[#56C5D0]" : "bg-[#F0A562]/10 text-[#F0A562]")}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{sub}</p>
    </GlassCard>
  );
}
