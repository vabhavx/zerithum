import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Pencil, Plus, Trash2, PieChart as PieChartIcon, Receipt, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
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
import { PageTransition, AnimatedItem } from "@/components/ui/PageTransition";
import { GlassCard, InteractiveMetricCard } from "@/components/ui/glass-card";

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

const COLORS = ["#111827", "#6B7280", "#9CA3AF", "#7C3AED", "#3B82F6", "#10B981", "#EC4899"];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return money.format(value || 0);
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
  const [showChart, setShowChart] = useState(true);

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

  const categoryData = useMemo(() => {
    const map = new Map();
    filteredExpenses.forEach(tx => {
      const cat = tx.category || "Uncategorized";
      const val = map.get(cat) || 0;
      map.set(cat, val + (tx.amount || 0));
    });

    return Array.from(map.entries())
      .map(([key, value]) => ({
        name: CATEGORIES[key]?.label || key,
        value
      }))
      .sort((a, b) => b.value - a.value);
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
    <PageTransition className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Expenses</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Track deductions, receipts, and spending patterns.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowChart(!showChart)}
            className={`h-9 border-gray-200 text-gray-600 hover:bg-gray-50 ${showChart ? "bg-gray-50" : ""}`}
          >
            <PieChartIcon className="mr-2 h-4 w-4" />
            {showChart ? "Hide Breakdown" : "Show Breakdown"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="h-9 bg-gray-900 px-4 text-white hover:bg-gray-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add expense
          </Button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedItem delay={0.1}>
          <InteractiveMetricCard
            title="Total Spend"
            value={formatMoney(totals.totalAmount)}
            sub={`Avg: ${formatMoney(totals.avgExpense)}`}
          />
        </AnimatedItem>
        <AnimatedItem delay={0.2}>
          <InteractiveMetricCard
            title="Estimated Deductible"
            value={formatMoney(totals.deductibleAmount)}
            sub="Based on tax flags"
            tone="teal"
          />
        </AnimatedItem>
        <AnimatedItem delay={0.3}>
          <InteractiveMetricCard
            title="Receipt Coverage"
            value={`${totals.receiptCoverage.toFixed(0)}%`}
            sub={`${totals.count - totals.missingReceipts} / ${totals.count} verified`}
            tone={totals.receiptCoverage > 90 ? "teal" : "orange"}
          />
        </AnimatedItem>
        <AnimatedItem delay={0.4}>
          <div className={`relative h-full overflow-hidden rounded-lg border p-4 transition-colors ${totals.missingReceipts > 0
              ? "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-gray-50"
            }`}>
            {totals.missingReceipts > 0 && (
              <div className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            )}
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Action Required</p>
            <p className={`mt-2 font-mono-financial text-2xl font-semibold ${totals.missingReceipts > 0 ? "text-amber-600" : "text-gray-900"
              }`}>{totals.missingReceipts}</p>
            <p className="mt-1 text-xs text-gray-500">Missing receipts</p>
          </div>
        </AnimatedItem>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Filters & Table Area */}
        <div className={`space-y-6 ${showChart ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <AnimatedItem delay={0.2}>
            <GlassCard variant="panel" className="p-4">
              {/* Quick Views */}
              <div className="mb-4 flex flex-wrap gap-1">
                {QUICK_VIEWS.map((view) => (
                  <button
                    key={view.value}
                    type="button"
                    onClick={() => setQuickView(view.value)}
                    className={`h-8 rounded-md px-3 text-sm font-medium transition-all ${quickView === view.value
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>

              {/* Filter Inputs */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search merchant, description..."
                    className="h-9 border-gray-200 bg-white pl-9 text-gray-900 focus-visible:border-gray-400 focus-visible:ring-0"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 border-gray-200 bg-white text-gray-700">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white text-gray-900">
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.entries(CATEGORIES).map(([value, category]) => (
                      <SelectItem key={value} value={value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={receiptFilter} onValueChange={setReceiptFilter}>
                  <SelectTrigger className="h-9 border-gray-200 bg-white text-gray-700">
                    <SelectValue placeholder="Receipt" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white text-gray-900">
                    <SelectItem value="all">All receipt states</SelectItem>
                    <SelectItem value="with_receipt">With receipt</SelectItem>
                    <SelectItem value="missing">Missing receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[160px] border-gray-200 bg-white text-xs text-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white text-gray-900">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                    setReceiptFilter("all");
                    setQuickView("all");
                  }}
                  className="h-8 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  Reset
                </Button>
              </div>
            </GlassCard>
          </AnimatedItem>

          <AnimatedItem delay={0.3}>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-gray-500">Date</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Merchant</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Category</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500">Amount</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500">Deductible</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Receipt</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Payment</TableHead>
                    <TableHead className="text-right w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 && (
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-400">
                        {isLoading ? "Loading expenses..." : "No expenses match selected filters."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredExpenses.map((expense, index) => {
                    const deductiblePct = expense.is_tax_deductible
                      ? `${expense.deduction_percentage ?? 100}%`
                      : "No";

                    return (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-100 transition-colors hover:bg-gray-50/50 group"
                      >
                        <TableCell className="text-sm text-gray-500">
                          {expense.expense_date
                            ? format(new Date(expense.expense_date), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-900 font-medium">{expense.merchant || "-"}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {CATEGORIES[expense.category]?.label || expense.category || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono-financial text-gray-900">
                          {formatMoney(expense.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-900 font-mono">{deductiblePct}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border ${expense.receipt_url
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                          >
                            <Receipt className="h-3 w-3" />
                            {expense.receipt_url ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{expense.payment_method || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(expense)}
                              className="h-7 w-7 p-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeExpense(expense)}
                              disabled={deleteMutation.isPending}
                              className="h-7 w-7 p-0 hover:bg-red-50 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </GlassCard>
          </AnimatedItem>
        </div>

        {/* Breakdown Chart Sidebar */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <GlassCard className="p-5 sticky top-20">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">
                  Spend by Category
                </h3>

                <div className="h-[200px] w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#111827' }}
                        formatter={(value) => formatMoney(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {categoryData.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-mono-financial text-gray-900">{formatMoney(item.value)}</span>
                    </div>
                  ))}
                  {categoryData.length > 6 && (
                    <p className="text-xs text-center text-gray-400 pt-2">
                      + {categoryData.length - 6} more categories
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editingExpense}
        onSuccess={onModalSuccess}
        onOpenHelpDrawer={() => { }}
      />
    </PageTransition>
  );
}
