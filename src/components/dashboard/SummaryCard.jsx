import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SummaryCard — Professional KPI card for the dashboard top row.
 *
 * Props:
 * - icon: Lucide icon component
 * - iconColor: Tailwind color class for the icon (e.g. "text-teal-400")
 * - label: Card title (e.g. "Total Revenue This Month")
 * - value: Primary display value (string, pre-formatted)
 * - trend: "up" | "down" | "neutral" | null
 * - trendValue: e.g. "+12% vs last month"
 * - subtitle: Secondary line (e.g. "Across 3 platforms")
 * - microcopy: Smallest text line (e.g. "Last synced: 2 hours ago")
 * - badge: { text, variant } — optional badge (e.g. risk level)
 * - secondaryValue: Optional second line display (e.g. pending amount)
 * - isMonospace: Whether the value is displayed in monospace font (default true)
 */
export default function SummaryCard({
    icon: Icon,
    iconColor = "text-[#32B8C6]",
    label,
    value,
    trend = null,
    trendValue = null,
    subtitle = null,
    microcopy = null,
    badge = null,
    secondaryValue = null,
    isMonospace = true,
}) {
    const trendConfig = {
        up: {
            icon: TrendingUp,
            color: "text-emerald-400",
        },
        down: {
            icon: TrendingDown,
            color: "text-[#FF5459]",
        },
        neutral: {
            icon: Minus,
            color: "text-[var(--z-text-3)]",
        },
    };

    const badgeVariants = {
        danger: "bg-[#FF5459]/15 text-[#FF5459] border-[#FF5459]/20",
        warning: "bg-[#E68161]/15 text-[#E68161] border-[#E68161]/20",
        success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
        info: "bg-[#32B8C6]/15 text-[#32B8C6] border-[#32B8C6]/20",
    };

    const currentTrend = trend ? trendConfig[trend] : null;
    const TrendIcon = currentTrend?.icon;

    return (
        <div className="rounded-xl p-5 bg-[var(--z-bg-2)] border border-[var(--z-border-1)] transition-colors duration-150 hover:border-[var(--z-border-2)]">
            {/* Top: icon + label + badge */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <div className="w-9 h-9 rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center">
                            <Icon className={cn("w-4 h-4", iconColor)} />
                        </div>
                    )}
                    <span className="text-[13px] font-medium text-[var(--z-text-2)]">
                        {label}
                    </span>
                </div>
                {badge && (
                    <span
                        className={cn(
                            "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                            badgeVariants[badge.variant] || badgeVariants.info
                        )}
                    >
                        {badge.text}
                    </span>
                )}
            </div>

            {/* Primary value */}
            <p
                className={cn(
                    "text-[26px] font-semibold text-[var(--z-text-1)] leading-tight tracking-tight",
                    isMonospace && "font-mono-financial"
                )}
            >
                {value}
            </p>

            {/* Secondary value */}
            {secondaryValue && (
                <p className="text-sm text-[var(--z-text-3)] mt-1 font-mono-financial">
                    {secondaryValue}
                </p>
            )}

            {/* Trend indicator */}
            {currentTrend && trendValue && (
                <div className={cn("flex items-center gap-1 mt-2", currentTrend.color)}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{trendValue}</span>
                </div>
            )}

            {/* Subtitle */}
            {subtitle && (
                <p className="text-[12px] text-[var(--z-text-2)] mt-2">{subtitle}</p>
            )}

            {/* Microcopy */}
            {microcopy && (
                <p className="text-[11px] text-[var(--z-text-3)] mt-1">{microcopy}</p>
            )}
        </div>
    );
}
