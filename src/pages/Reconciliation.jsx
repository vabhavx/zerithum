import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Scale, 
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
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
import ReconciliationRow from "@/components/ReconciliationRow";
import { useToast } from "@/components/ui/use-toast";
import { useReconciliationStats, useUnreconciledTransactions, useReconciliations } from "@/hooks/use-reconciliation";

export default function Reconciliation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Use new optimized hooks
  const { data: statsData } = useReconciliationStats();
  const stats = statsData || { total: 0, matched: 0, unmatched: 0, matchRate: 0 };

  const { data: unreconciledRevenue = [] } = useUnreconciledTransactions();

  const { data: reconciliationsData, isLoading: isLoadingReconciliations } = useReconciliations(page, pageSize, filterStatus);
  const reconciliations = reconciliationsData?.data || [];
  const totalReconciliations = reconciliationsData?.count || 0;
  const totalPages = Math.ceil(totalReconciliations / pageSize);

  const autoReconcileMutation = useMutation({
    mutationFn: () => base44.functions.invoke('reconcileRevenue', {}),
    onSuccess: (response) => {
      if (response.data.success) {
        toast({
          title: "Auto-Match Complete",
          description: response.data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
        queryClient.invalidateQueries({ queryKey: ["reconciliationStats"] });
        queryClient.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
      } else {
        toast({
          title: "Auto-Match Failed",
          description: response.data.message || "Unknown error",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Reconciliation</h1>
          <p className="text-slate-500 mt-1">Match platform revenue with bank deposits</p>
        </div>
        <Button
          onClick={() => autoReconcileMutation.mutate()}
          disabled={autoReconcileMutation.isPending}
          className="clay-sm hover:clay rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0"
        >
          {autoReconcileMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
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
            disabled={true} // Search disabled as it only works on loaded page
            title="Search is currently disabled during performance optimization"
          />
        </div>
        <Select
            value={filterStatus}
            onValueChange={(val) => {
                setFilterStatus(val);
                setPage(1); // Reset page on filter change
            }}
        >
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
            {unreconciledRevenue.map((transaction) => (
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
        {isLoadingReconciliations ? (
            <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
            </div>
        ) : reconciliations.length === 0 ? (
          <div className="clay rounded-3xl p-12 text-center">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-800 mb-2">No reconciliations yet</h3>
            <p className="text-slate-500">Start matching your platform revenue with bank deposits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reconciliations.map((rec) => (
              <ReconciliationRow key={rec.id} rec={rec} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                >
                <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                >
                <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
            </div>
        )}
      </div>
    </div>
  );
}
