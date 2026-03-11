import React, { useState, useMemo } from "react";
import { entities, functions } from "@/api/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Scale,
  Search,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import { useReconciliationStats, useUnreconciledTransactions, useReconciliations, useReviewQueue } from "@/hooks/use-reconciliation";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function Reconciliation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewPage, setReviewPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statsData } = useReconciliationStats();
  const stats = statsData || { total: 0, matched: 0, unmatched: 0, matchRate: 0 };

  const { data: unreconciledRevenue = [] } = useUnreconciledTransactions();

  const { data: reconciliationsData, isLoading: isLoadingReconciliations } = useReconciliations(page, pageSize, filterStatus);
  const reconciliations = reconciliationsData?.data || [];
  const totalReconciliations = reconciliationsData?.count || 0;
  const totalPages = Math.ceil(totalReconciliations / pageSize);

  const { data: reviewData, isLoading: isLoadingReview } = useReviewQueue(reviewPage, pageSize);
  const reviewItems = reviewData?.data || [];
  const reviewCount = reviewData?.count || 0;
  const reviewPages = Math.ceil(reviewCount / pageSize);

  const handleReviewAction = async (recId, action, notes = "") => {
    try {
      await entities.Reconciliation.update(recId, {
        review_status: action,
        reviewer_notes: notes || null,
      });
      toast({ title: action === "approved" ? "Match Approved" : "Match Rejected" });
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliationStats"] });
    } catch (err) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const filteredUnreconciled = useMemo(() => {
    if (!searchTerm.trim()) return unreconciledRevenue;
    const q = searchTerm.trim().toLowerCase();
    return unreconciledRevenue.filter((t) => {
      const haystack = [t.description, t.platform, t.category, t.platform_transaction_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [unreconciledRevenue, searchTerm]);

  const autoReconcileMutation = useMutation({
    mutationFn: () => functions.invoke("reconcileRevenue", {}),
    onSuccess: (response) => {
      if (response.data.success) {
        toast({ title: "Auto-Match Complete", description: response.data.message });
        queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
        queryClient.invalidateQueries({ queryKey: ["reconciliationStats"] });
        queryClient.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
      } else {
        toast({
          title: "Auto-Match Failed",
          description: response.data.message || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({ title: "Connection Error", description: error.message, variant: "destructive" });
    },
  });

  const matchRateColor =
    stats.matchRate >= 95 ? "text-green-600" : stats.matchRate >= 80 ? "text-amber-600" : "text-red-600";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Reconciliation</h1>
          <p className="text-gray-500 mt-1 text-sm">Match platform revenue with bank deposits</p>
        </div>
        <Button
          onClick={() => autoReconcileMutation.mutate()}
          disabled={autoReconcileMutation.isPending}
          className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 rounded-lg border-0 shadow-none"
        >
          {autoReconcileMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Auto-Match
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Matched</span>
          </div>
          <p className="text-2xl font-bold text-green-600 tabular-nums">{stats.matched}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unmatched</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{stats.unmatched}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Match Rate</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${matchRateColor}`}>{stats.matchRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 mb-6 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by description, platform, or ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9 h-9 border-gray-200 bg-white text-gray-900 focus-visible:border-blue-400 focus-visible:ring-0"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(val) => { setFilterStatus(val); setPage(1); }}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 border-gray-200 bg-white text-gray-700">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="exact_match">Exact Match</SelectItem>
            <SelectItem value="fee_deduction">Fee Deduction</SelectItem>
            <SelectItem value="hold_period">Hold Period</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="grouped_payout">Grouped Payout</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { key: "overview", label: "Overview" },
          { key: "review", label: "Review Queue", count: reviewCount },
          { key: "history", label: "History" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review Queue Tab */}
      {activeTab === "review" && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Pending Review
          </h2>
          {isLoadingReview ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : reviewItems.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-16 text-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-1">Review queue is empty</h3>
              <p className="text-sm text-gray-500">All matches have been reviewed or auto-approved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewItems.map((rec) => (
                <div key={rec.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <ReconciliationRow rec={rec} />
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleReviewAction(rec.id, "approved")}
                      className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const notes = prompt("Reason for rejection (optional):");
                        handleReviewAction(rec.id, "rejected", notes || "");
                      }}
                      className="h-8 border-red-200 text-red-600 hover:bg-red-50 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {reviewPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">Page {reviewPage} of {reviewPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setReviewPage((p) => Math.max(1, p - 1))} disabled={reviewPage === 1} className="h-8 w-8 p-0 border-gray-200">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setReviewPage((p) => Math.min(reviewPages, p + 1))} disabled={reviewPage === reviewPages} className="h-8 w-8 p-0 border-gray-200">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overview Tab — Pending Reconciliation */}
      {activeTab === "overview" && filteredUnreconciled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Reconciliation
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {filteredUnreconciled.length}
            </span>
          </h2>
          <div className="space-y-2">
            {filteredUnreconciled.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3.5 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {transaction.description || `${transaction.platform} — ${transaction.category}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(transaction.transaction_date), "MMM d, yyyy")} · {transaction.platform}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 tabular-nums text-sm flex-shrink-0">
                  {money.format(transaction.amount || 0)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-gray-200 text-gray-700 hover:bg-white flex-shrink-0"
                >
                  Match
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reconciliation History (shown in overview and history tabs) */}
      {(activeTab === "overview" || activeTab === "history") && <div>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Reconciliation History
        </h2>
        {isLoadingReconciliations ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : reconciliations.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-16 text-center shadow-sm">
            <Scale className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">No reconciliations yet</h3>
            <p className="text-sm text-gray-500">
              Use Auto-Match to reconcile your platform revenue with bank deposits.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reconciliations.map((rec) => (
              <ReconciliationRow key={rec.id} rec={rec} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
