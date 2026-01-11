import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const totalRevenue = useMemo(() => filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.net_amount || t.amount), 0), [filteredTransactions]);

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Transactions</h1>
          <p className="text-[#5E5240]/60">View and manage all your revenue transactions</p>
        </div>
        <Button className="btn-secondary">
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
                <th 
                  onClick={() => handleSort('transaction_date')}
                  className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240] cursor-pointer hover:bg-[#5E5240]/10"
                >
                  <div className="flex items-center gap-1">
                    Date <SortIcon field="transaction_date" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('platform')}
                  className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240] cursor-pointer hover:bg-[#5E5240]/10"
                >
                  <div className="flex items-center gap-1">
                    Platform <SortIcon field="platform" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('amount')}
                  className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240] cursor-pointer hover:bg-[#5E5240]/10"
                >
                  <div className="flex items-center gap-1">
                    Amount <SortIcon field="amount" />
                  </div>
                </th>
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
                  <React.Fragment key={transaction.id}>
                    <tr className="border-t border-[#5E524012] hover:bg-[#5E5240]/5 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === transaction.id ? null : transaction.id)}>
                      <td className="py-4 px-4 text-sm">
                        {moment(transaction.transaction_date).format('MMM D, YYYY')}
                      </td>
                      <td className="py-4 px-4 text-sm capitalize">{transaction.platform}</td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-semibold text-[#208D9E]">
                          ${(transaction.net_amount || transaction.amount).toFixed(2)}
                        </div>
                        {transaction.fees_amount > 0 && (
                          <div className="text-xs text-[#5E5240]/60">
                            Fee: ${transaction.fees_amount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm capitalize">
                        {transaction.category?.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.status === 'refunded' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(expandedRow === transaction.id ? null : transaction.id);
                          }}
                          className="btn-secondary text-xs"
                        >
                          {expandedRow === transaction.id ? 'Hide' : 'Details'}
                        </Button>
                      </td>
                    </tr>
                    {expandedRow === transaction.id && (
                      <tr className="border-t border-[#5E524012] bg-[#5E5240]/5">
                        <td colSpan="6" className="py-4 px-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[#5E5240]/60">Transaction ID:</span>
                              <div className="font-mono text-xs mt-1">{transaction.platform_transaction_id}</div>
                            </div>
                            <div>
                              <span className="text-[#5E5240]/60">Synced:</span>
                              <div className="mt-1">{moment(transaction.synced_date || transaction.created_date).format('MMM D, YYYY h:mm A')}</div>
                            </div>
                            {transaction.description && (
                              <div className="col-span-2">
                                <span className="text-[#5E5240]/60">Description:</span>
                                <div className="mt-1">{transaction.description}</div>
                              </div>
                            )}
                            <div>
                              <span className="text-[#5E5240]/60">Gross Amount:</span>
                              <div className="mt-1">${(transaction.gross_amount || transaction.amount).toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-[#5E5240]/60">Currency:</span>
                              <div className="mt-1">{transaction.currency || 'USD'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#5E5240]/40">
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