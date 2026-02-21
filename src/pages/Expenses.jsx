import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ExpenseModal from "@/components/expense/ExpenseModal";
import { CATEGORIES } from "@/lib/expenseCategories";

const QUICK_VIEWS = [
  { value: "all", label: "All" },
  { value: "missing_receipts", label: "Missing receipts" },
  { value: "deductible", label: "Deductible" },
  { value: "high_value", label: "High value" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount high to low" },
  { value: "amount_asc", label: "Amount low to high" },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return money.format(value || 0);
}

function SummaryCard({ label, value, helper, tone = "neutral" }) {
  const valueClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <div className="rounded-xl border border-white/10 bg-[#111114] p-4 transition-colors hover:border-white/20">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{helper}</p>
    </div>
  );
}

export default function Expenses() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [receiptFilter, setReceiptFilter] = useState("all");
  const [quickView, setQuickView] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 3000),
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      toast.success("Expense deleted");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast.error("Could not delete expense");
    },
  });

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = expenses.filter((expense) => {
      if (categoryFilter !== "all" && expense.category !== categoryFilter) return false;

      if (receiptFilter === "missing" && expense.receipt_url) return false;
      if (receiptFilter === "with_receipt" && !expense.receipt_url) return false;

      if (quickView === "missing_receipts" && expense.receipt_url) return false;
      if (quickView === "deductible" && !expense.is_tax_deductible) return false;
      if (quickView === "high_value" && (expense.amount || 0) < 500) return false;

      if (query) {
        const text = [expense.merchant, expense.description, expense.notes, expense.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });

    rows.sort((left, right) => {
      if (sortBy === "date_asc") {
        return new Date(left.expense_date || 0).getTime() - new Date(right.expense_date || 0).getTime();
      }
      if (sortBy === "date_desc") {
        return new Date(right.expense_date || 0).getTime() - new Date(left.expense_date || 0).getTime();
      }
      if (sortBy === "amount_asc") {
        return (left.amount || 0) - (right.amount || 0);
      }
      return (right.amount || 0) - (left.amount || 0);
    });

    return rows;
  }, [expenses, search, categoryFilter, receiptFilter, quickView, sortBy]);

  const totals = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const deductibleAmount = filteredExpenses.reduce((sum, expense) => {
      if (!expense.is_tax_deductible) return sum;
      const percentage = expense.deduction_percentage ?? 100;
      return sum + (expense.amount || 0) * (percentage / 100);
    }, 0);

    const missingReceipts = filteredExpenses.filter((expense) => !expense.receipt_url).length;
    const avgExpense = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;

    return {
      totalAmount,
      deductibleAmount,
      missingReceipts,
      avgExpense,
      count: filteredExpenses.length,
      receiptCoverage:
        filteredExpenses.length > 0
          ? ((filteredExpenses.length - missingReceipts) / filteredExpenses.length) * 100
          : 0,
    };
  }, [filteredExpenses]);

  const openCreate = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const removeExpense = (expense) => {
    const confirmed = window.confirm(
      `Delete expense${expense.merchant ? ` for ${expense.merchant}` : ""}? This action cannot be undone.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(expense.id);
  };

  const onModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  const exportCsv = () => {
    const headers = [
      "Date",
      "Merchant",
      "Category",
      "Description",
      "Amount",
      "Tax Deductible",
      "Deduction Percentage",
      "Receipt URL",
      "Payment Method",
      "Notes",
    ];

    const rows = filteredExpenses.map((expense) => [
      expense.expense_date || "",
      expense.merchant || "",
      CATEGORIES[expense.category]?.label || expense.category || "",
      expense.description || "",
      (expense.amount || 0).toFixed(2),
      expense.is_tax_deductible ? "Yes" : "No",
      String(expense.deduction_percentage ?? (expense.is_tax_deductible ? 100 : 0)),
      expense.receipt_url || "",
      expense.payment_method || "",
      expense.notes || "",
    ]);

    const csv = [headers, ...rows]
      .map((line) =>
        line
          .map((value) => {
            const safe = String(value ?? "").replaceAll('"', '""');
            return `"${safe}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zerithum-expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    link.remove();

    toast.success("Expense export downloaded");
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Expenses</h1>
          <p className="mt-1 text-sm text-white/70">
            Interactive expense operations with receipt readiness and deduction proof.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="h-9 bg-[#56C5D0] px-4 text-[#0A0A0A] hover:bg-[#48AAB5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add expense
          </Button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Filtered expenses" value={String(totals.count)} helper="Based on active controls" />
        <SummaryCard label="Total spend" value={formatMoney(totals.totalAmount)} helper="Selected range and filters" />
        <SummaryCard label="Estimated deductible" value={formatMoney(totals.deductibleAmount)} helper="From deductible flags" tone="teal" />
        <SummaryCard
          label="Missing receipts"
          value={String(totals.missingReceipts)}
          helper={`Average expense: ${formatMoney(totals.avgExpense)}`}
          tone={totals.missingReceipts > 0 ? "orange" : "teal"}
        />
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-[#111114] p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_VIEWS.map((view) => (
            <button
              key={view.value}
              type="button"
              onClick={() => setQuickView(view.value)}
              className={`h-8 rounded-md border px-3 text-sm transition ${
                quickView === view.value
                  ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                  : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-white/65">
            <span>Receipt completeness</span>
            <span>{totals.receiptCoverage.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#56C5D0] transition-all"
              style={{ width: `${Math.min(100, Math.max(0, totals.receiptCoverage))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search merchant, description, notes"
            className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0] md:col-span-2"
          />

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORIES).map(([value, category]) => (
                <SelectItem key={value} value={value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={receiptFilter} onValueChange={setReceiptFilter}>
            <SelectTrigger className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
              <SelectValue placeholder="Receipt" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              <SelectItem value="all">All receipt states</SelectItem>
              <SelectItem value="with_receipt">With receipt</SelectItem>
              <SelectItem value="missing">Missing receipt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[180px] border-white/20 bg-transparent text-xs text-[#F5F5F5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setReceiptFilter("all");
              setQuickView("all");
            }}
            className="h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10"
          >
            Reset filters
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111114]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#D8D8D8]">Date</TableHead>
              <TableHead className="text-[#D8D8D8]">Merchant</TableHead>
              <TableHead className="text-[#D8D8D8]">Category</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Amount</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Deductible</TableHead>
              <TableHead className="text-[#D8D8D8]">Receipt</TableHead>
              <TableHead className="text-[#D8D8D8]">Payment</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 && (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center text-sm text-white/60">
                  {isLoading ? "Loading expenses..." : "No expenses match selected filters."}
                </TableCell>
              </TableRow>
            )}
            {filteredExpenses.map((expense) => {
              const deductiblePct = expense.is_tax_deductible
                ? `${expense.deduction_percentage ?? 100}%`
                : "No";

              return (
                <TableRow key={expense.id} className="border-white/10 hover:bg-white/[0.02]">
                  <TableCell className="text-sm text-white/75">
                    {expense.expense_date
                      ? format(new Date(expense.expense_date), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-[#F5F5F5]">{expense.merchant || "-"}</TableCell>
                  <TableCell className="text-sm text-white/75">
                    {CATEGORIES[expense.category]?.label || expense.category || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F5F5F5]">
                    {formatMoney(expense.amount || 0)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-[#56C5D0]">{deductiblePct}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs ${
                        expense.receipt_url
                          ? "border-[#56C5D0]/35 bg-[#56C5D0]/10 text-[#56C5D0]"
                          : "border-[#F0A562]/35 bg-[#F0A562]/10 text-[#F0A562]"
                      }`}
                    >
                      {expense.receipt_url ? "Attached" : "Missing"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-white/75">{expense.payment_method || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(expense)}
                        className="h-8 border-white/20 bg-transparent px-2 text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeExpense(expense)}
                        disabled={deleteMutation.isPending}
                        className="h-8 border-[#F06C6C]/35 bg-transparent px-2 text-[#F06C6C] hover:bg-[#F06C6C]/10 focus-visible:ring-2 focus-visible:ring-[#F06C6C]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editingExpense}
        onSuccess={onModalSuccess}
        onOpenHelpDrawer={() => {}}
      />
    </div>
  );
}
