import React from "react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ConnectionCtaBanner
 *
 * Shown at the top of the dashboard when no platforms are connected.
 * Design principles: minimal, calm, serious — not an alert, not a popup.
 * One clear headline, one line of context, one action.
 *
 * Props:
 *  - onConnect: () => void — called when the button is clicked
 */
export default function ConnectionCtaBanner({ onConnect }) {
    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-5",
                "rounded-xl px-6 py-5 mb-8",
                "bg-[var(--z-bg-2)] border border-[#32B8C6]/20"
            )}
            role="status"
            aria-label="No platforms connected"
        >
            {/* Left — message */}
            <div className="flex items-start gap-4">
                {/* Subtle icon */}
                <div className="w-9 h-9 rounded-lg bg-[#32B8C6]/8 border border-[#32B8C6]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Link2 className="w-4 h-4 text-[#32B8C6]" />
                </div>

                <div>
                    <p className="text-[14px] font-semibold text-[var(--z-text-1)] leading-snug mb-0.5">
                        No platforms connected
                    </p>
                    <p className="text-[13px] text-[var(--z-text-3)] leading-relaxed max-w-md">
                        Connect YouTube, Patreon, Stripe, or any other platform to populate your dashboard with real revenue figures.
                    </p>
                </div>
            </div>

            {/* Right — single action */}
            <button
                onClick={onConnect}
                className={cn(
                    "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg",
                    "text-[13px] font-semibold text-[#09090B] bg-[#32B8C6]",
                    "hover:bg-[#21808D] transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg-0)]"
                )}
                aria-label="Connect your first platform"
            >
                <Link2 className="w-3.5 h-3.5" />
                Connect a platform
            </button>
        </div>
    );
}
