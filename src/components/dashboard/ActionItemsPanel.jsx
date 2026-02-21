import React from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    FileSearch,
    Link2Off,
    AlertTriangle,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SeverityBadge — small colored pill.
 */
function SeverityBadge({ severity }) {
    const config = {
        critical: {
            label: "Critical",
            classes: "bg-[#FF5459]/10 text-[#FF5459] border border-[#FF5459]/20",
        },
        warning: {
            label: "Warning",
            classes: "bg-[#E68161]/10 text-[#E68161] border border-[#E68161]/20",
        },
        info: {
            label: "Info",
            classes: "bg-[#32B8C6]/10 text-[#32B8C6] border border-[#32B8C6]/20",
        },
    };
    const c = config[severity] || config.info;
    return (
        <span
            className={cn(
                "flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide",
                c.classes
            )}
        >
            {c.label}
        </span>
    );
}

/**
 * AttentionItem — a single action row inside the panel.
 */
function AttentionItem({ icon: Icon, iconBg, iconColor, severity, text, detail, actionLabel, onAction }) {
    return (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] hover:border-[var(--z-border-2)] transition-colors duration-150">
            {/* Icon */}
            <div
                className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    iconBg
                )}
            >
                <Icon className={cn("w-4 h-4", iconColor)} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-[13px] font-medium text-[var(--z-text-1)] leading-snug">
                        {text}
                    </p>
                    <SeverityBadge severity={severity} />
                </div>
                {detail && (
                    <p className="text-[12px] text-[var(--z-text-3)] leading-snug">
                        {detail}
                    </p>
                )}
            </div>

            {/* CTA */}
            <button
                onClick={onAction}
                className={cn(
                    "flex-shrink-0 flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-lg",
                    "border transition-all duration-150 self-center",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--z-bg-3)]",
                    severity === "critical"
                        ? "border-[#FF5459]/30 text-[#FF5459] hover:bg-[#FF5459]/10"
                        : severity === "warning"
                            ? "border-[#E68161]/30 text-[#E68161] hover:bg-[#E68161]/10"
                            : "border-[#32B8C6]/30 text-[#32B8C6] hover:bg-[#32B8C6]/10"
                )}
                aria-label={actionLabel}
            >
                {actionLabel}
                <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    );
}

/**
 * ActionItemsPanel — "Attention required" panel.
 *
 * Props:
 *  - unreconciledCount: number
 *  - stalePlatforms: string[] — platform names with sync errors
 *  - autopsyEventCount: number
 *  - hasTaxExport: bool
 */
export default function ActionItemsPanel({
    unreconciledCount = 0,
    stalePlatforms = [],
    autopsyEventCount = 0,
    hasTaxExport = false,
}) {
    const navigate = useNavigate();

    const items = [];

    // 1. Revenue anomalies — critical
    if (autopsyEventCount > 0) {
        items.push({
            id: "autopsy",
            icon: AlertTriangle,
            iconBg: "bg-[#FF5459]/10",
            iconColor: "text-[#FF5459]",
            severity: "critical",
            text: `${autopsyEventCount} revenue ${autopsyEventCount === 1 ? "anomaly" : "anomalies"} detected`,
            detail: `${autopsyEventCount === 1 ? "A payment" : "Payments"} from your connected platforms ${autopsyEventCount === 1 ? "doesn't" : "don't"} match expected amounts — you may be missing income.`,
            actionLabel: "Review now",
            onAction: () => navigate("/RevenueAutopsy"),
        });
    }

    // 2. Unreconciled transactions — warning
    if (unreconciledCount > 0) {
        items.push({
            id: "reconcile",
            icon: FileSearch,
            iconBg: "bg-[#E68161]/10",
            iconColor: "text-[#E68161]",
            severity: "warning",
            text: `${unreconciledCount} ${unreconciledCount === 1 ? "transaction" : "transactions"} need matching`,
            detail: `${unreconciledCount === 1 ? "This transaction hasn't" : "These transactions haven't"} been matched to a bank deposit yet. Confirm them to keep your records accurate.`,
            actionLabel: "Match now",
            onAction: () => navigate("/TransactionAnalysis"),
        });
    }

    // 3. Stale platform syncs — warning (max 2 shown to keep panel scannable)
    stalePlatforms.slice(0, 2).forEach((platform) => {
        items.push({
            id: `stale-${platform}`,
            icon: Link2Off,
            iconBg: "bg-[#E68161]/10",
            iconColor: "text-[#E68161]",
            severity: "warning",
            text: `${platform} sync is failing`,
            detail: `${platform} stopped syncing. Your revenue totals may be incomplete until you reconnect.`,
            actionLabel: "Reconnect",
            onAction: () => navigate("/ConnectedPlatforms"),
        });
    });

    // 4. Tax export ready — info
    if (hasTaxExport) {
        items.push({
            id: "tax-export",
            icon: FileSearch,
            iconBg: "bg-[#32B8C6]/10",
            iconColor: "text-[#32B8C6]",
            severity: "info",
            text: "Tax export is ready for download",
            detail: "Your annual income summary has been compiled and is ready to share with your accountant.",
            actionLabel: "Download",
            onAction: () => navigate("/TaxEstimator"),
        });
    }

    return (
        <div className="rounded-xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-[15px] font-semibold text-[var(--z-text-1)]">
                    Attention required
                </h3>
                {items.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E68161]/10 text-[#E68161] border border-[#E68161]/20">
                        {items.length}
                    </span>
                )}
            </div>
            <p className="text-[12px] text-[var(--z-text-3)] mb-4">
                Items that need your decision to keep records accurate
            </p>

            {items.length === 0 ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-[var(--z-text-1)]">
                            Everything looks good
                        </p>
                        <p className="text-[12px] text-[var(--z-text-3)]">
                            No actions needed right now
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {items.map((item) => (
                        <AttentionItem key={item.id} {...item} />
                    ))}
                </div>
            )}
        </div>
    );
}
