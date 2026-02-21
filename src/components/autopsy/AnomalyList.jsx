import React, { useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ZapOff,
    DollarSign,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SEVERITY_CONFIG = {
    critical: {
        badge: "bg-[rgba(255,84,89,0.12)] text-[#FF5459] border border-[rgba(255,84,89,0.3)]",
        strip: "border-l-[#FF5459]",
        icon: "#FF5459",
    },
    high: {
        badge: "bg-[rgba(230,129,97,0.12)] text-[#E68161] border border-[rgba(230,129,97,0.3)]",
        strip: "border-l-[#E68161]",
        icon: "#E68161",
    },
    medium: {
        badge: "bg-[rgba(245,158,11,0.12)] text-amber-400 border border-amber-400/30",
        strip: "border-l-amber-400",
        icon: "#f59e0b",
    },
    low: {
        badge: "bg-[rgba(74,222,128,0.12)] text-emerald-400 border border-emerald-400/30",
        strip: "border-l-emerald-400",
        icon: "#4ade80",
    },
};

const TYPE_ICON = {
    spike: TrendingUp,
    drop: TrendingDown,
    missing_sync: ZapOff,
    fee_jump: DollarSign,
};

/**
 * AnomalyList
 * @param {{ anomalies: Array<{
 *   id: string|number,
 *   type: 'spike'|'drop'|'missing_sync'|'fee_jump',
 *   severity: 'critical'|'high'|'medium'|'low',
 *   detected_at: string,
 *   detection_rule: string,
 *   evidence_summary: string,
 *   evidence_detail: string,
 *   suggested_action: string,
 *   impact?: string,
 * }>, emptyMessage?: string }} props
 */
export default function AnomalyList({ anomalies = [], emptyMessage }) {
    const [expanded, setExpanded] = useState({});

    const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    if (anomalies.length === 0) {
        return (
            <div
                className="rounded-lg border px-6 py-10 text-center"
                style={{ borderColor: "var(--z-border-1)", background: "var(--z-bg-2)" }}
            >
                <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--z-text-3)" }} />
                <p className="text-sm" style={{ color: "var(--z-text-2)" }}>
                    {emptyMessage ?? "No anomalies detected in the current period."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2" role="list" aria-label="Anomaly flags">
            {anomalies.map((anomaly) => {
                const cfg = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.low;
                const Icon = TYPE_ICON[anomaly.type] ?? AlertTriangle;
                const isOpen = !!expanded[anomaly.id];

                return (
                    <div
                        key={anomaly.id}
                        className={cn("rounded-lg border-l-2 border border-l-0", cfg.strip)}
                        style={{
                            background: "var(--z-bg-2)",
                            borderColor: "var(--z-border-1)",
                            borderLeftWidth: "3px",
                        }}
                        role="listitem"
                    >
                        {/* Header row */}
                        <div className="px-4 py-3 flex items-start gap-3">
                            {/* Icon */}
                            <div
                                className="mt-0.5 w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                                style={{ background: "var(--z-bg-3)" }}
                                aria-hidden="true"
                            >
                                <Icon className="w-4 h-4" style={{ color: cfg.icon }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    {/* Detection rule */}
                                    <span
                                        className="text-xs font-mono px-2 py-0.5 rounded"
                                        style={{
                                            background: "var(--z-bg-3)",
                                            color: "var(--z-accent)",
                                            border: "1px solid var(--z-border-1)",
                                        }}
                                    >
                                        {anomaly.detection_rule}
                                    </span>
                                    {/* Severity */}
                                    <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full", cfg.badge)}>
                                        {anomaly.severity}
                                    </span>
                                    {/* Impact */}
                                    {anomaly.impact && (
                                        <span className="text-[11px]" style={{ color: "var(--z-text-3)" }}>
                                            {anomaly.impact}
                                        </span>
                                    )}
                                    {/* Timestamp */}
                                    <span className="text-[11px] ml-auto" style={{ color: "var(--z-text-3)" }}>
                                        {format(new Date(anomaly.detected_at), "MMM d, yyyy")}
                                    </span>
                                </div>

                                {/* Evidence summary */}
                                <p className="text-sm mb-1.5" style={{ color: "var(--z-text-2)" }}>
                                    {anomaly.evidence_summary}
                                </p>

                                {/* Suggested action */}
                                <div
                                    className="text-xs px-2.5 py-1.5 rounded border"
                                    style={{
                                        background: "var(--z-bg-3)",
                                        borderColor: "var(--z-border-1)",
                                        color: "var(--z-text-2)",
                                    }}
                                >
                                    <span style={{ color: "var(--z-text-3)" }} className="font-medium">Suggested: </span>
                                    {anomaly.suggested_action}
                                </div>

                                {/* Show details toggle */}
                                <button
                                    className="mt-2 flex items-center gap-1 text-xs hover:text-[var(--z-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
                                    style={{ color: "var(--z-text-3)" }}
                                    onClick={() => toggle(anomaly.id)}
                                    aria-expanded={isOpen}
                                    aria-controls={`anomaly-detail-${anomaly.id}`}
                                >
                                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    {isOpen ? "Hide details" : "Show details"}
                                </button>

                                {/* Expanded detail */}
                                {isOpen && (
                                    <div
                                        id={`anomaly-detail-${anomaly.id}`}
                                        className="mt-2 p-3 rounded border text-xs font-mono leading-relaxed"
                                        style={{
                                            background: "var(--z-bg-0)",
                                            borderColor: "var(--z-border-1)",
                                            color: "var(--z-text-2)",
                                        }}
                                    >
                                        {anomaly.evidence_detail}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
