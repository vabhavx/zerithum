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

const COLORS = ["#56C5D0", "#F0A562", "#F06C6C", "#A78BFA", "#60A5FA", "#34D399", "#F472B6"];

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

  // Chart Data: Group by category
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
      .sort((a,b) => b.value - a.value);
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
    <PageTransition className="mx-auto w-full max-w-[1400px] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5]">Expenses</h1>
          <p className="mt-2 text-base text-white/70">
            Interactive expense operations with receipt readiness and deduction proof.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
             type="button"
             variant="outline"
             onClick={() => setShowChart(!showChart)}
             className={`h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 ${showChart ? "bg-white/10" : ""}`}
           >
             <PieChartIcon className="mr-2 h-4 w-4" />
             {showChart ? "Hide Breakdown" : "Show Breakdown"}
           </Button>
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
            sub={`${totals.count - totals.missingReceipts} / ${totals.count} Verified`}
            tone={totals.receiptCoverage > 90 ? "teal" : "orange"}
          />
        </AnimatedItem>
        <AnimatedItem delay={0.4}>
          <div className="relative h-full overflow-hidden rounded-xl border border-[#F0A562]/30 bg-[#F0A562]/10 p-4 transition-colors hover:border-[#F0A562]/50">
            {totals.missingReceipts > 0 && (
              <div className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-[#F0A562]" />
            )}
            <p className="text-xs uppercase tracking-wide text-white/60">Action Required</p>
            <p className="mt-2 font-mono-financial text-2xl font-semibold text-[#F0A562]">{totals.missingReceipts}</p>
            <p className="mt-1 text-xs text-white/60">Missing Receipts</p>
          </div>
        </AnimatedItem>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Filters & Table Area */}
        <div className={`space-y-6 ${showChart ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <AnimatedItem delay={0.2}>
            <GlassCard variant="panel" className="p-4">
               {/* Quick Views */}
               <div className="mb-4 flex flex-wrap gap-2">
                 {QUICK_VIEWS.map((view) => (
                   <button
                     key={view.value}
                     type="button"
                     onClick={() => setQuickView(view.value)}
                     className={`h-8 rounded-md border px-3 text-sm transition-all ${
                       quickView === view.value
                         ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                         : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
                     }`}
                   >
                     {view.label}
                   </button>
                 ))}
               </div>

               {/* Filter Inputs */}
               <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                 <div className="relative md:col-span-2">
                   <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                   <Input
                     value={search}
                     onChange={(event) => setSearch(event.target.value)}
                     placeholder="Search merchant, description..."
                     className="h-9 border-white/15 bg-[#0A0A0A] pl-9 text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                   />
                 </div>

                 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                   <SelectTrigger className="h-9 border-white/15 bg-[#0A0A0A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
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
                   <SelectTrigger className="h-9 border-white/15 bg-[#0A0A0A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
                     <SelectValue placeholder="Receipt" />
                   </SelectTrigger>
                   <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
                     <SelectItem value="all">All receipt states</SelectItem>
                     <SelectItem value="with_receipt">With receipt</SelectItem>
                     <SelectItem value="missing">Missing receipt</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="mt-4 flex items-center justify-between">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-8 w-[160px] border-white/20 bg-transparent text-xs text-[#F5F5F5]">
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
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("all");
                      setReceiptFilter("all");
                      setQuickView("all");
                    }}
                    className="h-8 text-xs text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    Reset
                  </Button>
               </div>
            </GlassCard>
          </AnimatedItem>

          <AnimatedItem delay={0.3}>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase text-white/50">Date</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-white/50">Merchant</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-white/50">Category</TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase text-white/50">Amount</TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase text-white/50">Deductible</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-white/50">Receipt</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-white/50">Payment</TableHead>
                    <TableHead className="text-right w-[80px]"></TableHead>
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
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.03] group"
                      >
                        <TableCell className="text-sm text-white/75 font-mono">
                          {expense.expense_date
                            ? format(new Date(expense.expense_date), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-[#F5F5F5] font-medium">{expense.merchant || "-"}</TableCell>
                        <TableCell className="text-sm text-white/60">
                          {CATEGORIES[expense.category]?.label || expense.category || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono-financial text-[#F5F5F5]">
                          {formatMoney(expense.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-[#56C5D0] font-mono">{deductiblePct}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border ${
                              expense.receipt_url
                                ? "border-[#56C5D0]/20 bg-[#56C5D0]/10 text-[#56C5D0]"
                                : "border-[#F0A562]/20 bg-[#F0A562]/10 text-[#F0A562]"
                            }`}
                          >
                            <Receipt className="h-3 w-3" />
                            {expense.receipt_url ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-white/60">{expense.payment_method || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(expense)}
                              className="h-7 w-7 p-0 hover:bg-white/10 hover:text-[#56C5D0]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeExpense(expense)}
                              disabled={deleteMutation.isPending}
                              className="h-7 w-7 p-0 hover:bg-[#F06C6C]/10 hover:text-[#F06C6C]"
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
              <GlassCard variant="hud" className="p-5 sticky top-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-6">
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
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => formatMoney(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {categoryData.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-white/70 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-mono-financial text-[#F5F5F5]">{formatMoney(item.value)}</span>
                    </div>
                  ))}
                  {categoryData.length > 6 && (
                    <p className="text-xs text-center text-white/40 pt-2 italic">
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
        onOpenHelpDrawer={() => {}}
      />
    </PageTransition>
  );
}
