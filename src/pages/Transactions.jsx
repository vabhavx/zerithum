import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionRow from '@/components/TransactionRow';
import { generateCSV, downloadCSV } from '@/utils/csvExport';
import { format } from 'date-fns';
import moment from 'moment';

const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
};

const SortableColumnHeader = ({ label, field, currentSortField, currentSortDirection, onSort }) => {
  return (
    <th
      className="p-0 text-left text-xs font-semibold text-[#5E5240]"
      aria-sort={currentSortField === field ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 w-full h-full py-4 px-4 hover:bg-[#5E5240]/10 focus-visible:bg-[#5E5240]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208D9E] focus-visible:ring-inset"
      >
        {label}
        <SortIcon field={field} sortField={currentSortField} sortDirection={currentSortDirection} />
      </button>
    </th>
  );
};

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortField, setSortField] = useState('transaction_date');
  const [sortDirection, setSortDirection] = useState('desc');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date', 500)
  });

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => transactions
    .filter(t => {
      const matchesSearch = !searchTerm ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.platform_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || t.platform === platformFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    }), [transactions, searchTerm, platformFilter, categoryFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleToggleExpand = useCallback((id) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const totalRevenue = useMemo(() => filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.net_amount || t.amount), 0), [filteredTransactions]);

  const handleExportCSV = () => {
    const columns = [
      { header: 'Transaction ID', key: 'platform_transaction_id' },
      { header: 'Date', key: 'transaction_date', formatter: (item) => moment(item.transaction_date).format('YYYY-MM-DD HH:mm:ss') },
      { header: 'Platform', key: 'platform' },
      { header: 'Category', key: 'category' },
      { header: 'Description', key: 'description' },
      { header: 'Status', key: 'status' },
      { header: 'Currency', key: 'currency', formatter: (item) => item.currency || 'USD' },
      { header: 'Gross Amount', key: 'gross_amount', formatter: (item) => (item.gross_amount || item.amount).toFixed(2) },
      { header: 'Fees', key: 'fees_amount', formatter: (item) => (item.fees_amount || item.platform_fee || 0).toFixed(2) },
      { header: 'Net Amount', key: 'net_amount', formatter: (item) => (item.net_amount || (item.gross_amount || item.amount) - (item.fees_amount || item.platform_fee || 0)).toFixed(2) },
      { header: 'Synced Date', key: 'synced_date', formatter: (item) => moment(item.synced_date || item.created_date).format('YYYY-MM-DD HH:mm:ss') }
    ];

    const csvContent = generateCSV(filteredTransactions, columns);
    const filename = `transactions_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csvContent, filename);
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Transactions</h1>
          <p className="text-[#5E5240]/60">View and manage all your revenue transactions</p>
        </div>
        <Button
          className="bg-[#208D9E] text-white hover:bg-[#1A7B8A]"
          onClick={handleExportCSV}
          disabled={filteredTransactions.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="clay-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5E5240]/40" />
            <Input
              placeholder="Search transactions..."
              aria-label="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-clay pl-10"
            />
          </div>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="input-clay">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="patreon">Patreon</SelectItem>
              <SelectItem value="gumroad">Gumroad</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="input-clay">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="ad_revenue">Ad Revenue</SelectItem>
              <SelectItem value="sponsorship">Sponsorship</SelectItem>
              <SelectItem value="affiliate">Affiliate</SelectItem>
              <SelectItem value="product_sale">Product Sale</SelectItem>
              <SelectItem value="membership">Membership</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="input-clay">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[#5E5240]/60">
            Showing {filteredTransactions.length} transactions
          </span>
          <span className="font-semibold text-[#208D9E]">
            Total: ${totalRevenue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="clay-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#5E5240]/5">
              <tr>
                <SortableColumnHeader
                  label="Date"
                  field="transaction_date"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableColumnHeader
                  label="Platform"
                  field="platform"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableColumnHeader
                  label="Amount"
                  field="amount"
                  currentSortField={sortField}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Category</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Status</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#5E524012]">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    isExpanded={expandedRow === transaction.id}
                    onToggleExpand={handleToggleExpand}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#5E5240]/40">
                    No transactions found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}