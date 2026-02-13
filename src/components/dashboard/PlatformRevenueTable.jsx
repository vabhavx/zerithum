import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Minus, LinkIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const PLATFORM_LABELS = {
    youtube: "YouTube",
    patreon: "Patreon",
    stripe: "Stripe",
    gumroad: "Gumroad",
    instagram: "Instagram",
    tiktok: "TikTok",
    shopify: "Shopify",
    substack: "Substack",
};

const PLATFORM_ICONS = {
    youtube: "🎬",
    patreon: "🎨",
    stripe: "💳",
    gumroad: "📦",
    instagram: "📸",
    tiktok: "🎵",
    shopify: "🛒",
    substack: "📰",
};

function formatCurrency(amount) {
    if (amount === 0) return "$0";
    if (amount < 1000) return `$${amount.toFixed(0)}`;
    if (amount < 10000) return `$${(amount / 1000).toFixed(1)}k`;
    return `$${(amount / 1000).toFixed(0)}k`;
}

function getChangePercent(current, previous) {
    if (previous === 0 && current === 0) return { value: 0, label: "—" };
    if (previous === 0) return { value: 100, label: "New" };
    const pct = ((current - previous) / previous) * 100;
    return {
        value: pct,
        label: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`,
    };
}

/**
 * PlatformRevenueTable — Professional table showing per-platform revenue breakdown.
 *
 * Props:
 * - platformData: Array of { platform, currentMonth, lastMonth }
 * - connectedPlatforms: Array of connected platform objects (for sync status)
 */
export default function PlatformRevenueTable({
    platformData = [],
    connectedPlatforms = [],
}) {
    const navigate = useNavigate();

    if (platformData.length === 0) {
        return (
            <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] p-6">
                <h3 className="text-base font-semibold text-[var(--z-text-1)] mb-1">
                    Platform Revenue Breakdown
                </h3>
                <p className="text-[13px] text-[var(--z-text-3)] mb-6">
                    Revenue by source for this month
                </p>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center mb-4">
                        <LinkIcon className="w-5 h-5 text-[var(--z-text-3)]" />
                    </div>
                    <p className="text-sm text-[var(--z-text-2)] mb-1">
                        No platforms connected yet
                    </p>
                    <p className="text-[12px] text-[var(--z-text-3)] mb-4">
                        Connect your platforms to see revenue breakdown
                    </p>
                    <button
                        onClick={() => navigate("/ConnectedPlatforms")}
                        className="text-[13px] font-medium text-[#32B8C6] hover:text-[#21808D] transition-colors"
                    >
                        Connect platforms →
                    </button>
                </div>
            </div>
        );
    }

    // Sort by current month amount descending
    const sorted = [...platformData].sort(
        (a, b) => b.currentMonth - a.currentMonth
    );

    // Build sync status lookup
    const syncStatusMap = {};
    connectedPlatforms.forEach((p) => {
        const key = (p.platform_name || p.platform || "").toLowerCase();
        syncStatusMap[key] = {
            status: p.sync_status,
            lastSync: p.last_synced_at || p.updated_at,
        };
    });

    return (
        <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] overflow-hidden">
            <div className="p-5 pb-3">
                <h3 className="text-base font-semibold text-[var(--z-text-1)] mb-0.5">
                    Platform Revenue Breakdown
                </h3>
                <p className="text-[13px] text-[var(--z-text-3)]">
                    Revenue by source for this month
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-t border-b border-[var(--z-border-1)]">
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-3)] px-5 py-3">
                                Platform
                            </th>
                            <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-3)] px-5 py-3">
                                This Month
                            </th>
                            <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-3)] px-5 py-3 hidden sm:table-cell">
                                Last Month
                            </th>
                            <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-3)] px-5 py-3">
                                Change
                            </th>
                            <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-3)] px-5 py-3 hidden md:table-cell">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row) => {
                            const change = getChangePercent(row.currentMonth, row.lastMonth);
                            const platformKey = (row.platform || "").toLowerCase();
                            const syncInfo = syncStatusMap[platformKey];
                            const isStale = syncInfo?.status === "error";

                            let statusText = "—";
                            if (syncInfo?.lastSync) {
                                try {
                                    statusText = `Synced ${formatDistanceToNow(
                                        new Date(syncInfo.lastSync),
                                        { addSuffix: false }
                                    )} ago`;
                                } catch (_e) {
                                    statusText = "Synced";
                                }
                            }
                            if (isStale) {
                                statusText = "Stale — reconnect";
                            }

                            return (
                                <tr
                                    key={row.platform}
                                    className="border-b border-[var(--z-border-1)] last:border-b-0 hover:bg-[var(--z-bg-3)] transition-colors duration-100"
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-base">
                                                {PLATFORM_ICONS[platformKey] || "📊"}
                                            </span>
                                            <span className="text-sm font-medium text-[var(--z-text-1)]">
                                                {PLATFORM_LABELS[platformKey] || row.platform}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <span className="text-sm font-semibold text-[var(--z-text-1)] font-mono-financial">
                                            ${row.currentMonth.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                                        <span className="text-sm text-[var(--z-text-3)] font-mono-financial">
                                            ${row.lastMonth.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {change.value > 0 ? (
                                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : change.value < 0 ? (
                                                <ArrowDownRight className="w-3.5 h-3.5 text-[#FF5459]" />
                                            ) : (
                                                <Minus className="w-3.5 h-3.5 text-[var(--z-text-3)]" />
                                            )}
                                            <span
                                                className={cn(
                                                    "text-xs font-medium",
                                                    change.value > 0
                                                        ? "text-emerald-400"
                                                        : change.value < 0
                                                            ? "text-[#FF5459]"
                                                            : "text-[var(--z-text-3)]"
                                                )}
                                            >
                                                {change.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right hidden md:table-cell">
                                        <span
                                            className={cn(
                                                "text-[11px] font-medium",
                                                isStale
                                                    ? "text-[#E68161]"
                                                    : "text-[var(--z-text-3)]"
                                            )}
                                        >
                                            {isStale && (
                                                <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
                                            )}
                                            {statusText}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
