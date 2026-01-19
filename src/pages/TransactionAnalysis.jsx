import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

const PLATFORM_NAMES = {
  youtube: 'YouTube',
  patreon: 'Patreon',
  stripe: 'Stripe',
  gumroad: 'Gumroad',
  instagram: 'Instagram',
  tiktok: 'TikTok'
};

const CATEGORY_NAMES = {
  ad_revenue: 'Ad Revenue',
  sponsorship: 'Sponsorship',
  affiliate: 'Affiliate',
  product_sale: 'Product Sale',
  membership: 'Membership'
};

export default function TransactionAnalysis() {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState("transaction_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  const filteredAndSorted = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.platform_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter(t => t.platform === platformFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "transaction_date") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, searchQuery, platformFilter, categoryFilter, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Platform", "Category", "Description", "Amount", "Fee", "Net"];
    const rows = filteredAndSorted.map(t => [
      format(new Date(t.transaction_date), "yyyy-MM-dd"),
      t.platform,
      t.category,
      t.description || "",
      t.amount,
      t.platform_fee || 0,
      t.amount - (t.platform_fee || 0)
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const totalAmount = filteredAndSorted.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalFees = filteredAndSorted.reduce((sum, t) => sum + (t.platform_fee || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transaction Analysis</h1>
          <p className="text-white/40 mt-1 text-sm">Detailed view with filtering and sorting</p>
        </div>
        <Button
          onClick={exportToCSV}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white h-9"
        >
          <Download className="w-3.5 h-3.5 mr-2" />
          Export CSV
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern rounded-xl p-4"
        >
          <p className="text-white/50 text-xs mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-white">{filteredAndSorted.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-4"
        >
          <p className="text-white/50 text-xs mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">${totalAmount.toFixed(0)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-4"
        >
          <p className="text-white/50 text-xs mb-1">Total Fees</p>
          <p className="text-2xl font-bold text-red-400">${totalFees.toFixed(0)}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-modern rounded-xl p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {Object.entries(PLATFORM_NAMES).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setSearchQuery("");
              setPlatformFilter("all");
              setCategoryFilter("all");
            }}
            className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-modern rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th 
                  className="text-left p-4 text-xs font-semibold text-white/60 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("transaction_date")}
                >
                  <div className="flex items-center gap-2">
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-xs font-semibold text-white/60 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("platform")}
                >
                  <div className="flex items-center gap-2">
                    Platform
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left p-4 text-xs font-semibold text-white/60">Category</th>
                <th className="text-left p-4 text-xs font-semibold text-white/60">Description</th>
                <th 
                  className="text-right p-4 text-xs font-semibold text-white/60 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-right p-4 text-xs font-semibold text-white/60">Fee</th>
                <th className="text-right p-4 text-xs font-semibold text-white/60">Net</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((transaction, idx) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 text-sm text-white">
                    {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-white capitalize">
                      {PLATFORM_NAMES[transaction.platform] || transaction.platform}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/70">
                      {CATEGORY_NAMES[transaction.category] || transaction.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-white/70 max-w-xs truncate">
                    {transaction.description || '-'}
                  </td>
                  <td className="p-4 text-sm text-white text-right font-semibold">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-sm text-red-400 text-right">
                    ${(transaction.platform_fee || 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-sm text-emerald-400 text-right font-semibold">
                    ${(transaction.amount - (transaction.platform_fee || 0)).toFixed(2)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <p className="text-sm text-white/40">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-white/10 text-white/70 hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-white/10 text-white/70 hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}