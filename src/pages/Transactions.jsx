import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-transaction_date", 500),
  });

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      searchTerm === "" ||
      txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.platform_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || txn.platform === filterPlatform;
    const matchesStatus = filterStatus === "all" || txn.status === filterStatus;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const totalRevenue = filteredTransactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.net_amount || t.amount), 0);

  const handleExport = () => {
    // Mock CSV export
    const csv = [
      ["Date", "Platform", "Transaction ID", "Amount", "Fees", "Net", "Category", "Status", "Description"].join(","),
      ...filteredTransactions.map((txn) =>
        [
          txn.transaction_date,
          txn.platform,
          txn.platform_transaction_id,
          txn.gross_amount || txn.amount,
          txn.fees_amount || 0,
          txn.net_amount || txn.amount,
          txn.category,
          txn.status,
          `"${txn.description || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zerithum-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Transactions</h1>
          <p className="text-[#5E5240]/60">All revenue transactions across platforms</p>
        </div>
        <Button onClick={handleExport} className="btn-primary">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Card */}
      <div className="clay-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-[#5E5240]/60 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-[#5E5240]">{filteredTransactions.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#5E5240]/60 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-[#208D9E]">${totalRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#5E5240]/60 mb-1">Average Transaction</p>
            <p className="text-2xl font-bold text-[#5E5240]">
              ${filteredTransactions.length > 0 ? (totalRevenue / filteredTransactions.length).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="clay-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5E5240]/40" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-4 py-2 border border-[#5E5240]/20 rounded-lg text-sm"
          >
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="patreon">Patreon</option>
            <option value="gumroad">Gumroad</option>
            <option value="stripe">Stripe</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-[#5E5240]/20 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="clay-card overflow-x-auto">
        {filteredTransactions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5E5240]/10">
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Date</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Platform</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Transaction ID</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-[#5E5240]">Gross</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-[#5E5240]">Fees</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-[#5E5240]">Net</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Category</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-[#5E5240]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-[#5E5240]/5 hover:bg-[#5E5240]/5">
                  <td className="py-4 px-4 text-sm text-[#5E5240]">
                    {format(new Date(txn.transaction_date), "MMM d, yyyy")}
                  </td>
                  <td className="py-4 px-4">
                    <span className="capitalize font-medium text-[#5E5240]">{txn.platform}</span>
                  </td>
                  <td className="py-4 px-4 text-xs text-[#5E5240]/60 font-mono">
                    {txn.platform_transaction_id}
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-[#5E5240]">
                    ${(txn.gross_amount || txn.amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-[#C0152F]">
                    ${(txn.fees_amount || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-sm text-right font-semibold text-[#208D9E]">
                    ${(txn.net_amount || txn.amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-xs text-[#5E5240]/60 capitalize">
                    {txn.category.replace("_", " ")}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        txn.status === "completed"
                          ? "bg-[#208D9E]/10 text-[#208D9E]"
                          : txn.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : txn.status === "refunded"
                          ? "bg-[#C0152F]/10 text-[#C0152F]"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#5E5240]/60">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}