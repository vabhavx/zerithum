import React from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import DisclosurePanel from "./DisclosurePanel";

/**
 * KpiTile — CFO-grade KPI card for the dashboard top row.
 *
 * Trust signals built-in:
 *  - Source label (where the number comes from)
 *  - Last updated timestamp
 *  - "View details" navigation link
 *  - ? disclosure panel (how it's calculated)
 *
 * Props:
 *  - label: string — metric name shown above the value
 *  - value: string — pre-formatted number string (e.g. "$12,400")
 *  - trend: "up" | "down" | "neutral" | null
 *  - trendValue: string — e.g. "+8.4% vs last month"
 *  - source: string — e.g. "Synced from YouTube · Patreon · Stripe"
 *  - lastUpdatedAt: ISO string | Date — for the "Updated X ago" line
 *  - viewDetailsTo: react-router path string
 *  - viewDetailsLabel: override link text (default "View details")
 *  - disclosure: { title, body, formula, source } — passed to DisclosurePanel
 *  - isLoading: bool — shows skeleton shimmer
 *  - accentColor: optional teal/amber/green override for trend icon
 */
export default function KpiTile({
    label,
    value,
    trend = null,
    trendValue = null,
    source = null,
    lastUpdatedAt = null,
    viewDetailsTo = null,
    viewDetailsLabel = "View details",
    disclosure = null,
    isLoading = false,
    highlight = false, // e.g. "attention required" tile in warning state
}) {
    // ── Trend config ────────────────────────────────────────────────────────
    const trendConfig = {
        up: { icon: TrendingUp, color: "text-emerald-400" },
        down: { icon: TrendingDown, color: "text-[#FF5459]" },
        neutral: { icon: Minus, color: "text-[var(--z-text-3)]" },
    };
    const currentTrend = trend ? trendConfig[trend] : null;
    const TrendIcon = currentTrend?.icon;

    // ── Last updated ────────────────────────────────────────────────────────
    let updatedLabel = null;
    if (lastUpdatedAt) {
        try {
            updatedLabel = formatDistanceToNow(new Date(lastUpdatedAt), {
                addSuffix: true,
            });
        } catch (_) {
            updatedLabel = null;
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-xl p-5 bg-[var(--z-bg-2)] border border-[var(--z-border-1)] animate-pulse">
                <div className="h-3 w-28 bg-[var(--z-bg-3)] rounded mb-4" />
                <div className="h-7 w-20 bg-[var(--z-bg-3)] rounded mb-3" />
                <div className="h-3 w-36 bg-[var(--z-bg-3)] rounded mb-2" />
                <div className="h-2.5 w-24 bg-[var(--z-bg-3)] rounded" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-xl p-5 bg-[var(--z-bg-2)] border transition-colors duration-150",
                highlight
                    ? "border-[#E68161]/30 hover:border-[#E68161]/50"
                    : "border-[var(--z-border-1)] hover:border-[var(--z-border-2)]"
            )}
        >
            {/* Row 1: Label + disclosure trigger */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium tracking-wide uppercase text-[var(--z-text-3)]">
                    {label}
                </span>
                {disclosure && (
                    <DisclosurePanel
                        title={disclosure.title}
                        body={disclosure.body}
                        formula={disclosure.formula}
                        source={disclosure.source}
                    />
                )}
            </div>

            {/* Row 2: Primary value */}
            <p className="text-[28px] font-semibold text-[var(--z-text-1)] leading-none tracking-tight font-mono-financial mb-2">
                {value}
            </p>

            {/* Row 3: Trend */}
            {currentTrend && trendValue && (
                <div className={cn("flex items-center gap-1 mb-2", currentTrend.color)}>
                    <TrendIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[12px] font-medium">{trendValue}</span>
                </div>
            )}

            {/* Spacer pushes source + link to bottom */}
            <div className="mt-auto pt-2 border-t border-[var(--z-border-1)] flex items-center justify-between gap-2">
                <div className="min-w-0">
                    {/* Source */}
                    {source && (
                        <p className="text-[11px] text-[var(--z-text-3)] truncate leading-snug">
                            {source}
                        </p>
                    )}
                    {/* Last updated */}
                    {updatedLabel && (
                        <p className="text-[10px] text-[var(--z-text-3)] opacity-70 leading-snug mt-0.5">
                            {updatedLabel}
                        </p>
                    )}
                </div>

                {/* View details link */}
                {viewDetailsTo && (
                    <Link
                        to={viewDetailsTo}
                        className={cn(
                            "flex-shrink-0 flex items-center gap-0.5 text-[11px] font-medium text-[#32B8C6]",
                            "hover:text-[#21808D] transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--z-bg-2)] rounded"
                        )}
                    >
                        {viewDetailsLabel}
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
        </div>
    );
}
