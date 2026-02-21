import React, { useState } from "react";
import { ChevronDown, ChevronRight, Calculator } from "lucide-react";
import { format } from "date-fns";

/**
 * MethodologyDisclosure — "How we calculate this" accordion panel
 *
 * @param {{
 *   formulas: Array<{ metric: string, formula: string, notes?: string }>,
 *   computedAt: string | Date,
 *   defaultOpen?: boolean,
 * }} props
 */
export default function MethodologyDisclosure({ formulas = [], computedAt, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const [openMetrics, setOpenMetrics] = useState({});

    const toggleMetric = (idx) =>
        setOpenMetrics((prev) => ({ ...prev, [idx]: !prev[idx] }));

    const formattedTs = computedAt
        ? format(new Date(computedAt), "MMM d, yyyy 'at' HH:mm 'UTC'")
        : null;

    return (
        <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--z-border-1)", background: "var(--z-bg-2)" }}
        >
            {/* Panel toggle */}
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--z-bg-3)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#32B8C6]"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="methodology-body"
            >
                <div className="flex items-center gap-2.5">
                    <Calculator className="w-4 h-4" style={{ color: "#32B8C6" }} aria-hidden="true" />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--z-text-1)" }}>
                            How we calculate this
                        </p>
                        {formattedTs && (
                            <p className="text-[11px]" style={{ color: "var(--z-text-3)" }}>
                                Last computed: {formattedTs}
                            </p>
                        )}
                    </div>
                </div>
                {open ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--z-text-3)" }} />
                ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--z-text-3)" }} />
                )}
            </button>

            {/* Body */}
            {open && (
                <div
                    id="methodology-body"
                    className="border-t divide-y"
                    style={{ borderColor: "var(--z-border-1)" }}
                >
                    {formulas.map((f, idx) => (
                        <div
                            key={idx}
                            className="px-4"
                            style={{ borderColor: "var(--z-border-1)" }}
                        >
                            {/* Metric toggle */}
                            <button
                                className="w-full flex items-center justify-between py-2.5 text-left hover:text-[var(--z-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
                                onClick={() => toggleMetric(idx)}
                                aria-expanded={!!openMetrics[idx]}
                                aria-controls={`formula-${idx}`}
                            >
                                <span className="text-xs font-semibold" style={{ color: "var(--z-text-2)" }}>
                                    {f.metric}
                                </span>
                                {openMetrics[idx] ? (
                                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--z-text-3)" }} />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--z-text-3)" }} />
                                )}
                            </button>

                            {/* Formula block */}
                            {openMetrics[idx] && (
                                <div id={`formula-${idx}`} className="pb-3">
                                    <pre
                                        className="text-xs rounded p-3 font-mono whitespace-pre-wrap leading-relaxed border"
                                        style={{
                                            background: "var(--z-bg-0)",
                                            color: "#32B8C6",
                                            borderColor: "var(--z-border-1)",
                                        }}
                                    >
                                        {f.formula}
                                    </pre>
                                    {f.notes && (
                                        <p
                                            className="mt-2 text-xs leading-relaxed"
                                            style={{ color: "var(--z-text-3)" }}
                                        >
                                            {f.notes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
