import React from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    LinkIcon,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ── Platform metadata ───────────────────────────────────────────────────────

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

/**
 * Platform fee rates (gross → net).
 * These are standard published rates each platform takes from creators.
 * Source: public platform documentation.
 */
const PLATFORM_FEE_RATES = {
    youtube: 0.45,     // YouTube keeps 45% (AdSense: creators get 55%)
    patreon: 0.08,     // Patreon Pro: ~8% platform fee
    stripe: 0.029,     // Stripe: 2.9% + $0.30 — simplified as 2.9% here
    gumroad: 0.10,     // Gumroad: 10% flat
    instagram: 0.05,   // Instagram Gifts/Reels: ~5%
    tiktok: 0.50,      // TikTok Creator Fund keeps ~50%
    shopify: 0.02,     // Shopify basic transaction fee: 2%
    substack: 0.10,    // Substack: 10%
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return "—";
    const abs = Math.abs(amount);
    if (abs === 0) return "$0";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
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

// ── Share bar (CSS only) ─────────────────────────────────────────────────────

function ShareBar({ pct }) {
    const clamped = Math.max(0, Math.min(100, pct));
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-[var(--z-bg-3)]" aria-hidden="true">
                <div
                    className="h-full rounded-full bg-[#32B8C6] opacity-70"
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="text-[12px] font-mono-financial text-[var(--z-text-2)] tabular-nums">
                {clamped.toFixed(1)}%
            </span>
        </div>
    );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onConnect }) {
    return (
        <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] p-6">
            <SectionHeader />
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center mb-4">
                    <LinkIcon className="w-5 h-5 text-[var(--z-text-3)]" />
                </div>
                <p className="text-sm font-medium text-[var(--z-text-2)] mb-1">
                    No revenue data yet
                </p>
                <p className="text-[12px] text-[var(--z-text-3)] mb-4 max-w-xs">
                    Connect your platforms and complete a sync to see your revenue breakdown here.
                </p>
                <button
                    onClick={onConnect}
                    className={cn(
                        "text-[13px] font-medium text-[#32B8C6] hover:text-[#21808D] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
                    )}
                >
                    Connect platforms →
                </button>
            </div>
        </div>
    );
}

