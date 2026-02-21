import { motion } from "framer-motion";

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

export function GlassCard({ children, className, hoverEffect = false, glowEffect = false, ...props }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={hoverEffect ? hoverScale : undefined}
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#121214]/60 backdrop-blur-xl transition-all duration-300 ${
        hoverEffect ? "hover:border-[#56C5D0]/30 hover:bg-white/[0.03] hover:shadow-[0_0_30px_-5px_rgba(86,197,208,0.15)]" : ""
      } ${className || ""}`}
      {...props}
    >
      {/* Dynamic Glow Effect */}
      {glowEffect && (
        <div className="absolute -inset-[100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#56C5D0_50%,#0000_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
      )}

      {/* Subtle top gradient for "light source" feel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

      {/* Content Container */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
