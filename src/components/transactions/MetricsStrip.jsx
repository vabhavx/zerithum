import React from 'react';
import { AlertTriangle } from 'lucide-react';

function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MetricChip({ label, value, isMonetary, isMuted, isWarn, microcopy }) {
    return (
        <div className="flex flex-col gap-1 px-5 py-4 border-r border-[var(--z-border-1)] last:border-r-0 min-w-[140px]">
            <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] select-none">
                {label}
            </span>
            <span
                className={[
                    'font-mono tabular-nums text-[18px] font-semibold leading-none',
                    isWarn ? 'text-[var(--z-warn)]' : isMuted ? 'text-[var(--z-text-2)]' : 'text-[var(--z-text-1)]',
                ].join(' ')}
                aria-label={`${label}: ${isMonetary ? '$' : ''}${value}`}
            >
                {isMonetary ? '$' : ''}{value}
            </span>
            {microcopy && (
                <span className="text-[11px] text-[var(--z-text-3)]">{microcopy}</span>
            )}
        </div>
    );
}

export default function MetricsStrip({ transactions }) {
    const count = transactions.length;
    const gross = transactions.reduce((s, t) => s + (t.gross ?? t.amount ?? 0), 0);
    const fees = transactions.reduce((s, t) => s + (t.fees ?? 0), 0);
    const net = transactions.reduce((s, t) => s + (t.net ?? t.amount ?? 0), 0);
    const unmatched = transactions.filter(t => t.status === 'unmatched').length;

    return (
        <div
            className="flex items-stretch overflow-x-auto bg-[var(--z-bg-2)] border border-[var(--z-border-1)] rounded-lg"
            role="region"
            aria-label="Transaction summary metrics"
        >
            <MetricChip
                label="Transactions"
                value={count.toLocaleString()}
                isMuted
                microcopy="In current view"
            />
            <MetricChip
                label="Gross"
                value={fmt(gross)}
                isMonetary
                microcopy="Before fees"
            />
            <MetricChip
                label="Total Fees"
                value={fmt(fees)}
                isMonetary
                isMuted
                microcopy="Platform + processing"
            />
            <MetricChip
                label="Net"
                value={fmt(net)}
                isMonetary
                microcopy="After all fees"
            />
            <div className="flex flex-col gap-1 px-5 py-4 min-w-[140px]">
                <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] select-none">
                    Unmatched
                </span>
                <span
                    className={[
                        'font-mono tabular-nums text-[18px] font-semibold leading-none flex items-center gap-1.5',
                        unmatched > 0 ? 'text-[var(--z-warn)]' : 'text-[var(--z-text-2)]',
                    ].join(' ')}
                    aria-label={`${unmatched} unmatched transactions`}
                >
                    {unmatched > 0 && <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
                    {unmatched.toLocaleString()}
                </span>
                <span className="text-[11px] text-[var(--z-text-3)]">Needs review</span>
            </div>
        </div>
    );
}
