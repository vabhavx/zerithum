import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EvidenceTable — sortable data table for forensic evidence
 *
 * @param {{
 *   columns: Array<{ key: string, label: string, numeric?: boolean, render?: (val: any, row: any) => React.ReactNode }>,
 *   rows: Array<Record<string, any>>,
 *   caption?: string,
 *   emptyMessage?: string,
 * }} props
 */
export default function EvidenceTable({ columns = [], rows = [], caption, emptyMessage = "No data available." }) {
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sorted = useMemo(() => {
        if (!sortKey) return rows;
        return [...rows].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (av === undefined || bv === undefined) return 0;
            if (typeof av === "number" && typeof bv === "number") {
                return sortDir === "asc" ? av - bv : bv - av;
            }
            return sortDir === "asc"
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
    }, [rows, sortKey, sortDir]);

    return (
        <div
            className="rounded-lg overflow-hidden border"
            style={{ borderColor: "var(--z-border-1)" }}
            role="region"
            aria-label={caption ?? "Evidence table"}
        >
            {caption && (
                <div
                    className="px-4 py-2.5 text-xs font-semibold tracking-wide uppercase border-b"
                    style={{
                        color: "var(--z-text-3)",
                        background: "var(--z-bg-3)",
                        borderColor: "var(--z-border-1)",
                    }}
                >
                    {caption}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "var(--z-bg-3)", borderBottom: "1px solid var(--z-border-1)" }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "px-4 py-2.5 text-left font-medium text-xs tracking-wide select-none",
                                        col.numeric && "text-right"
                                    )}
                                    style={{ color: "var(--z-text-3)" }}
                                    scope="col"
                                >
                                    <button
                                        className="inline-flex items-center gap-1 hover:text-[var(--z-text-1)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
                                        onClick={() => handleSort(col.key)}
                                        aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                                    >
                                        {col.label}
                                        {sortKey === col.key ? (
                                            sortDir === "asc" ? (
                                                <ArrowUp className="w-3 h-3" />
                                            ) : (
                                                <ArrowDown className="w-3 h-3" />
                                            )
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                                        )}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-sm"
                                    style={{ color: "var(--z-text-3)", background: "var(--z-bg-2)" }}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sorted.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    style={{
                                        background: rowIdx % 2 === 0 ? "var(--z-bg-2)" : "var(--z-bg-1)",
                                        borderBottom: "1px solid var(--z-border-1)",
                                    }}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                "px-4 py-2.5 font-mono-financial text-xs",
                                                col.numeric && "text-right tabular-nums"
                                            )}
                                            style={{ color: "var(--z-text-2)" }}
                                        >
                                            {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
