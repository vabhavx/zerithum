import React from "react";
import { motion } from "framer-motion";

/**
 * StatCard - Reusable metric/statistic card component
 * 
 * Extracts the common card pattern used in Dashboard and Expenses pages
 * to reduce code duplication.
 * 
 * @param {string} title - Small label above the value
 * @param {string|number} value - Main displayed value
 * @param {string} subtitle - Small text below the value
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} iconBgClass - Tailwind class for icon background (e.g., "bg-zteal-400/20")
 * @param {string} iconColorClass - Tailwind class for icon color (e.g., "text-zteal-400")
 * @param {number} delay - Animation delay in seconds
 * @param {string} subtitleColorClass - Optional color class for subtitle text
 */
export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconBgClass = "bg-zteal-400/20",
    iconColorClass = "text-zteal-400",
    delay = 0,
    subtitleColorClass = "text-white/40"
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="card-modern rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${iconBgClass} border border-white/10 flex items-center justify-center`}>
                    {Icon && <Icon className={`w-5 h-5 ${iconColorClass}`} />}
                </div>
            </div>
            <p className="text-white/50 text-xs mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className={`text-xs mt-2 ${subtitleColorClass}`}>{subtitle}</p>
        </motion.div>
    );
}
