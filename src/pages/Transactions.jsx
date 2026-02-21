import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Link2 } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { generateCSV, downloadCSV } from '@/utils/csvExport';
import { Button } from '@/components/ui/button';
import MetricsStrip from '@/components/transactions/MetricsStrip';
import FilterBar from '@/components/transactions/FilterBar';
import SavedViews from '@/components/transactions/SavedViews';
import TransactionsTable from '@/components/transactions/TransactionsTable';
import RowDrawer from '@/components/transactions/RowDrawer';
import BulkActionBar from '@/components/transactions/BulkActionBar';

// ═══════════════════════════════════════════════════
//  SEED DATA  (30 transactions, mixed statuses)
// ═══════════════════════════════════════════════════
const now = new Date();
function daysAgo(n) { return subDays(now, n).toISOString(); }
function randomId(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 11).toUpperCase()}`; }

const SEED_TRANSACTIONS = [
  { id: 'txn_001', date: daysAgo(1), platform: 'youtube', description: 'YouTube Partner Program — Jan 2026', gross: 4820.00, fees: 289.20, net: 4530.80, category: 'ad_revenue', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('yt'), lastUpdated: daysAgo(0.5) },
  { id: 'txn_002', date: daysAgo(2), platform: 'patreon', description: 'Patreon monthly patron payouts', gross: 2150.00, fees: 193.50, net: 1956.50, category: 'membership', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('pt'), lastUpdated: daysAgo(1) },
  { id: 'txn_003', date: daysAgo(3), platform: 'stripe', description: 'Notion template bundle — Premium', gross: 399.00, fees: 14.37, net: 384.63, category: 'product_sale', status: 'completed', source: 'webhook', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('str'), lastUpdated: daysAgo(2) },
  { id: 'txn_004', date: daysAgo(4), platform: 'gumroad', description: 'eBook: Creator Finance Masterclass', gross: 97.00, fees: 9.70, net: 87.30, category: 'product_sale', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('gm'), lastUpdated: daysAgo(3) },
  { id: 'txn_005', date: daysAgo(5), platform: 'instagram', description: 'Brand deal — SkinCo Q1 campaign', gross: 3500.00, fees: 0, net: 3500.00, category: 'sponsorship', status: 'unmatched', source: 'manual', eventId: randomId('evt'), payoutId: null, platformTxnId: randomId('ig'), lastUpdated: daysAgo(4) },
  { id: 'txn_006', date: daysAgo(6), platform: 'youtube', description: 'YouTube Super Thanks — Q4 bonus', gross: 812.40, fees: 48.74, net: 763.66, category: 'ad_revenue', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('yt'), lastUpdated: daysAgo(5) },
  { id: 'txn_007', date: daysAgo(7), platform: 'stripe', description: 'Cohort course — Winter 2026 batch', gross: 2800.00, fees: 101.20, net: 2698.80, category: 'service', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('str'), lastUpdated: daysAgo(6) },
  { id: 'txn_008', date: daysAgo(8), platform: 'tiktok', description: 'TikTok Creator Fund — Jan', gross: 328.90, fees: 0, net: 328.90, category: 'ad_revenue', status: 'pending', source: 'api', eventId: randomId('evt'), payoutId: null, platformTxnId: randomId('tt'), lastUpdated: daysAgo(7) },
  { id: 'txn_009', date: daysAgo(9), platform: 'gumroad', description: 'Preset pack — Lightroom Pro Vol 3', gross: 49.00, fees: 4.90, net: 44.10, category: 'product_sale', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('gm'), lastUpdated: daysAgo(8) },
  { id: 'txn_010', date: daysAgo(10), platform: 'stripe', description: 'Refund — Course cancellation', gross: -299.00, fees: -10.78, net: -288.22, category: 'service', status: 'refunded', source: 'webhook', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('str'), lastUpdated: daysAgo(9) },
  { id: 'txn_011', date: daysAgo(11), platform: 'patreon', description: 'Patron pledge — Tier 3 exclusive', gross: 500.00, fees: 45.00, net: 455.00, category: 'membership', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('pt'), lastUpdated: daysAgo(10) },
  { id: 'txn_012', date: daysAgo(12), platform: 'youtube', description: 'Channel membership payouts', gross: 1240.00, fees: 124.00, net: 1116.00, category: 'membership', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('yt'), lastUpdated: daysAgo(11) },
  { id: 'txn_013', date: daysAgo(14), platform: 'shopify', description: 'Merch drop — Hoodies & Caps', gross: 1875.50, fees: 112.53, net: 1762.97, category: 'product_sale', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('sh'), lastUpdated: daysAgo(13) },
  { id: 'txn_014', date: daysAgo(15), platform: 'instagram', description: 'Affiliate commission — TechGear', gross: 214.75, fees: 0, net: 214.75, category: 'affiliate', status: 'unmatched', source: 'manual', eventId: randomId('evt'), payoutId: null, platformTxnId: randomId('ig'), lastUpdated: daysAgo(14) },
  { id: 'txn_015', date: daysAgo(16), platform: 'stripe', description: '1:1 Consulting — Brand strategy', gross: 800.00, fees: 28.80, net: 771.20, category: 'service', status: 'reviewed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('str'), lastUpdated: daysAgo(15) },
  { id: 'txn_016', date: daysAgo(18), platform: 'substack', description: 'Newsletter paid subscriptions', gross: 960.00, fees: 96.00, net: 864.00, category: 'membership', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('ss'), lastUpdated: daysAgo(17) },
  { id: 'txn_017', date: daysAgo(19), platform: 'gumroad', description: 'Audio sample kit — Lo-fi Vol 2', gross: 29.00, fees: 2.90, net: 26.10, category: 'product_sale', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('gm'), lastUpdated: daysAgo(18) },
  { id: 'txn_018', date: daysAgo(21), platform: 'youtube', description: 'YouTube Premium revenue share', gross: 380.20, fees: 22.81, net: 357.39, category: 'ad_revenue', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('yt'), lastUpdated: daysAgo(20) },
  { id: 'txn_019', date: daysAgo(22), platform: 'stripe', description: 'SaaS tool subscription — Annual', gross: 199.00, fees: 7.16, net: 191.84, category: 'service', status: 'failed', source: 'webhook', eventId: randomId('evt'), payoutId: null, platformTxnId: randomId('str'), lastUpdated: daysAgo(21) },
  { id: 'txn_020', date: daysAgo(23), platform: 'patreon', description: 'Patreon — Declined pledge retry', gross: 25.00, fees: 2.25, net: 22.75, category: 'membership', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('pt'), lastUpdated: daysAgo(22) },
  { id: 'txn_021', date: daysAgo(25), platform: 'shopify', description: 'Preset bundle — Wedding Photo', gross: 149.00, fees: 8.94, net: 140.06, category: 'product_sale', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('sh'), lastUpdated: daysAgo(24) },
  { id: 'txn_022', date: daysAgo(27), platform: 'tiktok', description: 'TikTok LIVE gifts payout', gross: 642.10, fees: 192.63, net: 449.47, category: 'ad_revenue', status: 'unmatched', source: 'api', eventId: randomId('evt'), payoutId: null, platformTxnId: randomId('tt'), lastUpdated: daysAgo(26) },
  { id: 'txn_023', date: daysAgo(28), platform: 'youtube', description: 'Brand integration — NordVPN', gross: 6500.00, fees: 0, net: 6500.00, category: 'sponsorship', status: 'completed', source: 'manual', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('yt'), lastUpdated: daysAgo(27) },
  { id: 'txn_024', date: daysAgo(30), platform: 'gumroad', description: 'Video transitions pack', gross: 39.00, fees: 3.90, net: 35.10, category: 'product_sale', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('gm'), lastUpdated: daysAgo(29) },
  { id: 'txn_025', date: daysAgo(32), platform: 'stripe', description: 'Workshop ticket — Video Editing', gross: 79.00, fees: 2.84, net: 76.16, category: 'service', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('str'), lastUpdated: daysAgo(31) },
  { id: 'txn_026', date: daysAgo(35), platform: 'instagram', description: 'Affiliate — Skincare brand Q4', gross: 1200.00, fees: 0, net: 1200.00, category: 'affiliate', status: 'completed', source: 'manual', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('ig'), lastUpdated: daysAgo(34) },
  { id: 'txn_027', date: daysAgo(40), platform: 'substack', description: 'Annual upgrade — 12 subscribers', gross: 1188.00, fees: 118.80, net: 1069.20, category: 'membership', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('ss'), lastUpdated: daysAgo(39) },
  { id: 'txn_028', date: daysAgo(45), platform: 'youtube', description: 'YouTube — Dec 2025 Ad Revenue', gross: 3910.00, fees: 234.60, net: 3675.40, category: 'ad_revenue', status: 'completed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('yt'), lastUpdated: daysAgo(44) },
  { id: 'txn_029', date: daysAgo(50), platform: 'stripe', description: 'Refund — Duplicate charge', gross: -99.00, fees: -3.56, net: -95.44, category: 'product_sale', status: 'refunded', source: 'webhook', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('str'), lastUpdated: daysAgo(49) },
  { id: 'txn_030', date: daysAgo(60), platform: 'patreon', description: 'Patreon — Dec 2025 patron payouts', gross: 1990.00, fees: 179.10, net: 1810.90, category: 'membership', status: 'reviewed', source: 'api', eventId: randomId('evt'), payoutId: randomId('pay'), platformTxnId: randomId('pt'), lastUpdated: daysAgo(59) },
];

// ═══════════════════════════════════════════════════════════
//  SAVED VIEW FILTER PRESETS
// ═══════════════════════════════════════════════════════════
const VIEW_PRESETS = {
  all: {},
  unmatched: { status: 'unmatched' },
  refunds: { status: 'refunded' },
  high_fees: { minFeeRatio: 0.08 }, // 8%+ fee ratio
};

// ═══════════════════════════════════════════════════════════
//  DATE RANGE HELPER
// ═══════════════════════════════════════════════════════════
function getDateRange(preset) {
  const n = new Date();
  switch (preset) {
    case '7d': return { from: subDays(n, 7), to: n };
    case '30d': return { from: subDays(n, 30), to: n };
    case '90d': return { from: subDays(n, 90), to: n };
    case 'this_month': return { from: startOfMonth(n), to: endOfMonth(n) };
    case 'last_month': return { from: startOfMonth(subMonths(n, 1)), to: endOfMonth(subMonths(n, 1)) };
    default: return null;
  }
}

// ═══════════════════════════════════════════════════════════
//  EMPTY STATE COMPONENTS
// ═══════════════════════════════════════════════════════════
function EmptyNoPlatforms({ onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center">
        <Link2 className="w-6 h-6 text-[var(--z-text-3)]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-semibold text-[var(--z-text-1)]">No platforms connected</h3>
        <p className="text-sm text-[var(--z-text-3)] max-w-xs">
          Connect your revenue platforms to start tracking transactions, fees, and payouts.
        </p>
      </div>
      <button
        onClick={onConnect}
        className="h-9 px-5 rounded-lg bg-[var(--z-accent)] text-black text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg-0)]"
      >
        Connect platforms
      </button>
    </div>
  );
}

function EmptyNoResults({ onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-[var(--z-text-3)]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-semibold text-[var(--z-text-1)]">No transactions match</h3>
        <p className="text-sm text-[var(--z-text-3)] max-w-xs">
          Try adjusting or clearing your filters to see more results.
        </p>
      </div>
      <button
        onClick={onClear}
        className="h-9 px-5 rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-sm text-[var(--z-text-2)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
      >
        Clear filters
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════

// For demo: toggle this to test "no platforms" empty state
const DEMO_HAS_PLATFORMS = true;

const DEFAULT_FILTERS = {
  search: '', platform: 'all', datePreset: 'all',
  status: 'all', category: 'all', amountMin: '', amountMax: '',
};

export default function Transactions() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeView, setActiveView] = useState('all');
  const [savedViews, setSavedViews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zr_saved_txn_views') || '[]'); } catch { return []; }
  });
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [drawerTxn, setDrawerTxn] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Persist saved views
  useEffect(() => {
    localStorage.setItem('zr_saved_txn_views', JSON.stringify(savedViews));
  }, [savedViews]);

  // Escape key deselects all
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !drawerTxn) setSelectedIds(new Set()); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerTxn]);

  // ── View switching ─────────────────────────────────────────
  const handleViewChange = (viewId) => {
    setActiveView(viewId);
    setSelectedIds(new Set());
    // Apply built-in or saved view preset filters
    const preset = VIEW_PRESETS[viewId];
    if (preset !== undefined) {
      // Built-in view
      setFilters({ ...DEFAULT_FILTERS, ...(preset.status ? { status: preset.status } : {}) });
    } else {
      // Custom saved view
      const sv = savedViews.find(v => v.id === viewId);
      if (sv?.filters) setFilters(sv.filters);
    }
  };

  const handleSaveView = (view) => {
    setSavedViews(prev => [...prev, view]);
    setActiveView(view.id);
  };

  const handleDeleteSavedView = (id) => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
    if (activeView === id) setActiveView('all');
  };

  // ── Sorting ────────────────────────────────────────────────
  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return field; }
      setSortDir('desc');
      return field;
    });
  }, []);

  // ── Filtering + Sorting ────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const dateRange = getDateRange(filters.datePreset);
    const minAmt = filters.amountMin ? parseFloat(filters.amountMin) : null;
    const maxAmt = filters.amountMax ? parseFloat(filters.amountMax) : null;
    const q = filters.search.toLowerCase().trim();

    return SEED_TRANSACTIONS
      .filter((t) => {
        if (q && !(
          t.description?.toLowerCase().includes(q) ||
          t.platform?.toLowerCase().includes(q) ||
          t.platformTxnId?.toLowerCase().includes(q) ||
          t.eventId?.toLowerCase().includes(q)
        )) return false;
        if (filters.platform !== 'all' && t.platform !== filters.platform) return false;
        if (filters.status !== 'all' && t.status !== filters.status) return false;
        if (filters.category !== 'all' && t.category !== filters.category) return false;
        if (dateRange) {
          const d = new Date(t.date);
          if (d < dateRange.from || d > dateRange.to) return false;
        }
        const net = t.net ?? t.amount;
        if (minAmt != null && net < minAmt) return false;
        if (maxAmt != null && net > maxAmt) return false;
        // High fees view: 8%+ fee-to-gross ratio
        if (activeView === 'high_fees') {
          const ratio = t.gross > 0 ? t.fees / t.gross : 0;
          if (ratio < 0.08) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        const av = a[sortField];
        const bv = b[sortField];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [filters, sortField, sortDir, activeView]);

  // ── Row selection ──────────────────────────────────────────
  const handleSelectRow = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = filteredTransactions.map(t => t.id);
      const allSelected = allIds.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allIds);
    });
  }, [filteredTransactions]);

  // ── Bulk actions ───────────────────────────────────────────
  const handleBulkCategorize = () => {
    // In a real app: open a category picker modal
    alert(`Categorize ${selectedIds.size} selected transactions (placeholder — wire to your backend).`);
  };

  const handleBulkMarkReviewed = () => {
    alert(`Mark ${selectedIds.size} transactions as reviewed (placeholder — wire to your backend).`);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = filteredTransactions.filter(t => selectedIds.has(t.id));
    exportToCSV(selected);
  };

  // ── Export ─────────────────────────────────────────────────
  const exportToCSV = (rows = filteredTransactions) => {
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Date', key: 'date', formatter: (t) => format(new Date(t.date), 'yyyy-MM-dd') },
      { header: 'Platform', key: 'platform' },
      { header: 'Description', key: 'description' },
      { header: 'Gross', key: 'gross', formatter: (t) => (t.gross ?? t.amount ?? 0).toFixed(2) },
      { header: 'Fees', key: 'fees', formatter: (t) => (t.fees ?? 0).toFixed(2) },
      { header: 'Net', key: 'net', formatter: (t) => (t.net ?? t.amount ?? 0).toFixed(2) },
      { header: 'Category', key: 'category' },
      { header: 'Status', key: 'status' },
      { header: 'Source', key: 'source' },
      { header: 'Last Updated', key: 'lastUpdated', formatter: (t) => t.lastUpdated ? format(new Date(t.lastUpdated), 'yyyy-MM-dd HH:mm') : '' },
      { header: 'Event ID', key: 'eventId' },
      { header: 'Payout ID', key: 'payoutId' },
    ];
    const csv = generateCSV(rows, columns);
    downloadCSV(csv, `zerithum_transactions_${format(now, 'yyyy-MM-dd')}.csv`);
  };

  // ── Render ─────────────────────────────────────────────────
  const hasPlatforms = DEMO_HAS_PLATFORMS;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 pb-24">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--z-text-1)] tracking-tight leading-tight">
            Transactions
          </h1>
          <p className="text-sm text-[var(--z-text-3)] mt-0.5">
            Full ledger of synced revenue events across all platforms.
            &nbsp;
            <span className="text-[11px] font-mono text-[var(--z-text-3)]">
              Last sync: {format(subDays(now, 0.02), 'MMM d, yyyy · HH:mm')} UTC
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => exportToCSV()}
            disabled={filteredTransactions.length === 0}
            variant="outline"
            className="h-9 px-4 text-sm bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-2)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)] transition-all focus-visible:ring-1 focus-visible:ring-[var(--z-accent)]"
            aria-label="Export all filtered transactions as CSV"
          >
            <Download className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Metrics strip ── */}
      <MetricsStrip transactions={filteredTransactions} />

      {/* ── Filter bar ── */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* ── Saved views ── */}
      <SavedViews
        activeView={activeView}
        onViewChange={handleViewChange}
        savedViews={savedViews}
        onSaveView={handleSaveView}
        onDeleteSavedView={handleDeleteSavedView}
        currentFilters={filters}
      />

      {/* ── Empty state: no platforms ── */}
      {!hasPlatforms ? (
        <div className="bg-[var(--z-bg-2)] border border-[var(--z-border-1)] rounded-lg">
          <EmptyNoPlatforms onConnect={() => navigate('/ConnectedPlatforms')} />
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* ── Empty state: no results ── */
        <div className="bg-[var(--z-bg-2)] border border-[var(--z-border-1)] rounded-lg">
          <EmptyNoResults onClear={() => { setFilters(DEFAULT_FILTERS); setActiveView('all'); }} />
        </div>
      ) : (
        /* ── Transactions table ── */
        <TransactionsTable
          transactions={filteredTransactions}
          isLoading={false}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          onRowClick={(txn) => setDrawerTxn(txn)}
          focusedIndex={focusedIndex}
          onFocusRow={setFocusedIndex}
        />
      )}

      {/* ── Row detail drawer ── */}
      <RowDrawer transaction={drawerTxn} onClose={() => setDrawerTxn(null)} />

      {/* ── Bulk action bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onCategorize={handleBulkCategorize}
        onMarkReviewed={handleBulkMarkReviewed}
        onExport={handleBulkExport}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}