import React from 'react';
import { Tag, CheckCircle2, Download } from 'lucide-react';

export default function BulkActionBar({ selectedCount, onCategorize, onMarkReviewed, onExport, onClear }) {
    if (selectedCount === 0) return null;

    const btnBase =
        'flex items-center gap-2 h-9 px-4 rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--z-bg-2)]';

    return (
        <div
            role="toolbar"
            aria-label="Bulk actions for selected transactions"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[var(--z-bg-3)] border border-[var(--z-border-2)] rounded-xl px-4 py-3 shadow-2xl shadow-black/60"
            style={{ minWidth: 'max-content' }}
        >
            {/* Count chip */}
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--z-border-1)]">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded bg-[var(--z-accent)] text-black text-xs font-bold tabular-nums select-none">
                    {selectedCount}
                </span>
                <span className="text-sm text-[var(--z-text-2)]">
                    {selectedCount === 1 ? 'row selected' : 'rows selected'}
                </span>
            </div>

            {/* Actions */}
            <button
                onClick={onCategorize}
                className={`${btnBase} bg-[var(--z-bg-2)] border border-[var(--z-border-1)] text-[var(--z-text-2)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-1)]`}
                aria-label="Categorize selected transactions"
            >
                <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                Categorize
            </button>

            <button
                onClick={onMarkReviewed}
                className={`${btnBase} bg-[var(--z-bg-2)] border border-[var(--z-border-1)] text-[var(--z-text-2)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-1)]`}
                aria-label="Mark selected transactions as reviewed"
            >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Mark Reviewed
            </button>

            <button
                onClick={onExport}
                className={`${btnBase} bg-[var(--z-accent)] text-black hover:opacity-90`}
                aria-label={`Export ${selectedCount} selected transactions as CSV`}
            >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Export Selected
            </button>

            {/* Dismiss */}
            <div className="pl-3 border-l border-[var(--z-border-1)]">
                <button
                    onClick={onClear}
                    className="text-xs text-[var(--z-text-3)] hover:text-[var(--z-text-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] rounded px-1"
                    aria-label="Deselect all rows (Escape)"
                >
                    Deselect all
                </button>
            </div>
        </div>
    );
}
