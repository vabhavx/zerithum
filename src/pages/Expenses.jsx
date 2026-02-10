import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Receipt,
  TrendingDown,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  Bot,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function Expenses() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 200),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense deleted", description: "Record removed from ledger." });
      setExpenseToDelete(null);
    },
  });

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const deductible = expenses.reduce((sum, e) => {
      if (!e.is_tax_deductible) return sum;
      return sum + (e.amount * (e.deduction_percentage / 100));
    }, 0);
    return { total, deductible };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    return expenses.filter(e =>
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.merchant?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Expense Ledger</h1>
          <p className="text-sm text-muted-foreground font-mono">
             TAX OPTIMIZATION & TRACKING
          </p>
        </div>
        <div className="flex gap-2">
           <Button
            variant="outline"
            className="h-9 px-4 font-mono text-xs uppercase tracking-wider rounded-none"
          >
            <Bot className="w-3 h-3 mr-2" />
            Tax Advisor
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider rounded-none"
          >
            <Plus className="w-3 h-3 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          <div className="bg-background p-6">
              <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">Total Outflow</div>
              <div className="text-2xl font-serif font-medium">${metrics.total.toFixed(2)}</div>
          </div>
          <div className="bg-background p-6">
              <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">Tax Deductible</div>
              <div className="text-2xl font-serif font-medium text-emerald-500">${metrics.deductible.toFixed(2)}</div>
          </div>
          <div className="bg-background p-6">
              <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">Recent Entries</div>
              <div className="text-2xl font-serif font-medium">{expenses.length}</div>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/20 p-2 border border-border">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                placeholder="Search merchant or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-border bg-background rounded-none text-xs font-mono"
                />
            </div>
            <Button variant="outline" className="h-9 border-border rounded-none">
                <Filter className="w-3 h-3" />
            </Button>
      </div>

      <div className="border border-border bg-background">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50 border-b border-border">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Receipt</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground"/></TableCell>
                    </TableRow>
                ) : filteredExpenses.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-mono text-xs uppercase">No expenses found</TableCell>
                    </TableRow>
                ) : (
                    filteredExpenses.map((e) => (
                        <TableRow key={e.id} className="group font-mono text-xs hover:bg-muted/50 border-b border-border">
                             <TableCell className="text-muted-foreground">
                                {format(new Date(e.expense_date), "yyyy-MM-dd")}
                             </TableCell>
                             <TableCell className="font-semibold">
                                {e.merchant}
                             </TableCell>
                             <TableCell>
                                <Badge variant="neutral" className="rounded-none text-[10px] py-0">{e.category}</Badge>
                             </TableCell>
                             <TableCell className="text-right font-medium text-foreground">
                                ${e.amount.toFixed(2)}
                             </TableCell>
                             <TableCell className="text-center">
                                {e.receipt_url ? <CheckCircle2 className="w-3 h-3 mx-auto text-emerald-500" /> : <span className="text-muted-foreground">-</span>}
                             </TableCell>
                             <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setExpenseToDelete(e.id)}
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                             </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      {/* Simple Add Dialog Placeholder */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-none border border-border bg-card">
            <DialogHeader>
                <DialogTitle className="font-serif">Log Expense</DialogTitle>
                <DialogDescription>Add a new business expense record.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <p className="text-xs text-muted-foreground font-mono">[Form Placeholder]</p>
            </div>
            <DialogFooter>
                <Button variant="outline" className="rounded-none" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button className="rounded-none" onClick={() => { setShowAddDialog(false); toast({title:"Saved", description:"Expense logged."}) }}>Save Record</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <DialogContent className="rounded-none border border-border bg-card">
            <DialogHeader>
                <DialogTitle className="font-serif">Confirm Deletion</DialogTitle>
                <DialogDescription>Permanently remove this expense record?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" className="rounded-none" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
                <Button variant="destructive" className="rounded-none" onClick={() => deleteExpenseMutation.mutate(expenseToDelete)}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
