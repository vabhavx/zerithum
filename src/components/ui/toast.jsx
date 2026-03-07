import * as React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOAST_DURATION } from "@/components/ui/use-toast";

const VARIANT_CONFIG = {
  default: {
    Icon: Info,
    accentColor: "var(--z-accent)",
    iconBg: "var(--z-accent-light)",
    iconColor: "var(--z-accent)",
    progressColor: "var(--z-accent)",
  },
  success: {
    Icon: CheckCircle2,
    accentColor: "var(--z-success)",
    iconBg: "var(--z-success-light)",
    iconColor: "var(--z-success)",
    progressColor: "var(--z-success)",
  },
  destructive: {
    Icon: AlertCircle,
    accentColor: "var(--z-danger)",
    iconBg: "var(--z-danger-light)",
    iconColor: "var(--z-danger)",
    progressColor: "var(--z-danger)",
  },
  warning: {
    Icon: AlertTriangle,
    accentColor: "var(--z-warn)",
    iconBg: "var(--z-warn-light)",
    iconColor: "var(--z-warn)",
    progressColor: "var(--z-warn)",
  },
};

export const Toast = React.forwardRef(function Toast(
  {
    title,
    description,
    variant = "default",
    onClose,
    duration = TOAST_DURATION,
    className,
    open,
    ...props
  },
  ref
) {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.default;
  const { Icon, accentColor, iconBg, iconColor, progressColor } = config;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ x: 110, opacity: 0, scale: 0.93 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{
        x: 110,
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.28, ease: [0.32, 0, 0.67, 0] },
      }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "relative flex w-full max-w-[360px] items-start gap-3 overflow-hidden rounded-xl border border-[var(--z-border-1)] bg-[var(--z-bg-0)] p-4 pr-10",
        className
      )}
      style={{
        boxShadow: "var(--z-shadow-lg)",
        borderLeftWidth: "3px",
        borderLeftColor: accentColor,
      }}
      {...props}
    >
      {/* Icon badge */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={14} style={{ color: iconColor }} strokeWidth={2.5} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 pt-px">
        {title && (
          <p className="text-sm font-semibold leading-tight text-[var(--z-text-1)]">
            {title}
          </p>
        )}
        {description && (
          <p
            className={cn(
              "text-xs leading-snug text-[var(--z-text-3)]",
              title && "mt-0.5"
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-md text-[var(--z-text-3)] transition-colors hover:bg-[var(--z-bg-2)] hover:text-[var(--z-text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)] focus:ring-offset-1"
        aria-label="Dismiss"
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      {/* Draining progress bar */}
      {duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--z-bg-3)]">
          <motion.div
            className="h-full"
            style={{ backgroundColor: progressColor }}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
});

Toast.displayName = "Toast";

// Legacy named exports — kept so existing import sites don't break
export const ToastProvider = ({ children }) => <>{children}</>;
export const ToastViewport = () => null;
export const ToastTitle = ({ children, className }) => (
  <span className={className}>{children}</span>
);
export const ToastDescription = ({ children, className }) => (
  <span className={className}>{children}</span>
);
export const ToastClose = () => null;
export const ToastAction = ({ children }) => <>{children}</>;
