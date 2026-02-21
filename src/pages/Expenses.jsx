import React, { useState, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Download,
  Loader2,
  TrendingDown,
  CheckCircle2,
  Receipt,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateCSV, downloadCSV } from "@/utils/csvExport";
import { CATEGORIES } from "@/lib/expenseCategories";

// Sub-components (new enterprise redesign)
import AuditReadinessCard from "@/components/expense/AuditReadinessCard";
import ReceiptQueue from "@/components/expense/ReceiptQueue";
import ExpensesTable from "@/components/expense/ExpensesTable";
import ExpenseModal from "@/components/expense/ExpenseModal";
import HelpDrawer from "@/components/expense/HelpDrawer";

// ─────────────────────────────────────────────────────────────────────────────
// KPI Tile — compact metric card used in metrics strip
// ─────────────────────────────────────────────────────────────────────────────
function KpiTile({ label, value, sub, icon: Icon, iconColor, valueColor, onClick }) {
  return (
    <div
      className={`z-card p-4 flex flex-col gap-2 ${onClick ? "cursor-pointer hover:border-[var(--z-border-2)] transition-colors" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-[var(--z-text-3)] uppercase tracking-wide">
          {label}
        </p>
        {Icon && (
          <Icon className={`w-4 h-4 ${iconColor || "text-[var(--z-text-3)]"}`} />
        )}
      </div>
      <p className={`text-[22px] font-semibold tabular-nums leading-none tracking-tight ${valueColor || "text-[var(--z-text-1)]"}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-[var(--z-text-3)]">{sub}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--z-bg-3)] border border-[var(--z-border-1)] flex items-center justify-center mb-5">
        <Receipt className="w-5 h-5 text-[var(--z-text-3)]" />
      </div>
      <h3 className="text-[15px] font-medium text-[var(--z-text-1)] mb-2">
        No expenses recorded
      </h3>
      <p className="text-[13px] text-[var(--z-text-3)] max-w-sm mb-6">
        Start tracking your creator business expenses to build an audit trail
        and identify tax deductions.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--z-accent)] text-[#09090B] text-[13px] font-semibold hover:bg-[var(--z-accent-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
      >
        <Plus className="w-4 h-4" />
        Add first expense
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function Expenses() {
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const receiptQueueRef = useRef(null);
  const queryClient = useQueryClient();
  const exportMenuRef = useRef(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  // ── Computed metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const deductible = expenses.reduce((sum, e) => {
      if (!e.is_tax_deductible) return sum;
      const pct = e.deduction_percentage ?? 100;
      return sum + (e.amount || 0) * (pct / 100);
    }, 0);
    const missingReceipts = expenses.filter(
      (e) => !e.receipt_url || e.receipt_url.trim() === ""
    ).length;
    const uncategorized = expenses.filter(
      (e) => !e.category || e.category === "other"
    ).length;
    return { total, deductible, missingReceipts, uncategorized };
  }, [expenses]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    setEditExpense(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((expense) => {
    setEditExpense(expense);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (id) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  }, [queryClient]);

  const scrollToQueue = useCallback(() => {
    receiptQueueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const columns = [
      { header: "Date", key: "expense_date", formatter: (e) => e.expense_date || "" },
      { header: "Merchant", key: "merchant", formatter: (e) => e.merchant || "" },
      { header: "Description", key: "description", formatter: (e) => e.description || "" },
      {
        header: "Category",
        key: "category",
        formatter: (e) => CATEGORIES[e.category]?.label || e.category || "",
      },
      {
        header: "Amount (USD)",
        key: "amount",
        formatter: (e) => (e.amount || 0).toFixed(2),
      },
      {
        header: "Tax Deductible",
        key: "is_tax_deductible",
        formatter: (e) => {
          if (!e.is_tax_deductible) return "No";
          const pct = e.deduction_percentage ?? 100;
          return pct === 100 ? "Yes" : `Partial (${pct}%)`;
        },
      },
      {
        header: "Deductible Amount (USD)",
        key: "deductible_amount",
        formatter: (e) => {
          if (!e.is_tax_deductible) return "0.00";
          const pct = e.deduction_percentage ?? 100;
          return ((e.amount || 0) * (pct / 100)).toFixed(2);
        },
      },
      { header: "Payment Method", key: "payment_method", formatter: (e) => e.payment_method || "" },
      {
        header: "Receipt",
        key: "receipt_url",
        formatter: (e) => (e.receipt_url ? "Yes — " + e.receipt_url : e.receipt_status === "pending" ? "Requested" : "Missing"),
      },
      { header: "Notes", key: "notes", formatter: (e) => e.notes || "" },
    ];
    const csv = generateCSV(expenses, columns);
    const filename = `zerithum_expenses_${format(new Date(), "yyyy-MM-dd")}.csv`;
    downloadCSV(csv, filename);
    toast.success("CSV exported — open in Excel or share with your accountant");
    setShowExportMenu(false);
  }, [expenses]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[var(--z-text-1)] tracking-tight leading-tight">
            Expenses
          </h1>
          <p className="text-[13px] text-[var(--z-text-3)] mt-1">
            Track creator business expenses, receipts, and tax deductions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Button
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={expenses.length === 0}
              className="h-9 text-[13px] bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-[var(--z-text-2)] hover:bg-[var(--z-bg-3)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)] focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
              <ChevronDown className="w-3 h-3 ml-1.5 opacity-60" />
            </Button>
            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--z-bg-2)] border border-[var(--z-border-1)] rounded-lg shadow-2xl z-20 overflow-hidden"
                onBlur={() => setShowExportMenu(false)}
              >
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-3 text-[13px] text-[var(--z-text-1)] hover:bg-[var(--z-bg-3)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--z-bg-3)]"
                >
                  <p className="font-medium">Export CSV</p>
                  <p className="text-[11px] text-[var(--z-text-3)] mt-0.5">
                    Spreadsheet for accountant — all fields included
                  </p>
                </button>
                <div className="border-t border-[var(--z-border-1)]" />
                <button
                  onClick={() => {
                    toast.info("ZIP export: download each receipt from the table, then compress manually or ask your accountant.");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-[13px] text-[var(--z-text-1)] hover:bg-[var(--z-bg-3)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--z-bg-3)]"
                >
                  <p className="font-medium">Receipt Archive (ZIP)</p>
                  <p className="text-[11px] text-[var(--z-text-3)] mt-0.5">
                    Download all receipt images for your records
                  </p>
                </button>
              </div>
            )}
          </div>

          {/* Add expense */}
          <Button
            onClick={handleAdd}
            className="h-9 text-[13px] bg-[var(--z-accent)] hover:bg-[var(--z-accent-2)] text-[#09090B] font-semibold border-0 focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* ── Loading state ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--z-text-3)]" />
        </div>
      ) : (
        <>
          {/* ── KPI Metrics strip ──────────────────────────────────────── */}
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5"
            role="region"
            aria-label="Expense summary metrics"
          >
            <KpiTile
              label="Total Expenses"
              value={`$${metrics.total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              sub={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""} recorded`}
              icon={TrendingDown}
              iconColor="text-[var(--z-text-3)]"
            />
            <KpiTile
              label="Deductible Total"
              value={`$${metrics.deductible.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              sub={
                metrics.total > 0
                  ? `${((metrics.deductible / metrics.total) * 100).toFixed(0)}% of total expenses`
                  : "No deductible expenses"
              }
              icon={CheckCircle2}
              iconColor="text-emerald-500"
              valueColor="text-emerald-400"
            />
            <KpiTile
              label="Missing Receipts"
              value={metrics.missingReceipts}
              sub={metrics.missingReceipts > 0 ? "Upload to improve audit readiness" : "All receipts attached"}
              icon={Receipt}
              iconColor={metrics.missingReceipts > 0 ? "text-[var(--z-warn)]" : "text-[var(--z-text-3)]"}
              valueColor={metrics.missingReceipts > 0 ? "text-[var(--z-warn)]" : "text-[var(--z-text-1)]"}
              onClick={metrics.missingReceipts > 0 ? scrollToQueue : undefined}
            />
            <KpiTile
              label="Uncategorized"
              value={metrics.uncategorized}
              sub={metrics.uncategorized > 0 ? "Update category for deductibility" : "All expenses categorized"}
              icon={AlertCircle}
              iconColor={metrics.uncategorized > 0 ? "text-amber-400" : "text-[var(--z-text-3)]"}
              valueColor={metrics.uncategorized > 0 ? "text-amber-400" : "text-[var(--z-text-1)]"}
            />
          </div>

          {/* ── Audit Readiness Card ───────────────────────────────────── */}
          <AuditReadinessCard
            expenses={expenses}
            onScrollToQueue={scrollToQueue}
          />

          {/* ── Missing Receipt Queue ──────────────────────────────────── */}
          <div ref={receiptQueueRef}>
            <ReceiptQueue expenses={expenses} />
          </div>

          {/* ── Expenses Table ─────────────────────────────────────────── */}
          <ExpensesTable
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />

          {/* ── Footer disclaimer ──────────────────────────────────────── */}
          <div className="mt-8 pt-5 border-t border-[var(--z-border-1)]">
            <p className="text-[11px] text-[var(--z-text-3)] leading-relaxed max-w-3xl">
              <strong className="font-medium text-[var(--z-text-2)]">General guidance only. </strong>
              Expense categorization and deductibility indicators are provided to help you organize
              records — they are not tax advice. Deductibility depends on your specific business
              situation, jurisdiction, and the most current tax regulations. Always consult a
              licensed CPA or tax advisor before filing. Zerithum does not provide legal or
              financial advice.
            </p>
          </div>
        </>
      )}

      {/* ── Modals & Drawers ──────────────────────────────────────────────── */}
      <ExpenseModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setEditExpense(null);
        }}
        onSuccess={handleSuccess}
        onOpenHelpDrawer={() => setShowHelpDrawer(true)}
        initialData={editExpense}
      />

      <HelpDrawer
        open={showHelpDrawer}
        onClose={() => setShowHelpDrawer(false)}
      />

      {/* Close export menu on outside click */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
