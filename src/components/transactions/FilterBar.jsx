import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const PLATFORMS = ['youtube', 'patreon', 'gumroad', 'stripe', 'instagram', 'tiktok', 'shopify', 'substack'];
const PLATFORM_LABELS = {
    youtube: 'YouTube', patreon: 'Patreon', gumroad: 'Gumroad', stripe: 'Stripe',
    instagram: 'Instagram', tiktok: 'TikTok', shopify: 'Shopify', substack: 'Substack',
};
const STATUSES = ['completed', 'pending', 'refunded', 'failed', 'unmatched'];
const CATEGORIES = [
    'ad_revenue', 'sponsorship', 'affiliate', 'product_sale', 'membership', 'service', 'other',
];
const CATEGORY_LABELS = {
    ad_revenue: 'Ad Revenue', sponsorship: 'Sponsorship', affiliate: 'Affiliate',
    product_sale: 'Product Sale', membership: 'Membership', service: 'Service', other: 'Other',
};
const DATE_PRESETS = [
    { value: 'all', label: 'All time' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'this_month', label: 'This month' },
    { value: 'last_month', label: 'Last month' },
];

export default function FilterBar({ filters, onChange }) {
    const { search, platform, datePreset, status, category, amountMin, amountMax } = filters;

    const activeCount = [
        search, platform !== 'all', datePreset !== 'all', status !== 'all',
        category !== 'all', amountMin, amountMax,
    ].filter(Boolean).length;

    const handleClear = () => {
        onChange({
            search: '', platform: 'all', datePreset: 'all',
            status: 'all', category: 'all', amountMin: '', amountMax: '',
        });
    };

    const set = (key) => (val) => onChange({ ...filters, [key]: val });

    const inputBase =
        'h-9 text-sm bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] ' +
        'placeholder:text-[var(--z-text-3)] focus-visible:ring-1 focus-visible:ring-[var(--z-accent)] ' +
        'focus-visible:border-[var(--z-accent)] rounded-md transition-colors';

    const triggerBase =
        'h-9 text-sm bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-[var(--z-text-1)] ' +
        'hover:border-[var(--z-border-2)] focus-visible:ring-1 focus-visible:ring-[var(--z-accent)] ' +
        'focus-visible:border-[var(--z-accent)] rounded-md transition-colors [&>span]:truncate ' +
        'data-[placeholder]:text-[var(--z-text-3)]';

    return (
        <div className="bg-[var(--z-bg-2)] border border-[var(--z-border-1)] rounded-lg p-4 space-y-3">
            {/* Row 1: Search + active badge */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--z-text-3)] pointer-events-none"
                        aria-hidden="true"
                    />
                    <Input
                        id="txn-search"
                        type="search"
                        placeholder="Search by description, ID, platform…"
                        value={search}
                        onChange={(e) => set('search')(e.target.value)}
                        className={`${inputBase} pl-9 pr-4`}
                        aria-label="Search transactions"
                    />
                    {search && (
                        <button
                            onClick={() => set('search')('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--z-text-3)] hover:text-[var(--z-text-1)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--z-accent)] rounded"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--z-text-3)]" aria-hidden="true" />
                    <span className="text-xs text-[var(--z-text-3)]">Filters</span>
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--z-accent)] text-[10px] font-semibold text-black select-none">
                            {activeCount}
                        </span>
                    )}
                    {activeCount > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-xs text-[var(--z-accent)] hover:text-[var(--z-text-1)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--z-accent)] rounded px-1"
                            aria-label="Clear all filters"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Category filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {/* Platform */}
                <Select value={platform} onValueChange={set('platform')}>
                    <SelectTrigger className={triggerBase} aria-label="Filter by platform">
                        <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-3)] border-[var(--z-border-1)]">
                        <SelectItem value="all">All platforms</SelectItem>
                        {PLATFORMS.map((p) => (
                            <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Date preset */}
                <Select value={datePreset} onValueChange={set('datePreset')}>
                    <SelectTrigger className={triggerBase} aria-label="Filter by date range">
                        <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-3)] border-[var(--z-border-1)]">
                        {DATE_PRESETS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status */}
                <Select value={status} onValueChange={set('status')}>
                    <SelectTrigger className={triggerBase} aria-label="Filter by status">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-3)] border-[var(--z-border-1)]">
                        <SelectItem value="all">All statuses</SelectItem>
                        {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Category */}
                <Select value={category} onValueChange={set('category')}>
                    <SelectTrigger className={triggerBase} aria-label="Filter by category">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-3)] border-[var(--z-border-1)]">
                        <SelectItem value="all">All categories</SelectItem>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Amount Min */}
                <Input
                    type="number"
                    placeholder="Min $"
                    value={amountMin}
                    onChange={(e) => set('amountMin')(e.target.value)}
                    className={`${inputBase} font-mono`}
                    aria-label="Minimum amount filter"
                    min="0"
                />

                {/* Amount Max */}
                <Input
                    type="number"
                    placeholder="Max $"
                    value={amountMax}
                    onChange={(e) => set('amountMax')(e.target.value)}
                    className={`${inputBase} font-mono`}
                    aria-label="Maximum amount filter"
                    min="0"
                />
            </div>
        </div>
    );
}
