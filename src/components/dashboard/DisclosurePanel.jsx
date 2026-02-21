import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DisclosurePanel — "How we calculate this" inline panel.
 *
 * Renders a small `?` trigger button; clicking it opens a popover/card
 * beneath the tile with a plain-language explanation.
 *
 * Props:
 *  - title: e.g. "How we calculate Net Revenue"
 *  - body: string or JSX — plain-language explanation
 *  - formula: optional string, e.g. "Gross Revenue − Platform Fees = Net Revenue"
 *  - source: optional string, e.g. "Synced from YouTube, Patreon, Stripe"
 */
export default function DisclosurePanel({ title, body, formula, source }) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e) {
            if (e.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    return (
        <div className="relative inline-block">
            {/* Trigger */}
            <button
                ref={triggerRef}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label={title ? `How we calculate: ${title}` : "How we calculate this"}
                className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--z-bg-2)]",
                    open
                        ? "bg-[#32B8C6]/15 text-[#32B8C6]"
                        : "text-[var(--z-text-3)] hover:text-[var(--z-text-2)] hover:bg-[var(--z-bg-3)]"
                )}
            >
                <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Panel */}
            {open && (
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="false"
                    aria-label={title}
                    className={cn(
                        "absolute z-50 left-0 top-7 w-72",
                        "rounded-xl border border-[var(--z-border-2)] bg-[var(--z-bg-3)] shadow-2xl shadow-black/50 p-4",
                        "animate-in fade-in-0 slide-in-from-top-2 duration-150"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-[13px] font-semibold text-[var(--z-text-1)] leading-snug">
                            {title || "How we calculate this"}
                        </p>
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Close explanation"
                            className="text-[var(--z-text-3)] hover:text-[var(--z-text-2)] transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Body */}
                    <p className="text-[12px] text-[var(--z-text-2)] leading-relaxed mb-3">
                        {body}
                    </p>

                    {/* Formula — optional */}
                    {formula && (
                        <div className="rounded-lg bg-[var(--z-bg-2)] border border-[var(--z-border-1)] px-3 py-2 mb-3">
                            <p className="text-[11px] font-medium text-[var(--z-text-3)] mb-0.5 uppercase tracking-wide">
                                Formula
                            </p>
                            <p className="text-[12px] font-mono-financial text-[var(--z-text-1)]">
                                {formula}
                            </p>
                        </div>
                    )}

                    {/* Source — optional */}
                    {source && (
                        <div className="flex items-center gap-1.5">
                            <ChevronRight className="w-3 h-3 text-[#32B8C6] flex-shrink-0" />
                            <p className="text-[11px] text-[#32B8C6]">{source}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
