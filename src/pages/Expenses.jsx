import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  Sparkles,
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
import ExpenseRow from "@/components/expense/ExpenseRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { CATEGORIES } from "@/lib/expenseCategories";

export default function Expenses() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
    category: "software_subscriptions",
    description: "",
    merchant: "",
    is_tax_deductible: true,
    deduction_percentage: 100,
    receipt_url: "",
    payment_method: "credit_card",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 200),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowAddDialog(false);
      resetForm();
      toast.success("Expense added successfully");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
  });

  const handleDeleteExpense = useCallback((id) => {
    setExpenseToDelete(id);
  }, []);

  const resetForm = () => {
    setFormData({
      amount: "",
      expense_date: format(new Date(), "yyyy-MM-dd"),
      category: "software_subscriptions",
      description: "",
      merchant: "",
      is_tax_deductible: true,
      deduction_percentage: 100,
      receipt_url: "",
      payment_method: "credit_card",
      notes: ""
    });
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, receipt_url: file_url }));

      setProcessingReceipt(true);
      const result = await base44.functions.invoke('processReceipt', { receiptUrl: file_url });

      if (result.data.success) {
        const { extracted, categorization } = result.data;
        setFormData(prev => ({
          ...prev,
          merchant: extracted.merchant || prev.merchant,
          amount: extracted.amount?.toString() || prev.amount,
          expense_date: extracted.date || prev.expense_date,
          description: extracted.description || prev.description,
          category: categorization.category || prev.category,
          is_tax_deductible: categorization.is_tax_deductible ?? prev.is_tax_deductible,
          deduction_percentage: categorization.deduction_percentage || prev.deduction_percentage,
          ai_suggested_category: categorization.category,
          ai_confidence: categorization.confidence
        }));
        toast.success("Receipt processed successfully!");
      }
    } catch (error) {
      toast.error("Failed to process receipt");
    } finally {
      setUploadingReceipt(false);
      setProcessingReceipt(false);
    }
  };

  const handleAICategorize = async () => {
    if (!formData.description && !formData.merchant) {
      toast.error("Add a description or merchant first");
      return;
    }

    setCategorizing(true);
    try {
      const result = await base44.functions.invoke('categorizeExpense', {
        description: formData.description,
        merchant: formData.merchant,
        amount: parseFloat(formData.amount),
        receiptUrl: formData.receipt_url
      });

      if (result.data.success) {
        setFormData(prev => ({
          ...prev,
          category: result.data.category,
          is_tax_deductible: result.data.is_tax_deductible,
          deduction_percentage: result.data.deduction_percentage,
          ai_suggested_category: result.data.category,
          ai_confidence: result.data.confidence
        }));
        toast.success(`Categorized as ${CATEGORIES[result.data.category].label}`);
      }
    } catch (error) {
      toast.error("Failed to categorize");
    } finally {
      setCategorizing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.expense_date) {
      toast.error("Amount and date are required");
      return;
    }

    createExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      deduction_percentage: parseFloat(formData.deduction_percentage)
    });
  };

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
          className="card-modern rounded-xl p-5"
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
          className="card-modern rounded-xl p-5"
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
          className="card-modern rounded-xl p-5"
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

      <div className="card-modern rounded-xl p-6">
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="card-modern rounded-2xl border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Add Expense</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
              <Label htmlFor="receipt-upload" className="text-white/60 mb-2 block text-sm">Upload Receipt (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt || processingReceipt}
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
                {(uploadingReceipt || processingReceipt) && (
                  <Loader2 className="w-5 h-5 animate-spin text-zteal-400" />
                )}
              </div>
              {formData.receipt_url && (
                <p className="text-xs text-emerald-400 mt-2">✓ Receipt uploaded</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense-amount" className="text-white/60 mb-2 block text-sm">Amount *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="expense-date" className="text-white/60 mb-2 block text-sm">Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expense-merchant" className="text-white/60 mb-2 block text-sm">Merchant</Label>
              <Input
                id="expense-merchant"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="Amazon, Adobe, etc."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label htmlFor="expense-description" className="text-white/60 mb-2 block text-sm">Description</Label>
              <Textarea
                id="expense-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What was this expense for?"
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="expense-category" className="text-white/60 text-sm">Category</Label>
                <Button
                  type="button"
                  onClick={handleAICategorize}
                  disabled={categorizing}
                  className="h-7 text-xs bg-zteal-400 hover:bg-zteal-600 text-white"
                >
                  {categorizing ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  AI Suggest
                </Button>
              </div>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger id="expense-category" className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense-deduction" className="text-white/60 mb-2 block text-sm">Tax Deductible %</Label>
                <Input
                  id="expense-deduction"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.deduction_percentage}
                  onChange={(e) => setFormData({ ...formData, deduction_percentage: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label htmlFor="expense-payment-method" className="text-white/60 mb-2 block text-sm">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(val) => setFormData({ ...formData, payment_method: val })}>
                  <SelectTrigger id="expense-payment-method" className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1 border-white/10 text-white/70 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExpenseMutation.isPending}
                className="flex-1 bg-zteal-400 hover:bg-zteal-600 text-white"
              >
                {createExpenseMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["expenses"] })}
      />

      <AIExpenseChat
        open={showAIChat}
        onOpenChange={setShowAIChat}
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
