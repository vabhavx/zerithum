import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
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
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

export default function Reconciliation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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
    const matchRate = revenueTransactions.length > 0
        ? ((matched / revenueTransactions.length) * 100).toFixed(1)
        : 0;
    
    return {
      total: revenueTransactions.length,
      matched,
      unmatched,
      matchRate
    };
  }, [revenueTransactions, reconciliations]);

  // Filter and search
  const filteredReconciliations = useMemo(() => {
    let filtered = [...reconciliations];
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(r => r.match_category === filterStatus);
    }
    
    // Simple mock join for display purposes in this list
    // Ideally we would fetch the related transactions to show details
    
    return filtered;
  }, [reconciliations, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Dense Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Reconciliation Ledger</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {stats.total} TRANSACTIONS · {stats.matchRate}% MATCH RATE
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-4 font-mono uppercase">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Matched: {stats.matched}</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Pending: {stats.unmatched}</span>
            </div>
            <Button
            onClick={() => autoReconcileMutation.mutate()}
            disabled={autoReconcileMutation.isPending}
            className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider"
            >
            {autoReconcileMutation.isPending ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
                <Sparkles className="w-3 h-3 mr-2" />
            )}
            Run Auto-Match
            </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/20 p-2 border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, Platform, or Amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-border bg-background rounded-none text-xs font-mono"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] h-9 border-border bg-background rounded-none text-xs font-mono uppercase">
            <Filter className="w-3 h-3 mr-2 text-muted-foreground" />
            <SelectValue placeholder="STATUS" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all">All Records</SelectItem>
            <SelectItem value="exact_match">Exact Match</SelectItem>
            <SelectItem value="fee_deduction">Fee Deduction</SelectItem>
            <SelectItem value="hold_period">Hold Period</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Ledger Table */}
      <div className="border border-border bg-background">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="w-[180px]">Reconciliation ID</TableHead>
                    <TableHead>Platform Source</TableHead>
                    <TableHead>Bank Destination</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[100px] text-right">Confidence</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredReconciliations.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-mono text-xs uppercase tracking-wider">
                            No records found
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredReconciliations.map((rec) => (
                        <TableRow key={rec.id} className="group font-mono text-xs">
                            <TableCell className="font-medium text-foreground">
                                {rec.id.substring(0, 8)}...
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {format(new Date(rec.reconciled_at || new Date()), "yyyy-MM-dd HH:mm")}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="block text-foreground truncate max-w-[200px]">
                                    {rec.revenue_transaction_id ? "REV-" + rec.revenue_transaction_id.substring(0,8) : "—"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="block text-foreground truncate max-w-[200px]">
                                    {rec.bank_transaction_id ? "BNK-" + rec.bank_transaction_id.substring(0,8) : "—"}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className={rec.match_category === 'exact_match' ? 'text-muted-foreground' : 'text-destructive'}>
                                    {rec.match_category === 'exact_match' ? "0.00" : "VAR"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    rec.match_category === 'exact_match' ? 'success' :
                                    rec.match_category === 'unmatched' ? 'destructive' : 'warning'
                                } className="rounded-none px-1.5 py-0.5 text-[10px]">
                                    {rec.match_category.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {rec.match_confidence ? (rec.match_confidence * 100).toFixed(0) + "%" : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="w-3 h-3" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

    </div>
  );
}
