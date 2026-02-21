import React, { useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORM_LABELS = {
    youtube: 'YouTube', patreon: 'Patreon', gumroad: 'Gumroad', stripe: 'Stripe',
    instagram: 'Instagram', tiktok: 'TikTok', shopify: 'Shopify', substack: 'Substack',
};
const CATEGORY_LABELS = {
    ad_revenue: 'Ad Revenue', sponsorship: 'Sponsorship', affiliate: 'Affiliate',
    product_sale: 'Product Sale', membership: 'Membership', service: 'Service', other: 'Other',
};
const SOURCE_LABELS = {
    api: 'API', csv: 'CSV Import', manual: 'Manual', webhook: 'Webhook',
};

function fmt(n) {
    if (n == null) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }) {
    const map = {
        completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        refunded: 'text-[var(--z-danger)] bg-[var(--z-danger)]/10 border-[var(--z-danger)]/20',
        failed: 'text-[var(--z-danger)] bg-[var(--z-danger)]/10 border-[var(--z-danger)]/20',
        unmatched: 'text-[var(--z-warn)] bg-[var(--z-warn)]/10 border-[var(--z-warn)]/20',
        reviewed: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    };
    const cls = map[status] || 'text-[var(--z-text-3)] bg-[var(--z-bg-3)] border-[var(--z-border-1)]';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
    return (
        <span className={`inline-flex items-center h-5 px-1.5 rounded border text-[10px] font-semibold uppercase tracking-wider select-none whitespace-nowrap ${cls}`}>
            {label}
        </span>
    );
}

function SortIcon({ field, sortField, sortDir }) {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30 ml-1 flex-shrink-0" />;
    return sortDir === 'asc'
        ? <ChevronUp className="w-3 h-3 ml-1 text-[var(--z-accent)] flex-shrink-0" />
        : <ChevronDown className="w-3 h-3 ml-1 text-[var(--z-accent)] flex-shrink-0" />;
}

function ColHeader({ label, field, sortField, sortDir, onSort, className = '', numeric = false }) {
    const isActive = sortField === field;
    return (
        <th
            className={`h-10 text-[11px] font-medium uppercase tracking-widest whitespace-nowrap select-none ${className}`}
            aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
            {onSort ? (
                <button
                    onClick={() => onSort(field)}
                    className={[
                        'flex items-center h-full px-3 w-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--z-accent)] rounded',
                        numeric ? 'justify-end' : 'justify-start',
                        isActive ? 'text-[var(--z-accent)]' : 'text-[var(--z-text-3)] hover:text-[var(--z-text-2)]',
                    ].join(' ')}
                    aria-label={`Sort by ${label}`}
                >
                    {!numeric && <>{label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} /></>}
                    {numeric && <><SortIcon field={field} sortField={sortField} sortDir={sortDir} />{label}</>}
                </button>
            ) : (
                <span className={`flex items-center h-full px-3 text-[var(--z-text-3)] ${numeric ? 'justify-end' : 'justify-start'}`}>
                    {label}
                </span>
            )}
        </th>
    );
}

function SkeletonRow({ cols }) {
    return (
        <tr className="border-b border-[var(--z-border-1)]">
            <td className="px-3 py-3"><Skeleton className="h-4 w-4 rounded" /></td>
            {Array.from({ length: cols - 1 }).map((_, i) => (
                <td key={i} className="px-3 py-3">
                    <Skeleton className="h-4 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
                </td>
            ))}
        </tr>
    );
}

const TransactionRowItem = React.memo(function TransactionRowItem({
    txn, isSelected, onSelect, onClick, isFocused, rowRef,
}) {
    return (
        <tr
            ref={rowRef}
            tabIndex={0}
            role="row"
            aria-selected={isSelected}
            data-focused={isFocused || undefined}
            onClick={() => onClick(txn)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(txn); }
            }}
            className={[
                'border-b border-[var(--z-border-1)] cursor-pointer outline-none group transition-colors duration-75',
                'hover:bg-[var(--z-bg-3)] focus-visible:bg-[var(--z-bg-3)]',
                isSelected ? 'bg-[var(--z-accent)]/5' : '',
            ].join(' ')}
        >
            {/* Checkbox */}
            <td className="px-3 py-0 w-10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center h-full py-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(txn.id)}
                        aria-label={`Select transaction ${txn.description}`}
                        className="w-3.5 h-3.5 rounded border border-[var(--z-border-2)] bg-[var(--z-bg-3)] accent-[var(--z-accent)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                    />
                </div>
            </td>

            {/* Date */}
            <td className="px-3 py-3 w-[110px]">
                <span className="text-xs font-mono text-[var(--z-text-2)] whitespace-nowrap">
                    {format(new Date(txn.date), 'MMM d, yyyy')}
                </span>
            </td>

            {/* Platform */}
            <td className="px-3 py-3 w-[110px]">
                <span className="text-xs text-[var(--z-text-2)] whitespace-nowrap">
                    {PLATFORM_LABELS[txn.platform] || txn.platform}
                </span>
            </td>

            {/* Description */}
            <td className="px-3 py-3 min-w-[180px] max-w-[280px]">
                <p className="text-sm text-[var(--z-text-1)] truncate leading-tight">{txn.description}</p>
                {txn.platformTxnId && (
                    <p className="text-[10px] font-mono text-[var(--z-text-3)] truncate mt-0.5">{txn.platformTxnId}</p>
                )}
            </td>

            {/* Gross */}
            <td className="px-3 py-3 text-right w-[100px]">
                <span className="font-mono text-sm tabular-nums text-[var(--z-text-2)]">
                    ${fmt(txn.gross ?? txn.amount)}
                </span>
            </td>

            {/* Fees */}
            <td className="px-3 py-3 text-right w-[90px]">
                <span className="font-mono text-sm tabular-nums text-[var(--z-warn)]/80">
                    {txn.fees > 0 ? `−$${fmt(txn.fees)}` : '—'}
                </span>
            </td>

            {/* Net */}
            <td className="px-3 py-3 text-right w-[100px]">
                <span className="font-mono text-sm tabular-nums font-semibold text-[var(--z-text-1)]">
                    ${fmt(txn.net ?? txn.amount)}
                </span>
            </td>

            {/* Category */}
            <td className="px-3 py-3 w-[130px]">
                <span className="text-xs text-[var(--z-text-3)] whitespace-nowrap">
                    {CATEGORY_LABELS[txn.category] || txn.category || '—'}
                </span>
            </td>

            {/* Status */}
            <td className="px-3 py-3 w-[110px]">
                <StatusBadge status={txn.status} />
            </td>

            {/* Source */}
            <td className="px-3 py-3 w-[90px]">
                <span className="text-[11px] text-[var(--z-text-3)]">
                    {SOURCE_LABELS[txn.source] || txn.source || '—'}
                </span>
            </td>

            {/* Last Updated */}
            <td className="px-3 py-3 w-[115px]">
                <span className="text-[11px] font-mono text-[var(--z-text-3)] whitespace-nowrap">
                    {txn.lastUpdated ? format(new Date(txn.lastUpdated), 'MMM d, HH:mm') : '—'}
                </span>
            </td>
        </tr>
    );
});

