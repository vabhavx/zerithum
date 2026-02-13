import React from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    FileSearch,
    Link2Off,
    FileDown,
    AlertTriangle,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ActionItemsPanel — "What needs attention" panel with real, actionable items.
 *
 * Props:
 * - unreconciledCount: Number of transactions needing reconciliation
 * - stalePlatforms: Array of platform names with stale/error sync
 * - autopsyEventCount: Number of revenue anomalies pending review
 * - hasTaxExport: Boolean — whether a tax export is ready
 */
export default function ActionItemsPanel({
    unreconciledCount = 0,
    stalePlatforms = [],
    autopsyEventCount = 0,
    hasTaxExport = false,
}) {
    const navigate = useNavigate();

    const items = [];

    if (autopsyEventCount > 0) {
        items.push({
            id: "autopsy",
            icon: AlertTriangle,
            iconColor: "text-[#FF5459]",
            bgColor: "bg-[#FF5459]/10",
            text: `${autopsyEventCount} revenue ${autopsyEventCount === 1 ? "anomaly" : "anomalies"} detected — review now`,
            action: () => navigate("/RevenueAutopsy"),
            priority: 1,
        });
    }

    if (unreconciledCount > 0) {
        items.push({
            id: "reconcile",
            icon: FileSearch,
            iconColor: "text-[#E68161]",
            bgColor: "bg-[#E68161]/10",
            text: `${unreconciledCount} ${unreconciledCount === 1 ? "transaction needs" : "transactions need"} reconciliation review`,
            action: () => navigate("/TransactionAnalysis"),
            priority: 2,
        });
    }

    stalePlatforms.forEach((platform) => {
        items.push({
            id: `stale-${platform}`,
            icon: Link2Off,
            iconColor: "text-[#E68161]",
            bgColor: "bg-[#E68161]/10",
            text: `${platform} data is stale — reconnect to resume syncing`,
            action: () => navigate("/ConnectedPlatforms"),
            priority: 3,
        });
    });

    if (hasTaxExport) {
        items.push({
            id: "tax-export",
            icon: FileDown,
            iconColor: "text-[#32B8C6]",
            bgColor: "bg-[#32B8C6]/10",
            text: "Tax export ready for download",
            action: () => navigate("/TaxEstimator"),
            priority: 4,
        });
    }

    // Sort by priority
    items.sort((a, b) => a.priority - b.priority);

    return (
        <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] p-5">
            <h3 className="text-base font-semibold text-[var(--z-text-1)] mb-1">
                What needs attention
            </h3>
            <p className="text-[13px] text-[var(--z-text-3)] mb-4">
                Action items based on your account activity
            </p>

            {items.length === 0 ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <p className="text-sm text-[var(--z-text-2)]">
                        All clear. No actions needed.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--z-bg-3)]/50 border border-[var(--z-border-1)] hover:border-[var(--z-border-2)] hover:bg-[var(--z-bg-3)] transition-all duration-150 group text-left"
                            >
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                        item.bgColor
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", item.iconColor)} />
                                </div>
                                <span className="flex-1 text-[13px] text-[var(--z-text-2)] group-hover:text-[var(--z-text-1)] transition-colors">
                                    {item.text}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[var(--z-text-3)] group-hover:text-[var(--z-text-2)] transition-colors flex-shrink-0" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
