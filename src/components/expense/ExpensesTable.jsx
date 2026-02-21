import React, { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
    ChevronUp,
    ChevronDown,
    Receipt,
    Paperclip,
    Clock,
    FileText,
    Pencil,
    Trash2,
    Search,
    X,
} from "lucide-react";
import { CATEGORIES } from "@/lib/expenseCategories";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const RECEIPT_STATUS = {
    attached: {
        icon: <Paperclip className="w-3.5 h-3.5" />,
        label: "Attached",
        classes: "text-emerald-400",
    },
    pending: {
        icon: <Clock className="w-3.5 h-3.5" />,
        label: "Requested",
        classes: "text-amber-400",
    },
    missing: {
        icon: <Receipt className="w-3.5 h-3.5" />,
        label: "Missing",
        classes: "text-[var(--z-danger)]",
    },
};

function getReceiptStatus(expense) {
    if (expense.receipt_url && expense.receipt_url.trim() !== "") return "attached";
    if (expense.receipt_status === "pending") return "pending";
    return "missing";
}

function DeductibleBadge({ expense }) {
    if (!expense.is_tax_deductible) {
        return (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--z-danger)]/10 text-[var(--z-danger)]">
                No
            </span>
        );
    }
    const pct = expense.deduction_percentage ?? 100;
    if (pct < 100) {
        return (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400">
                {pct}%
            </span>
        );
    }
    return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
            Yes
        </span>
    );
}

function SortButton({ field, sortField, sortDir, onSort, children }) {
    const active = sortField === field;
    return (
        <button
            onClick={() => onSort(field)}
            className="flex items-center gap-1 text-left focus-visible:outline-none focus-visible:underline"
            aria-label={`Sort by ${children}`}
            aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
        >
            {children}
            <span className="inline-flex flex-col ml-0.5 opacity-40">
                {active ? (
                    sortDir === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                    ) : (
                        <ChevronDown className="w-3 h-3" />
                    )
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )}
            </span>
        </button>
    );
}

/**
 * ExpensesTable
 * Full expense table with search, filter, sort, and row actions.
 */
