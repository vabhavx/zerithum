import React, { useState } from "react";
import {
    Clock,
    ShieldCheck,
    Download,
    FileText,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * TrustBar — Full-width trust signal strip that sits beneath the page header.
 *
 * Shows:
 *  - Last sync timestamp (most recent across all platforms)
 *  - Platform coverage: "N of M platforms connected"
 *  - Export CSV (client-side download) and Print Report buttons
 *
 * Props:
 *  - connectedPlatforms: Array of connected platform objects
 *  - transactions: Array of revenue transactions (for CSV export)
 *  - totalPlatformCount: Total number of platforms Zerithum supports (default 6)
 */
export default function TrustBar({
    connectedPlatforms = [],
    transactions = [],
    totalPlatformCount = 6,
}) {
    const [exportingCsv, setExportingCsv] = useState(false);

    // ── Compute last sync time ──────────────────────────────────────────────
    const lastSyncDates = connectedPlatforms
        .map((p) => p.last_synced_at || p.updated_at)
        .filter(Boolean)
        .map((d) => new Date(d))
        .filter((d) => !isNaN(d.getTime()));

    const mostRecentSync =
        lastSyncDates.length > 0
            ? lastSyncDates.reduce((a, b) => (a > b ? a : b))
            : null;

    const lastSyncLabel = mostRecentSync
        ? `${formatDistanceToNow(mostRecentSync, { addSuffix: false })} ago`
        : "Never";

    // ── Platform coverage ──────────────────────────────────────────────────
    const connectedCount = connectedPlatforms.length;
    const coverageFraction = Math.min(connectedCount / totalPlatformCount, 1);
    const coverageOk = connectedCount >= Math.ceil(totalPlatformCount / 2);

    // ── CSV export ─────────────────────────────────────────────────────────
    function handleExportCsv() {
        if (exportingCsv || transactions.length === 0) return;
        setExportingCsv(true);

        try {
            const headers = [
                "date",
                "platform",
                "description",
                "gross_amount",
                "currency",
                "status",
            ];
            const rows = transactions.map((t) => [
                t.transaction_date ?? "",
                t.platform ?? "",
                (t.description ?? "").replace(/,/g, ";"),
                t.amount ?? 0,
                t.currency ?? "USD",
                t.status ?? "",
            ]);

            const csv =
                headers.join(",") +
                "\n" +
                rows.map((r) => r.join(",")).join("\n");

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `zerithum-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setTimeout(() => setExportingCsv(false), 800);
        }
    }

    // ── Print / PDF ────────────────────────────────────────────────────────
    function handlePrint() {
        window.print();
    }

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-3.5 mb-6
                 bg-[var(--z-bg-2)] border border-[var(--z-border-1)]"
            role="status"
            aria-label="Data freshness and export controls"
        >
            {/* Left — trust signals */}
            <div className="flex flex-wrap items-center gap-5">
                {/* Last sync */}
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[var(--z-text-3)] flex-shrink-0" />
                    <span className="text-[12px] text-[var(--z-text-3)]">
                        Last sync:{" "}
                        <span
                            className={cn(
                                "font-medium",
                                mostRecentSync ? "text-[var(--z-text-2)]" : "text-[var(--z-warn)]"
                            )}
                        >
                            {lastSyncLabel}
                        </span>
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-4 bg-[var(--z-border-1)] hidden sm:block" aria-hidden="true" />

                {/* Platform coverage */}
                <div className="flex items-center gap-2">
                    {coverageOk ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#32B8C6] flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-[var(--z-warn)] flex-shrink-0" />
                    )}
                    <span className="text-[12px] text-[var(--z-text-3)]">
                        Coverage:{" "}
                        <span
                            className={cn(
                                "font-medium",
                                coverageOk ? "text-[var(--z-text-2)]" : "text-[var(--z-warn)]"
                            )}
                        >
                            {connectedCount} of {totalPlatformCount} platforms
                        </span>
                    </span>

                    {/* Mini progress bar */}
                    <div
                        className="w-16 h-1 rounded-full bg-[var(--z-bg-3)] hidden sm:block"
                        aria-hidden="true"
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${coverageFraction * 100}%`,
                                backgroundColor: coverageOk ? "#32B8C6" : "#E68161",
                            }}
                        />
                    </div>
                </div>

                {/* All synced badge */}
                {connectedCount > 0 &&
                    connectedPlatforms.every((p) => p.sync_status !== "error") && (
                        <div className="hidden md:flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-medium">
                                All synced
                            </span>
                        </div>
                    )}
            </div>

            {/* Right — export actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleExportCsv}
                    disabled={transactions.length === 0}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium",
                        "border border-[var(--z-border-1)] transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg-0)]",
                        transactions.length === 0
                            ? "text-[var(--z-text-3)] cursor-not-allowed opacity-50"
                            : "text-[var(--z-text-2)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)] hover:bg-[var(--z-bg-3)]"
                    )}
                    aria-label="Export dashboard transactions to CSV"
                >
                    <Download className="w-3.5 h-3.5" />
                    {exportingCsv ? "Exporting…" : "Export CSV"}
                </button>

                <button
                    onClick={handlePrint}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium",
                        "border border-[#32B8C6]/30 text-[#32B8C6] transition-all duration-150",
                        "hover:bg-[#32B8C6]/8 hover:border-[#32B8C6]/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg-0)]"
                    )}
                    aria-label="Print monthly report"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Print report
                </button>
            </div>
        </div>
    );
}
