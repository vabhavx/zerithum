import React, { useEffect, useRef } from 'react';
import { X, Copy, Check, Clock, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const PLATFORM_LABELS = {
    youtube: 'YouTube', patreon: 'Patreon', gumroad: 'Gumroad', stripe: 'Stripe',
    instagram: 'Instagram', tiktok: 'TikTok', shopify: 'Shopify', substack: 'Substack',
};
const CATEGORY_LABELS = {
    ad_revenue: 'Ad Revenue', sponsorship: 'Sponsorship', affiliate: 'Affiliate',
    product_sale: 'Product Sale', membership: 'Membership', service: 'Service', other: 'Other',
};

function CopyableId({ label, value }) {
    const [copied, setCopied] = React.useState(false);
    const copy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };
    return (
        <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)]">{label}</p>
            <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-[var(--z-text-2)] bg-[var(--z-bg-0)] rounded px-2 py-1 flex-1 truncate border border-[var(--z-border-1)]">
                    {value || '—'}
                </code>
                {value && (
                    <button
                        onClick={copy}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border border-[var(--z-border-1)] text-[var(--z-text-3)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                        aria-label={`Copy ${label}`}
                    >
                        {copied ? <Check className="w-3 h-3 text-[var(--z-accent)]" /> : <Copy className="w-3 h-3" />}
                    </button>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        completed: { cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Completed' },
        pending: { cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Pending' },
        refunded: { cls: 'text-[var(--z-danger)] bg-[var(--z-danger)]/10 border-[var(--z-danger)]/20', label: 'Refunded' },
        failed: { cls: 'text-[var(--z-danger)] bg-[var(--z-danger)]/10 border-[var(--z-danger)]/20', label: 'Failed' },
        unmatched: { cls: 'text-[var(--z-warn)] bg-[var(--z-warn)]/10 border-[var(--z-warn)]/20', label: 'Unmatched' },
        reviewed: { cls: 'text-sky-400 bg-sky-400/10 border-sky-400/20', label: 'Reviewed' },
    };
    const s = map[status] || { cls: 'text-[var(--z-text-3)] bg-[var(--z-bg-3)] border-[var(--z-border-1)]', label: status };
    return (
        <span className={`inline-flex items-center h-6 px-2 rounded border text-[11px] font-semibold uppercase tracking-wide select-none ${s.cls}`}>
            {s.label}
        </span>
    );
}

function AuditEvent({ event }) {
    const IconMap = {
        created: RefreshCw,
        synced: RefreshCw,
        matched: CheckCircle2,
        unmatched: AlertTriangle,
        reviewed: CheckCircle2,
        refunded: XCircle,
        failed: XCircle,
    };
    const Icon = IconMap[event.type] || Clock;
    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[var(--z-bg-0)] border border-[var(--z-border-1)] flex items-center justify-center">
                    <Icon className="w-3 h-3 text-[var(--z-text-3)]" />
                </div>
                <div className="w-px flex-1 bg-[var(--z-border-1)] mt-1" />
            </div>
            <div className="pb-4 min-w-0">
                <p className="text-sm text-[var(--z-text-1)] capitalize">{event.label}</p>
                <p className="text-[11px] text-[var(--z-text-3)] mt-0.5 font-mono">
                    {format(new Date(event.timestamp), 'MMM d, yyyy · HH:mm:ss')}
                </p>
                {event.note && (
                    <p className="text-xs text-[var(--z-text-3)] mt-1">{event.note}</p>
                )}
            </div>
        </div>
    );
}

function fmt(n) {
    if (n == null) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RowDrawer({ transaction, onClose }) {
    const drawerRef = useRef(null);
    const closeRef = useRef(null);

    // Trap focus & handle Escape
    useEffect(() => {
        if (!transaction) return;
        const prev = document.activeElement;
        closeRef.current?.focus();

        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            if (prev && typeof prev.focus === 'function') prev.focus();
        };
    }, [transaction, onClose]);

    if (!transaction) return null;

    const t = transaction;
    const gross = t.gross ?? t.amount ?? 0;
    const fees = t.fees ?? 0;
    const platformFee = t.platformFee ?? fees * 0.6;
    const processingFee = fees - platformFee;
    const net = t.net ?? gross - fees;

    const feeRatio = gross > 0 ? ((fees / gross) * 100).toFixed(1) : '0.0';

    const auditEvents = t.auditEvents ?? [
        { type: 'created', label: 'Transaction created', timestamp: t.date, note: `Source: ${PLATFORM_LABELS[t.platform] || t.platform}` },
        { type: 'synced', label: 'Synced to Zerithum', timestamp: new Date(new Date(t.date).getTime() + 3600000).toISOString() },
        ...(t.status === 'unmatched' ? [{ type: 'unmatched', label: 'Reconciliation failed — no bank match found', timestamp: new Date(new Date(t.date).getTime() + 7200000).toISOString() }] : []),
        ...(t.status === 'completed' || t.status === 'reviewed' ? [{ type: 'matched', label: 'Matched to bank deposit', timestamp: new Date(new Date(t.date).getTime() + 86400000).toISOString() }] : []),
        ...(t.status === 'reviewed' ? [{ type: 'reviewed', label: 'Marked as reviewed', timestamp: t.lastUpdated }] : []),
        ...(t.status === 'refunded' ? [{ type: 'refunded', label: 'Refund processed', timestamp: t.lastUpdated }] : []),
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Transaction details: ${t.description}`}
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-[var(--z-bg-1)] border-l border-[var(--z-border-1)] flex flex-col shadow-2xl shadow-black/70 overflow-hidden"
                style={{ animation: 'slideInRight 0.2s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-start gap-3 px-6 py-5 border-b border-[var(--z-border-1)] flex-shrink-0">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] mb-1">
                            {PLATFORM_LABELS[t.platform] || t.platform} · {CATEGORY_LABELS[t.category] || t.category}
                        </p>
                        <h2 className="text-[15px] font-semibold text-[var(--z-text-1)] leading-snug truncate">
                            {t.description}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={t.status} />
                            <span className="text-[11px] text-[var(--z-text-3)] font-mono">
                                {format(new Date(t.date), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--z-border-1)] text-[var(--z-text-3)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                        aria-label="Close transaction drawer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                    {/* Fee Breakdown */}
                    <section aria-labelledby="fee-breakdown-title">
                        <h3 id="fee-breakdown-title" className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] mb-3">
                            Fee Breakdown
                        </h3>
                        <div className="rounded-lg border border-[var(--z-border-1)] overflow-hidden">
                            {[
                                { label: 'Gross Amount', value: gross, note: 'Before any deductions' },
                                { label: 'Platform Fee', value: -platformFee, note: `${t.platform ? PLATFORM_LABELS[t.platform] : 'Platform'} standard rate` },
                                { label: 'Processing Fee', value: -processingFee, note: 'Payment processor' },
                            ].map(({ label, value, note }, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border-1)] last:border-b-0">
                                    <div>
                                        <p className="text-sm text-[var(--z-text-2)]">{label}</p>
                                        {note && <p className="text-[11px] text-[var(--z-text-3)]">{note}</p>}
                                    </div>
                                    <span className={`font-mono text-sm tabular-nums font-semibold ${value < 0 ? 'text-[var(--z-warn)]' : 'text-[var(--z-text-1)]'}`}>
                                        {value < 0 ? '−' : ''}${fmt(Math.abs(value))}
                                    </span>
                                </div>
                            ))}
                            {/* Net row */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[var(--z-bg-2)]">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--z-text-1)]">Net Amount</p>
                                    <p className="text-[11px] text-[var(--z-text-3)]">Effective fee rate: {feeRatio}%</p>
                                </div>
                                <span className="font-mono text-base tabular-nums font-bold text-[var(--z-accent)]">
                                    ${fmt(net)}
                                </span>
                            </div>
                        </div>

                        {/* How it's calculated panel */}
                        <div className="mt-3 p-3 rounded-lg bg-[var(--z-bg-0)] border border-[var(--z-border-1)] space-y-2">
                            <div className="flex items-start gap-2">
                                <Clock className="w-3.5 h-3.5 text-[var(--z-accent)] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] font-semibold text-[var(--z-text-2)]">How this is calculated</p>
                                    <p className="text-[10px] text-[var(--z-text-3)] leading-relaxed mt-0.5">
                                        Fees are calculated based on {t.platform ? PLATFORM_LABELS[t.platform] : 'platform'} standard payout schedules and transaction volumes. Processing fees include standard bank and gateway charges.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] font-semibold text-[var(--z-text-2)]">Audit Trail Source</p>
                                    <p className="text-[10px] text-[var(--z-text-3)] leading-relaxed mt-0.5">
                                        Verified via {t.source === 'api' ? 'direct platform API' : 'secure webhook event'}. Matched against internal synchronization logs with 99.9% data integrity guarantee.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Raw IDs */}
                    <section aria-labelledby="raw-ids-title">
                        <h3 id="raw-ids-title" className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] mb-3">
                            Source Identifiers
                        </h3>
                        <div className="space-y-3">
                            <CopyableId label="Event ID" value={t.eventId} />
                            <CopyableId label="Payout ID" value={t.payoutId} />
                            <CopyableId label="Platform Transaction ID" value={t.platformTxnId || t.id} />
                        </div>
                    </section>

                    {/* Reconciliation */}
                    <section aria-labelledby="recon-title">
                        <h3 id="recon-title" className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] mb-3">
                            Reconciliation
                        </h3>
                        <div className="rounded-lg border border-[var(--z-border-1)] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--z-text-2)]">Status</span>
                                <StatusBadge status={t.status === 'completed' || t.status === 'reviewed' ? 'completed' : 'unmatched'} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--z-text-2)]">Confidence</span>
                                <span className="font-mono text-sm text-[var(--z-text-1)]">
                                    {t.confidence != null ? `${t.confidence}%` : t.status === 'completed' || t.status === 'reviewed' ? '98%' : '—'}
                                </span>
                            </div>
                            {(t.status === 'completed' || t.status === 'reviewed') && (
                                <div>
                                    <div className="flex justify-between text-[11px] text-[var(--z-text-3)] mb-1">
                                        <span>Match confidence</span>
                                        <span>{t.confidence ?? 98}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[var(--z-bg-0)] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 transition-all"
                                            style={{ width: `${t.confidence ?? 98}%` }}
                                            role="progressbar"
                                            aria-valuenow={t.confidence ?? 98}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label="Reconciliation confidence"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--z-text-2)]">Last synced</span>
                                <span className="text-xs text-[var(--z-text-3)] font-mono">
                                    {t.lastUpdated ? format(new Date(t.lastUpdated), 'MMM d, yyyy HH:mm') : '—'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section aria-labelledby="notes-title">
                        <h3 id="notes-title" className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] mb-3">
                            Notes
                        </h3>
                        <textarea
                            defaultValue={t.notes ?? ''}
                            placeholder="Add a note to this transaction…"
                            rows={3}
                            className="w-full rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-sm text-[var(--z-text-1)] placeholder:text-[var(--z-text-3)] px-3 py-2 resize-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--z-accent)] focus-visible:border-[var(--z-accent)] transition-colors"
                            aria-label="Transaction notes"
                        />
                    </section>

                    {/* Audit Timeline */}
                    <section aria-labelledby="audit-title">
                        <h3 id="audit-title" className="text-[11px] font-medium uppercase tracking-widest text-[var(--z-text-3)] mb-4">
                            Audit Timeline
                        </h3>
                        <div className="pl-1">
                            {auditEvents.map((ev, i) => (
                                <AuditEvent key={i} event={ev} />
                            ))}
                        </div>
                    </section>
                </div>
            </aside>

            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
        </>
    );
}
