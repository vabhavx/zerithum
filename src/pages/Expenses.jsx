import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Receipt,
  TrendingDown,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  Bot
} from "lucide-react";
import BulkImportDialog from "../components/expense/BulkImportDialog";
import ExpenseAnalytics from "../components/expense/ExpenseAnalytics";
import AIExpenseChat from "../components/expense/AIExpenseChat";
import AddExpenseDialog from "../components/expense/AddExpenseDialog";
import ExpenseRow from "@/components/expense/ExpenseRow";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Expenses() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 200),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
      setExpenseToDelete(null);
    },
  });

  const handleDeleteExpense = useCallback((id) => {
    setExpenseToDelete(id);
  }, []);

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const deductible = expenses.reduce((sum, e) => {
      if (!e.is_tax_deductible) return sum;
      return sum + (e.amount * (e.deduction_percentage / 100));
    }, 0);
    const withReceipts = expenses.filter(e => e.receipt_url).length;
    const avgPerDay = expenses.length > 0 ? total / expenses.length : 0;

    return { total, deductible, withReceipts, avgPerDay };
  }, [expenses]);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expenses</h1>
          <p className="text-white/40 mt-1 text-sm">AI-powered expense tracking & tax optimization</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAIChat(true)}
            variant="outline"
            className="rounded-lg border-zteal-400/30 text-zteal-400 hover:bg-zteal-400/10 h-9"
          >
            <Bot className="w-3.5 h-3.5 mr-2" />
            AI Advisor
          </Button>
          <Button
            onClick={() => setShowBulkImport(true)}
            variant="outline"
            className="rounded-lg border-white/10 text-white/70 hover:bg-white/5 h-9"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
            Bulk Import
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="rounded-lg bg-zteal-400 hover:bg-zteal-600 text-white border-0 transition-colors h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            Add Expense
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card rounded-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-white">${metrics.total.toFixed(0)}</p>
          <p className="text-xs text-white/40 mt-2">{expenses.length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-border bg-card rounded-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Tax Deductible</p>
          <p className="text-2xl font-bold text-white">${metrics.deductible.toFixed(0)}</p>
          <p className="text-xs text-emerald-400 mt-2">{metrics.total > 0 ? ((metrics.deductible / metrics.total) * 100).toFixed(0) : 0}% of total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-border bg-card rounded-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">With Receipts</p>
          <p className="text-2xl font-bold text-white">{metrics.withReceipts}</p>
          <p className="text-xs text-white/40 mt-2">
            <button onClick={() => setShowAnalytics(!showAnalytics)} className="text-zteal-400 hover:text-zteal-300">
              {showAnalytics ? 'Hide' : 'View'} Analytics
            </button>
          </p>
        </motion.div>
      </div>

      {showAnalytics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ExpenseAnalytics expenses={expenses} />
        </motion.div>
      )}

      <div className="border border-border bg-card rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Expenses</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No expenses yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onDelete={handleDeleteExpense}
              />
            ))}
          </div>
        )}
      </div>

      <AddExpenseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["expenses"] })}
      />

      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["expenses"] })}
      />

      <AIExpenseChat
        open={showAIChat}
        onOpenChange={setShowAIChat}
        expenses={expenses}
        metrics={metrics}
      />

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. This will permanently delete the expense
              {expenseToDelete && (() => {
                const expense = expenses.find(e => e.id === expenseToDelete);
                return expense ? ` for ${expense.merchant || expense.description}` : '';
              })()}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white border-0"
              onClick={() => deleteExpenseMutation.mutate(expenseToDelete)}
            >
              {deleteExpenseMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
