import React, { useState } from "react";
import { Info } from "lucide-react";

/**
 * RiskMeter — concentration risk indicator
 * @param {{ value: number, label: string, sublabel?: string, definition?: string }} props
 * value: 0–100
 */
export default function RiskMeter({ value = 0, label, sublabel, definition }) {
    const [showTip, setShowTip] = useState(false);

    const clampedValue = Math.max(0, Math.min(100, value));

    const getRiskBand = (v) => {
        if (v < 40) return { band: "Low", color: "#4ade80", bgColor: "rgba(74,222,128,0.12)", borderColor: "rgba(74,222,128,0.3)", textColor: "#4ade80" };
        if (v < 70) return { band: "Medium", color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)", textColor: "#f59e0b" };
        return { band: "High", color: "#FF5459", bgColor: "rgba(255,84,89,0.12)", borderColor: "rgba(255,84,89,0.3)", textColor: "#FF5459" };
    };

    const { band, color, bgColor, borderColor, textColor } = getRiskBand(clampedValue);

    // Segmented tick positions
    const segments = [
        { pct: 40, label: "40%" },
        { pct: 70, label: "70%" },
    ];

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--z-text-1)" }}>{label}</span>
                    {definition && (
                        <div className="relative">
                            <button
                                onMouseEnter={() => setShowTip(true)}
                                onMouseLeave={() => setShowTip(false)}
                                onFocus={() => setShowTip(true)}
                                onBlur={() => setShowTip(false)}
                                className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6]"
                                aria-label={`Definition: ${label}`}
                            >
                                <Info className="w-3.5 h-3.5" style={{ color: "var(--z-text-3)" }} />
                            </button>
                            {showTip && (
                                <div
                                    className="absolute z-50 left-5 top-0 w-56 rounded-lg border p-3 text-xs shadow-xl"
                                    style={{
                                        background: "var(--z-bg-3)",
                                        borderColor: "var(--z-border-2)",
                                        color: "var(--z-text-2)",
                                        lineHeight: 1.5,
                                    }}
                                    role="tooltip"
                                >
                                    {definition}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-xl font-semibold font-mono-financial"
                        style={{ color: "var(--z-text-1)" }}
                    >
                        {clampedValue.toFixed(1)}%
                    </span>
                    <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color: textColor, background: bgColor, borderColor }}
                    >
                        {band}
                    </span>
                </div>
            </div>

            {/* Track */}
            <div
                className="relative h-2.5 rounded-full overflow-hidden"
                style={{ background: "var(--z-bg-3)" }}
                role="progressbar"
                aria-valuenow={clampedValue}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${clampedValue.toFixed(1)}% — ${band} risk`}
            >
                {/* Fill */}
                <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${clampedValue}%`, background: color }}
                />
                {/* Segment markers */}
                {segments.map((seg) => (
                    <div
                        key={seg.pct}
                        className="absolute top-0 h-full w-px"
                        style={{ left: `${seg.pct}%`, background: "var(--z-bg-0)", opacity: 0.8 }}
                    />
                ))}
            </div>

            {/* Threshold legend */}
            <div
                className="flex justify-between mt-1.5 text-[10px]"
                style={{ color: "var(--z-text-3)" }}
                aria-hidden="true"
            >
                <span>Low risk</span>
                <span>40%</span>
                <span>70%</span>
                <span>High risk</span>
            </div>

            {sublabel && (
                <p className="mt-2 text-xs" style={{ color: "var(--z-text-3)" }}>{sublabel}</p>
            )}
        </div>
    );
}
