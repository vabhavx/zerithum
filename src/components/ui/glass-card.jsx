import { motion } from "framer-motion";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
      stiffness: 120,
      damping: 15,
    },
  },
};

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export function GlassCard({ children, className, hoverEffect = false, ...props }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={hoverEffect ? hoverScale : undefined}
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md transition-colors ${
        hoverEffect ? "hover:border-[#56C5D0]/30 hover:bg-white/5" : ""
      } ${className || ""}`}
      {...props}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