export default function TransactionsTable({
    transactions,
    isLoading,
    sortField,
    sortDir,
    onSort,
    selectedIds,
    onSelectRow,
    onSelectAll,
    onRowClick,
    focusedIndex,
    onFocusRow,
    emptyState,
}) {
    const rowRefs = useRef([]);

    const handleKeyDown = useCallback((e, idx) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.min(idx + 1, transactions.length - 1);
            onFocusRow(next);
            rowRefs.current[next]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = Math.max(idx - 1, 0);
            onFocusRow(prev);
            rowRefs.current[prev]?.focus();
        }
    }, [transactions, onFocusRow]);

    const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t.id));
    const someSelected = !allSelected && transactions.some(t => selectedIds.has(t.id));

    const COLS = 11;

    return (
        <div className="bg-[var(--z-bg-2)] border border-[var(--z-border-1)] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table
                    className="w-full border-collapse"
                    role="grid"
                    aria-label="Transactions ledger"
                    aria-rowcount={isLoading ? -1 : transactions.length}
                >
                    <thead className="sticky top-0 bg-[var(--z-bg-1)] border-b border-[var(--z-border-1)] z-10">
                        <tr role="row">
                            {/* Select all */}
                            <th className="px-3 py-0 w-10 h-10">
                                <div className="flex items-center justify-center h-full">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={() => onSelectAll()}
                                        aria-label="Select all transactions"
                                        className="w-3.5 h-3.5 rounded border border-[var(--z-border-2)] bg-[var(--z-bg-3)] accent-[var(--z-accent)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                                    />
                                </div>
                            </th>
                            <ColHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                            <ColHeader label="Platform" field="platform" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                            <ColHeader label="Description" field="description" sortField={sortField} sortDir={sortDir} onSort={null} />
                            <ColHeader label="Gross" field="gross" sortField={sortField} sortDir={sortDir} onSort={onSort} numeric />
                            <ColHeader label="Fees" field="fees" sortField={sortField} sortDir={sortDir} onSort={onSort} numeric />
                            <ColHeader label="Net" field="net" sortField={sortField} sortDir={sortDir} onSort={onSort} numeric />
                            <ColHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                            <ColHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                            <ColHeader label="Source" field="source" sortField={sortField} sortDir={sortDir} onSort={null} />
                            <ColHeader label="Last Updated" field="lastUpdated" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                        </tr>
                    </thead>
                    <tbody role="rowgroup">
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={COLS} />)
                        ) : transactions.length === 0 ? (
                            emptyState ? (
                                <tr>
                                    <td colSpan={COLS} className="py-0">
                                        {emptyState}
                                    </td>
                                </tr>
                            ) : null
                        ) : (
                            transactions.map((txn, idx) => (
                                <TransactionRowItem
                                    key={txn.id}
                                    txn={txn}
                                    isSelected={selectedIds.has(txn.id)}
                                    onSelect={onSelectRow}
                                    onClick={onRowClick}
                                    isFocused={focusedIndex === idx}
                                    rowRef={(el) => (rowRefs.current[idx] = el)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer count row */}
            {!isLoading && transactions.length > 0 && (
                <div className="px-4 py-3 border-t border-[var(--z-border-1)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--z-text-3)]">
                        {transactions.length.toLocaleString()} row{transactions.length !== 1 ? 's' : ''}
                        {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
                    </span>
                    <span className="text-[11px] text-[var(--z-text-3)]">
                        Click a row to view details · Arrow keys to navigate
                    </span>
                </div>
            )}
        </div>
    );
}
