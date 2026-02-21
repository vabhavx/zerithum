import React, { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AuditReadinessCard
 * Shows what % of expenses have receipts attached.
 * Green ≥ 80%, Amber 50–79%, Red < 50%
 */
export default function AuditReadinessCard({ expenses, onScrollToQueue }) {
    const [showDisclosure, setShowDisclosure] = useState(false);

    const total = expenses.length;
    const withReceipts = expenses.filter(
        (e) => e.receipt_url && e.receipt_url.trim() !== ""
    ).length;
    const missing = total - withReceipts;
    const pct = total > 0 ? Math.round((withReceipts / total) * 100) : 0;

    const { barColor, labelColor, statusLabel } =
        pct >= 80
            ? {
                barColor: "bg-emerald-500",
                labelColor: "text-emerald-400",
                statusLabel: "Audit Ready",
            }
            : pct >= 50
                ? {
                    barColor: "bg-amber-500",
                    labelColor: "text-amber-400",
                    statusLabel: "Needs Attention",
                }
                : {
                    barColor: "bg-[var(--z-danger)]",
                    labelColor: "text-[var(--z-danger)]",
                    statusLabel: "High Risk",
                };

    if (total === 0) return null;

    return (
        <section
            className="z-card p-5 mb-5"
            aria-label="Audit readiness indicator"
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-[var(--z-text-2)]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--z-text-1)] leading-tight">
                            Audit Readiness
                        </p>
                        <p className="text-[11px] text-[var(--z-text-3)] mt-0.5">
                            {withReceipts} of {total} expenses have receipts attached
                        </p>
                    </div>
                </div>

                {/* Right: percentage badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                        <p className={cn("text-[22px] font-semibold tabular-nums leading-none", labelColor)}>
                            {pct}%
                        </p>
                        <p className={cn("text-[11px] font-medium mt-0.5", labelColor)}>
                            {statusLabel}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
                <div
                    className="w-full h-1.5 rounded-full bg-[var(--z-bg-3)] overflow-hidden"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${pct}% of expenses have receipts`}
                >
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", barColor)}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Missing receipts callout */}
            {missing > 0 && (
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-[var(--z-text-3)]">
                        <span className="text-[var(--z-warn)] font-medium">{missing} expense{missing !== 1 ? "s" : ""}</span>{" "}
                        missing receipts
                    </p>
                    <button
                        onClick={onScrollToQueue}
                        className="text-[11px] text-[var(--z-accent)] hover:text-[var(--z-accent-2)] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                        View queue →
                    </button>
                </div>
            )}

            {/* Disclosure toggle */}
            <div className="mt-3 border-t border-[var(--z-border-1)] pt-3">
                <button
                    onClick={() => setShowDisclosure((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--z-text-3)] hover:text-[var(--z-text-2)] transition-colors focus-visible:outline-none focus-visible:underline"
                    aria-expanded={showDisclosure}
                >
                    <Info className="w-3 h-3" />
                    What is audit readiness?
                    {showDisclosure ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                    ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                    )}
                </button>
                {showDisclosure && (
                    <p className="mt-2 text-[11px] text-[var(--z-text-3)] leading-relaxed max-w-prose">
                        Audit readiness measures what percentage of your recorded expenses have a
                        receipt or supporting document attached. During a tax audit, missing receipts
                        can result in disallowed deductions. A score of 80% or higher is generally
                        considered low risk. This indicator is general guidance — not legal or tax advice.
                    </p>
                )}
            </div>
        </section>
    );
}
