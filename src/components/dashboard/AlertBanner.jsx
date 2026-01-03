import React from "react";
import { AlertTriangle, Clock, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AlertBanner({ alerts = [], onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <AnimatePresence>
      {alerts.map((alert) => {
        const icons = {
          error: AlertTriangle,
          warning: AlertTriangle,
          info: Sparkles,
          sync: Clock
        };
        
        const Icon = icons[alert.type] || AlertTriangle;
        
        const colors = {
          error: "bg-red-500/10 border-red-500/30 text-red-400",
          warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
          sync: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
        };

        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "rounded-xl p-4 mb-4 border-2 flex items-center justify-between",
              colors[alert.type] || colors.warning
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{alert.title}</p>
                {alert.description && (
                  <p className="text-xs opacity-80 mt-0.5">{alert.description}</p>
                )}
              </div>
            </div>
            {alert.dismissible && onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}