function SectionHeader() {
    return (
        <div className="px-5 pt-5 pb-3">
            <h3 className="text-[15px] font-semibold text-[var(--z-text-1)] mb-0.5">
                Where your money came from
            </h3>
            <p className="text-[12px] text-[var(--z-text-3)]">
                Revenue by source this month — Gross, Fees, Net, and Share
            </p>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

/**
 * PlatformRevenueTable
 *
 * Props:
 *  - platformData: Array of { platform, currentMonth, lastMonth }
 *  - connectedPlatforms: Array of connected platform objects from DB
 */
export default function PlatformRevenueTable({
    platformData = [],
    connectedPlatforms = [],
}) {
    const navigate = useNavigate();

    if (platformData.length === 0) {
        return <EmptyState onConnect={() => navigate("/ConnectedPlatforms")} />;
    }

    // Sort by current month gross descending
    const sorted = [...platformData].sort(
        (a, b) => b.currentMonth - a.currentMonth
    );

    // Total gross for share % calculation
    const totalGross = sorted.reduce((sum, row) => sum + row.currentMonth, 0);

    // Sync status lookup keyed by lowercase platform name
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
            <SectionHeader />

            <div className="overflow-x-auto">
                <table className="w-full" aria-label="Platform revenue breakdown">
                    <thead>
                        <tr className="border-t border-b border-[var(--z-border-1)]">
                            {[
                                { label: "Platform", align: "left", className: "" },
                                { label: "Gross", align: "right", className: "" },
                                { label: "Fees", align: "right", className: "hidden sm:table-cell" },
                                { label: "Net", align: "right", className: "" },
                                { label: "Share", align: "left", className: "hidden md:table-cell pl-4" },
                                { label: "Data freshness", align: "right", className: "hidden lg:table-cell" },
                                { label: "Sync", align: "right", className: "hidden md:table-cell" },
                            ].map(({ label, align, className }) => (
                                <th
                                    key={label}
                                    scope="col"
                                    className={cn(
                                        "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-3)] px-5 py-3",
                                        align === "right" ? "text-right" : "text-left",
                                        className
                                    )}
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {sorted.map((row) => {
                            const platformKey = (row.platform || "").toLowerCase();
                            const feeRate = PLATFORM_FEE_RATES[platformKey] ?? 0;
                            const gross = row.currentMonth;
                            const fees = gross * feeRate;
                            const net = gross - fees;
                            const sharePct =
                                totalGross > 0 ? (gross / totalGross) * 100 : 0;

                            const syncInfo = syncStatusMap[platformKey];
                            const isError = syncInfo?.status === "error";
                            const isSynced = syncInfo?.status === "synced" || syncInfo?.lastSync;

                            let freshnessLabel = "—";
                            if (syncInfo?.lastSync) {
                                try {
                                    freshnessLabel = formatDistanceToNow(
                                        new Date(syncInfo.lastSync),
                                        { addSuffix: false }
                                    ) + " ago";
                                } catch (_) {
                                    freshnessLabel = "Synced";
                                }
                            }
                            if (isError) freshnessLabel = "Stale";

                            const change = {
                                value:
                                    row.lastMonth > 0
                                        ? ((gross - row.lastMonth) / row.lastMonth) * 100
                                        : gross > 0
                                            ? 100
                                            : 0,
                            };

                            return (
                                <tr
                                    key={row.platform}
                                    className="border-b border-[var(--z-border-1)] last:border-b-0 hover:bg-[var(--z-bg-3)] transition-colors duration-100"
                                >
                                    {/* Platform name */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[var(--z-text-1)]">
                                                {PLATFORM_LABELS[platformKey] || row.platform}
                                            </span>
                                            {/* MoM change chip */}
                                            {row.lastMonth > 0 && (
                                                <span
                                                    className={cn(
                                                        "hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                                        change.value > 0
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : change.value < 0
                                                                ? "bg-[#FF5459]/10 text-[#FF5459]"
                                                                : "bg-[var(--z-bg-3)] text-[var(--z-text-3)]"
                                                    )}
                                                >
                                                    {change.value > 0 ? (
                                                        <ArrowUpRight className="w-2.5 h-2.5" />
                                                    ) : change.value < 0 ? (
                                                        <ArrowDownRight className="w-2.5 h-2.5" />
                                                    ) : (
                                                        <Minus className="w-2.5 h-2.5" />
                                                    )}
                                                    {Math.abs(change.value).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-[var(--z-text-3)] mt-0.5 hidden sm:block">
                                            Synced from {PLATFORM_LABELS[platformKey] || row.platform}
                                        </p>
                                    </td>

                                    {/* Gross */}
                                    <td className="px-5 py-3.5 text-right">
                                        <span className="text-sm font-semibold text-[var(--z-text-1)] font-mono-financial tabular-nums">
                                            {formatCurrency(gross)}
                                        </span>
                                    </td>

                                    {/* Fees — hidden on mobile */}
                                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                                        <span className="text-sm text-[var(--z-text-3)] font-mono-financial tabular-nums">
                                            −{formatCurrency(fees)}
                                        </span>
                                        <p className="text-[10px] text-[var(--z-text-3)] opacity-60 mt-0.5">
                                            {(feeRate * 100).toFixed(1)}% fee
                                        </p>
                                    </td>

                                    {/* Net */}
                                    <td className="px-5 py-3.5 text-right">
                                        <span className="text-sm font-semibold text-[#32B8C6] font-mono-financial tabular-nums">
                                            {formatCurrency(net)}
                                        </span>
                                    </td>

                                    {/* Share bar — hidden below md */}
                                    <td className="px-5 py-3.5 hidden md:table-cell">
                                        <ShareBar pct={sharePct} />
                                    </td>

                                    {/* Data freshness — hidden below lg */}
                                    <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                                        <span
                                            className={cn(
                                                "text-[12px]",
                                                isError
                                                    ? "text-[#E68161]"
                                                    : "text-[var(--z-text-3)]"
                                            )}
                                        >
                                            {freshnessLabel}
                                        </span>
                                    </td>

                                    {/* Sync status badge — hidden below md */}
                                    <td className="px-5 py-3.5 text-right hidden md:table-cell">
                                        {isError ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E68161] bg-[#E68161]/10 px-2 py-0.5 rounded-full">
                                                <AlertCircle className="w-2.5 h-2.5" />
                                                Stale
                                            </span>
                                        ) : isSynced ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                Synced
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-[var(--z-text-3)]">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                    {/* Footer: source disclosure */}
                    <tfoot>
                        <tr className="border-t border-[var(--z-border-1)]">
                            <td
                                colSpan={7}
                                className="px-5 py-2.5 text-[11px] text-[var(--z-text-3)]"
                            >
                                Revenue calculated from synced platform transactions · Fees are
                                standard published platform rates · Net = Gross − Fees
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
