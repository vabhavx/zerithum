import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Scale, 
  Check, 
  ArrowRight, 
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MATCH_CATEGORY_LABELS = {
  exact_match: "Exact Match",
  fee_deduction: "Fee Deduction",
  hold_period: "Hold Period",
  unmatched: "Unmatched"
};

const MATCH_CATEGORY_COLORS = {
  exact_match: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fee_deduction: "bg-blue-50 text-blue-700 border-blue-200",
  hold_period: "bg-amber-50 text-amber-700 border-amber-200",
  unmatched: "bg-red-50 text-red-700 border-red-200"
};

export default function Reconciliation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: revenueTransactions = [] } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date"),
  });

  const { data: bankTransactions = [] } = useQuery({
    queryKey: ["bankTransactions"],
    queryFn: () => base44.entities.BankTransaction.list("-transaction_date"),
  });

  const { data: reconciliations = [] } = useQuery({
    queryKey: ["reconciliations"],
    queryFn: () => base44.entities.Reconciliation.list("-reconciled_at"),
  });

  const createReconciliationMutation = useMutation({
    mutationFn: (data) => base44.entities.Reconciliation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["reconciliations"]);
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const matched = reconciliations.filter(r => r.match_category !== "unmatched").length;
    const unmatched = revenueTransactions.length - matched;
    const autoMatched = reconciliations.filter(r => r.reconciled_by === "auto").length;
    
    return {
      total: revenueTransactions.length,
      matched,
      unmatched,
      autoMatched,
      matchRate: revenueTransactions.length > 0 
        ? ((matched / revenueTransactions.length) * 100).toFixed(1) 
        : 0
    };
  }, [revenueTransactions, reconciliations]);

  // Get unreconciled transactions
  const reconciledRevenueIds = new Set(reconciliations.map(r => r.revenue_transaction_id));
  const unreconciledRevenue = revenueTransactions.filter(t => !reconciledRevenueIds.has(t.id));

  // Filter and search
  const filteredReconciliations = useMemo(() => {
    let filtered = [...reconciliations];
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(r => r.match_category === filterStatus);
    }
    
    if (searchTerm) {
      // Would need to join with transactions for full search
    }
    
    return filtered;
  }, [reconciliations, filterStatus, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Reconciliation</h1>
          <p className="text-slate-500 mt-1">Match platform revenue with bank deposits</p>
        </div>
        <Button className="clay-sm hover:clay rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0">
          <Sparkles className="w-4 h-4 mr-2" />
          Auto-Match
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="clay rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="clay rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Matched</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.matched}</p>
        </div>
        <div className="clay rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Unmatched</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.unmatched}</p>
        </div>
        <div className="clay rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Match Rate</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{stats.matchRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="clay rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/50 border-slate-200 rounded-xl"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48 bg-white/50 border-slate-200 rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="exact_match">Exact Match</SelectItem>
            <SelectItem value="fee_deduction">Fee Deduction</SelectItem>
            <SelectItem value="hold_period">Hold Period</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unreconciled Section */}
      {unreconciledRevenue.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Reconciliation ({unreconciledRevenue.length})
          </h2>
          <div className="space-y-3">
            {unreconciledRevenue.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="clay-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    {transaction.description || `${transaction.platform} - ${transaction.category}`}
                  </p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(transaction.transaction_date), "MMM d, yyyy")} · {transaction.platform}
                  </p>
                </div>
                <p className="font-semibold text-slate-800">
                  ${transaction.amount?.toFixed(2)}
                </p>
                <Button size="sm" variant="outline" className="rounded-xl">
                  Match
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reconciliation History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Reconciliation History</h2>
        {filteredReconciliations.length === 0 ? (
          <div className="clay rounded-3xl p-12 text-center">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-800 mb-2">No reconciliations yet</h3>
            <p className="text-slate-500">Start matching your platform revenue with bank deposits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReconciliations.map((rec) => (
              <div key={rec.id} className="clay rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={cn("border", MATCH_CATEGORY_COLORS[rec.match_category])}>
                    {MATCH_CATEGORY_LABELS[rec.match_category]}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {rec.reconciled_by === "auto" ? (
                      <Sparkles className="w-4 h-4 text-violet-500" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                    <span>{rec.reconciled_by === "auto" ? "Auto-matched" : "Manual"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 clay-sm rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Platform Revenue</p>
                    <p className="font-medium text-slate-800">Revenue Transaction</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 clay-sm rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Bank Deposit</p>
                    <p className="font-medium text-slate-800">Bank Transaction</p>
                  </div>
                </div>
                {rec.match_confidence && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: `${rec.match_confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {(rec.match_confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                )}
                {rec.creator_notes && (
                  <p className="mt-3 text-sm text-slate-500 italic">"{rec.creator_notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}