import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ArrowRight,
  ChevronRight,
  ChevronDown
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ReconciliationRow from "@/components/ReconciliationRow";
import { useToast } from "@/components/ui/use-toast";

export default function Reconciliation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isPendingExpanded, setIsPendingExpanded] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [matchNotes, setMatchNotes] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Maps for quick lookup
  const revenueMap = useMemo(() => new Map(revenueTransactions.map(t => [t.id, t])), [revenueTransactions]);
  const bankMap = useMemo(() => new Map(bankTransactions.map(t => [t.id, t])), [bankTransactions]);

  const manualMatchMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('manualMatch', data),
    onSuccess: (response) => {
      if (response.data.success) {
        toast({
          title: "Match Confirmed",
          description: "Transaction manually reconciled.",
        });
        setMatchDialogOpen(false);
        setSelectedRevenue(null);
        setSelectedBank(null);
        setMatchNotes("");
        queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      } else {
        toast({
          title: "Match Failed",
          description: response.data.error || "Unknown error",
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

  const autoReconcileMutation = useMutation({
    mutationFn: () => base44.functions.invoke('reconcileRevenue', {}),
    onSuccess: (response) => {
      if (response.data.success) {
        toast({
          title: "Auto-Match Complete",
          description: response.data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
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
  const unreconciledRevenue = useMemo(() => {
    const reconciledRevenueIds = new Set(reconciliations.map(r => r.revenue_transaction_id));
    return revenueTransactions.filter(t => !reconciledRevenueIds.has(t.id));
  }, [revenueTransactions, reconciliations]);

  // Get unreconciled bank transactions for manual match dialog
  const unreconciledBank = useMemo(() => {
    const reconciledBankIds = new Set(reconciliations.map(r => r.bank_transaction_id));
    return bankTransactions.filter(t => !reconciledBankIds.has(t.id));
  }, [bankTransactions, reconciliations]);

  // Filter bank candidates for the selected revenue in dialog
  const bankCandidates = useMemo(() => {
    if (!selectedRevenue) return [];
    // Sort by date proximity to selectedRevenue
    const revDate = new Date(selectedRevenue.transaction_date).getTime();

    return [...unreconciledBank].sort((a, b) => {
        const diffA = Math.abs(new Date(a.transaction_date).getTime() - revDate);
        const diffB = Math.abs(new Date(b.transaction_date).getTime() - revDate);
        return diffA - diffB;
    });
  }, [selectedRevenue, unreconciledBank]);


  // Filter and search history
  const filteredReconciliations = useMemo(() => {
    let filtered = [...reconciliations];
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(r => r.match_category === filterStatus);
    }
    
    if (searchTerm) {
       const term = searchTerm.toLowerCase();
       filtered = filtered.filter(r => {
           const rev = revenueMap.get(r.revenue_transaction_id);
           const bank = bankMap.get(r.bank_transaction_id);
           return (
               rev?.description?.toLowerCase().includes(term) ||
               rev?.amount?.toString().includes(term) ||
               bank?.description?.toLowerCase().includes(term) ||
               bank?.amount?.toString().includes(term)
           );
       });
    }
    
    return filtered;
  }, [reconciliations, filterStatus, searchTerm, revenueMap, bankMap]);

  const openMatchDialog = (revenue) => {
      setSelectedRevenue(revenue);
      setSelectedBank(null);
      setMatchNotes("");
      setMatchDialogOpen(true);
  };

  const handleManualMatch = () => {
      if (!selectedRevenue || !selectedBank) return;
      manualMatchMutation.mutate({
          revenueId: selectedRevenue.id,
          bankId: selectedBank.id,
          notes: matchNotes
      });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
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

      {/* Unreconciled Section */}
      <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Reconciliation ({unreconciledRevenue.length})
            </h2>
            {unreconciledRevenue.length > 5 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPendingExpanded(!isPendingExpanded)}
                    className="text-slate-500"
                >
                    {isPendingExpanded ? "Show Less" : "View All"}
                    {isPendingExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
            )}
          </div>

          {unreconciledRevenue.length > 0 ? (
             <div className="space-y-3">
                {unreconciledRevenue.slice(0, isPendingExpanded ? undefined : 5).map((transaction) => (
                <div key={transaction.id} className="clay-sm rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-slate-500 border-slate-200">
                                {transaction.platform}
                            </Badge>
                            <span className="text-xs text-slate-400">
                                {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                            </span>
                        </div>
                        <p className="font-medium text-slate-800 line-clamp-1">
                            {transaction.description || `${transaction.platform} - ${transaction.category}`}
                        </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                         <p className="font-semibold text-slate-800">
                            ${transaction.amount?.toFixed(2)}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
                            onClick={() => openMatchDialog(transaction)}
                        >
                            Match
                        </Button>
                    </div>
                </div>
                ))}
             </div>
          ) : (
             <div className="clay-sm rounded-2xl p-8 text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
                 <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                 <p className="text-slate-500">All transactions reconciled!</p>
             </div>
          )}
        </div>

      {/* History Filters */}
      <div className="clay rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by amount, description..."
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
            <SelectItem value="manual">Manual Match</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reconciliation History List */}
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
              <ReconciliationRow
                  key={rec.id}
                  rec={rec}
                  revenue={revenueMap.get(rec.revenue_transaction_id)}
                  bank={bankMap.get(rec.bank_transaction_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Manual Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
          <DialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-3xl border-0 shadow-2xl">
              <div className="p-6 pb-4 border-b border-slate-100 bg-white">
                  <DialogHeader>
                      <DialogTitle className="text-xl">Manual Match</DialogTitle>
                      <DialogDescription>
                          Select a bank deposit to match with this revenue transaction.
                      </DialogDescription>
                  </DialogHeader>

                  {selectedRevenue && (
                       <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                           <div>
                               <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Revenue Source</p>
                               <p className="font-semibold text-slate-800">{selectedRevenue.description || `${selectedRevenue.platform} Revenue`}</p>
                               <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                   <span>{format(new Date(selectedRevenue.transaction_date), "MMM d, yyyy")}</span>
                                   <span>{selectedRevenue.platform}</span>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-xl font-bold text-slate-800">${selectedRevenue.amount.toFixed(2)}</p>
                               <p className="text-xs text-slate-400">{selectedRevenue.currency}</p>
                           </div>
                       </div>
                  )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  <h4 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Available Bank Deposits</h4>
                  <div className="space-y-2">
                      {bankCandidates.length > 0 ? (
                          bankCandidates.map(bank => (
                              <div
                                key={bank.id}
                                onClick={() => setSelectedBank(bank)}
                                className={`
                                    cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between
                                    ${selectedBank?.id === bank.id
                                        ? 'bg-violet-50 border-violet-500 shadow-sm ring-1 ring-violet-500'
                                        : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-sm'}
                                `}
                              >
                                  <div>
                                      <p className="font-medium text-slate-800 text-sm">{bank.description || 'Deposit'}</p>
                                      <p className="text-xs text-slate-500 mt-0.5">
                                          {format(new Date(bank.transaction_date), "MMM d, yyyy")}
                                      </p>
                                  </div>
                                  <div className="text-right">
                                      <p className={`font-semibold ${selectedBank?.id === bank.id ? 'text-violet-700' : 'text-slate-700'}`}>
                                          ${bank.amount.toFixed(2)}
                                      </p>
                                      {/* Show diff indication */}
                                      {selectedRevenue && (
                                          <p className="text-[10px] text-slate-400">
                                              {Math.abs(bank.amount - selectedRevenue.amount) < 0.01
                                                ? 'Exact amount'
                                                : `${(bank.amount - selectedRevenue.amount).toFixed(2)} diff`}
                                          </p>
                                      )}
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-8 text-slate-400">
                              <p>No available bank transactions found.</p>
                          </div>
                      )}
                  </div>
              </div>

              <div className="p-6 pt-4 border-t border-slate-100 bg-white">
                  <div className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Notes (Optional)</p>
                      <Input
                        placeholder="Why are you matching these?"
                        value={matchNotes}
                        onChange={(e) => setMatchNotes(e.target.value)}
                        className="bg-slate-50 border-slate-200"
                      />
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>Cancel</Button>
                      <Button
                        onClick={handleManualMatch}
                        disabled={!selectedBank || manualMatchMutation.isPending}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                          {manualMatchMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Confirm Match
                      </Button>
                  </DialogFooter>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
