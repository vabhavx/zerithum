import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { CATEGORIES } from "@/lib/expenseCategories";

/**
 * HelpDrawer
 * "Learn what counts" category guide slide-out panel.
 * Triggered by a link inside ExpenseModal or the table.
 */
export default function HelpDrawer({ open, onClose }) {
    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Learn what expense categories count"
                className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--z-bg-2)] border-l border-[var(--z-border-1)] z-50 flex flex-col"
                style={{ boxShadow: "-4px 0 32px rgba(0,0,0,0.5)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--z-border-1)]">
                    <div>
                        <h2 className="text-[15px] font-semibold text-[var(--z-text-1)]">
                            What expense categories count?
                        </h2>
                        <p className="text-[11px] text-[var(--z-text-3)] mt-0.5">
                            General guidance for creator businesses
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--z-bg-3)] text-[var(--z-text-3)] hover:text-[var(--z-text-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                        aria-label="Close help drawer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Disclaimer */}
                <div className="mx-6 mt-4 mb-2 px-3 py-2.5 bg-[var(--z-bg-3)] border border-[var(--z-border-1)] rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--z-warn)] flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[var(--z-text-3)] leading-relaxed">
                        <strong className="text-[var(--z-text-2)] font-medium">General guidance only.</strong>{" "}
                        Deductibility depends on your specific situation and jurisdiction.
                        Consult a qualified accountant or tax advisor before filing.
                    </p>
                </div>

                {/* Category list */}
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-0">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <div
                            key={key}
                            className="py-4 border-b border-[var(--z-border-1)] last:border-0"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-base leading-none">{cat.icon}</span>
                                <span className="text-[13px] font-medium text-[var(--z-text-1)]">
                                    {cat.label}
                                </span>
                                <DeductibilityBadge value={cat.defaultDeductible} />
                            </div>
                            <p className="text-[12px] text-[var(--z-text-3)] leading-relaxed">
                                {cat.description}
                            </p>
                            <p className="text-[11px] text-[var(--z-text-3)] mt-1.5 italic">
                                Examples: {cat.examples}
                            </p>
                            <p className="text-[11px] text-[var(--z-text-2)] mt-1.5 leading-relaxed">
                                {cat.deductibilityHint}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--z-border-1)]">
                    <p className="text-[11px] text-[var(--z-text-3)] leading-relaxed">
                        Zerithum provides general expense guidance to help you organize your records.
                        This is <strong className="text-[var(--z-text-2)]">not tax advice</strong>.
                        Always verify deductions with a licensed CPA or tax professional.
                    </p>
                </div>
            </aside>
        </>
    );
}

function DeductibilityBadge({ value }) {
    const map = {
        yes: { label: "Typically deductible", classes: "bg-emerald-500/10 text-emerald-400" },
        partial: { label: "Partial deduction", classes: "bg-amber-500/10 text-amber-400" },
        no: { label: "Not deductible", classes: "bg-[var(--z-danger)]/10 text-[var(--z-danger)]" },
    };
    const { label, classes } = map[value] || map.partial;
    return (
        <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${classes}`}>
            {label}
        </span>
    );
}