export default function ExpensesTable({ expenses, onEdit, onDelete }) {
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterDeductible, setFilterDeductible] = useState("all");
    const [filterReceipt, setFilterReceipt] = useState("all");
    const [sortField, setSortField] = useState("expense_date");
    const [sortDir, setSortDir] = useState("desc");
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleSort = useCallback(
        (field) => {
            if (sortField === field) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            } else {
                setSortField(field);
                setSortDir("desc");
            }
        },
        [sortField]
    );

    const filtered = useMemo(() => {
        return expenses
            .filter((e) => {
                const q = search.toLowerCase();
                const matchSearch =
                    !q ||
                    (e.merchant || "").toLowerCase().includes(q) ||
                    (e.description || "").toLowerCase().includes(q) ||
                    (e.category || "").toLowerCase().includes(q);
                const matchCat = filterCategory === "all" || e.category === filterCategory;
                const matchDed =
                    filterDeductible === "all" ||
                    (filterDeductible === "yes" && e.is_tax_deductible && (e.deduction_percentage ?? 100) === 100) ||
                    (filterDeductible === "partial" && e.is_tax_deductible && (e.deduction_percentage ?? 100) < 100) ||
                    (filterDeductible === "no" && !e.is_tax_deductible);
                const matchReceipt =
                    filterReceipt === "all" || getReceiptStatus(e) === filterReceipt;
                return matchSearch && matchCat && matchDed && matchReceipt;
            })
            .sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                const mod = sortDir === "asc" ? 1 : -1;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                return aVal < bVal ? -1 * mod : aVal > bVal ? 1 * mod : 0;
            });
    }, [expenses, search, filterCategory, filterDeductible, filterReceipt, sortField, sortDir]);

    const clearFilters = () => {
        setSearch("");
        setFilterCategory("all");
        setFilterDeductible("all");
        setFilterReceipt("all");
    };

    const hasFilters =
        search || filterCategory !== "all" || filterDeductible !== "all" || filterReceipt !== "all";

    return (
        <section className="z-card" aria-label="Expense records">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[var(--z-border-1)]">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--z-text-3)]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search merchant, description…"
                        aria-label="Search expenses"
                        className="pl-8 h-8 text-[12px] bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] focus-visible:ring-[var(--z-accent)]"
                    />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-[12px] w-[160px] bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-2)]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-2)] border-[var(--z-border-1)]">
                        <SelectItem value="all" className="text-[12px]">All Categories</SelectItem>
                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                            <SelectItem key={key} value={key} className="text-[12px]">
                                {cat.icon} {cat.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterDeductible} onValueChange={setFilterDeductible}>
                    <SelectTrigger className="h-8 text-[12px] w-[130px] bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-2)]">
                        <SelectValue placeholder="Deductible" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-2)] border-[var(--z-border-1)]">
                        <SelectItem value="all" className="text-[12px]">All</SelectItem>
                        <SelectItem value="yes" className="text-[12px]">Yes — full</SelectItem>
                        <SelectItem value="partial" className="text-[12px]">Partial</SelectItem>
                        <SelectItem value="no" className="text-[12px]">No</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterReceipt} onValueChange={setFilterReceipt}>
                    <SelectTrigger className="h-8 text-[12px] w-[130px] bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-2)]">
                        <SelectValue placeholder="Receipt" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--z-bg-2)] border-[var(--z-border-1)]">
                        <SelectItem value="all" className="text-[12px]">All receipts</SelectItem>
                        <SelectItem value="attached" className="text-[12px]">Attached</SelectItem>
                        <SelectItem value="pending" className="text-[12px]">Requested</SelectItem>
                        <SelectItem value="missing" className="text-[12px]">Missing</SelectItem>
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-[11px] text-[var(--z-text-3)] hover:text-[var(--z-text-2)] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}

                <span className="ml-auto text-[11px] text-[var(--z-text-3)]">
                    {filtered.length} of {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full" aria-label="Expense records table">
                    <thead>
                        <tr className="border-b border-[var(--z-border-1)]">
                            {[
                                { label: "Date", field: "expense_date", sortable: true },
                                { label: "Merchant", field: "merchant", sortable: false },
                                { label: "Category", field: "category", sortable: false },
                                { label: "Amount", field: "amount", sortable: true, right: true },
                                { label: "Receipt", field: null, sortable: false },
                                { label: "Deductible", field: null, sortable: false },
                                { label: "Notes", field: null, sortable: false },
                                { label: "Actions", field: null, sortable: false },
                            ].map(({ label, field, sortable, right }) => (
                                <th
                                    key={label}
                                    className={cn(
                                        "px-4 py-3 text-[11px] font-semibold text-[var(--z-text-3)] uppercase tracking-wide",
                                        right ? "text-right" : "text-left"
                                    )}
                                >
                                    {sortable ? (
                                        <SortButton
                                            field={field}
                                            sortField={sortField}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                        >
                                            {label}
                                        </SortButton>
                                    ) : (
                                        label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--z-border-1)]">
                        {filtered.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-16 text-center text-[13px] text-[var(--z-text-3)]"
                                >
                                    {expenses.length === 0
                                        ? "No expenses yet. Add your first expense to get started."
                                        : "No expenses match your filters. Try clearing the search."}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((expense) => {
                                const cat = CATEGORIES[expense.category] || CATEGORIES.other;
                                const rcptStatus = getReceiptStatus(expense);
                                const rcpt = RECEIPT_STATUS[rcptStatus];
                                const isDeleting = confirmDelete === expense.id;

                                return (
                                    <tr
                                        key={expense.id}
                                        className={cn(
                                            "group transition-colors",
                                            isDeleting
                                                ? "bg-[var(--z-danger)]/5"
                                                : "hover:bg-[var(--z-bg-3)]/50"
                                        )}
                                    >
                                        {/* Date */}
                                        <td className="px-4 py-3 text-[12px] text-[var(--z-text-2)] tabular-nums whitespace-nowrap">
                                            {expense.expense_date
                                                ? format(new Date(expense.expense_date), "MMM d, yyyy")
                                                : "—"}
                                        </td>

                                        {/* Merchant */}
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <p className="text-[13px] font-medium text-[var(--z-text-1)] truncate">
                                                {expense.merchant || "—"}
                                            </p>
                                            {expense.description && (
                                                <p className="text-[11px] text-[var(--z-text-3)] truncate mt-0.5">
                                                    {expense.description}
                                                </p>
                                            )}
                                        </td>

                                        {/* Category */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium",
                                                    cat.color
                                                )}
                                            >
                                                <span className="text-[12px] leading-none">{cat.icon}</span>
                                                {cat.label}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-3 text-right">
                                            <p className="text-[13px] font-semibold text-[var(--z-text-1)] tabular-nums font-mono">
                                                ${(expense.amount || 0).toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </td>

                                        {/* Receipt status */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "flex items-center gap-1.5 text-[11px] font-medium w-fit whitespace-nowrap",
                                                    rcpt.classes
                                                )}
                                                title={
                                                    rcptStatus === "attached"
                                                        ? "Receipt on file"
                                                        : rcptStatus === "pending"
                                                            ? "Receipt requested — upload when available"
                                                            : "No receipt attached"
                                                }
                                            >
                                                {rcpt.icon}
                                                {rcpt.label}
                                            </span>
                                        </td>

                                        {/* Deductible */}
                                        <td className="px-4 py-3">
                                            <DeductibleBadge expense={expense} />
                                        </td>

                                        {/* Notes */}
                                        <td className="px-4 py-3 max-w-[140px]">
                                            {expense.notes ? (
                                                <span
                                                    className="inline-flex items-center gap-1 text-[11px] text-[var(--z-text-3)] cursor-default"
                                                    title={expense.notes}
                                                >
                                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{expense.notes}</span>
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-[var(--z-text-3)]/40">—</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {!isDeleting ? (
                                                    <>
                                                        <button
                                                            onClick={() => onEdit(expense)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--z-text-3)] hover:text-[var(--z-text-1)] hover:bg-[var(--z-bg-3)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                                                            aria-label={`Edit expense: ${expense.merchant || expense.description || "expense"}`}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(expense.id)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--z-text-3)] hover:text-[var(--z-danger)] hover:bg-[var(--z-danger)]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                                                            aria-label={`Delete expense: ${expense.merchant || expense.description || "expense"}`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-[var(--z-danger)]">Delete?</span>
                                                        <button
                                                            onClick={() => {
                                                                onDelete(expense.id);
                                                                setConfirmDelete(null);
                                                            }}
                                                            className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--z-danger)]/10 text-[var(--z-danger)] hover:bg-[var(--z-danger)]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-danger)]"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(null)}
                                                            className="px-2 py-1 text-[11px] font-medium rounded bg-[var(--z-bg-3)] text-[var(--z-text-2)] hover:bg-[var(--z-border-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
