import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { base44 } from "@/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Plus,
    Receipt,
    X,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/expenseCategories";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const expenseSchema = z.object({
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    expense_date: z.string().min(1, "Date is required"),
    merchant: z.string().optional(),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    deductible: z.enum(["yes", "partial", "no"]),
    deduction_percentage: z.coerce.number().min(0).max(100),
    payment_method: z.string().min(1, "Payment method is required"),
    receipt_url: z.string().optional(),
    notes: z.string().optional(),
});

const PAYMENT_METHODS = [
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
    { value: "other", label: "Other" },
];

/**
 * ExpenseModal — full-featured add/edit expense modal.
 * Fields: date, merchant, description, category, amount, payment method,
 * receipt upload, deductible (Yes/Partial/No), notes.
 * Progressive disclosure for advanced fields.
 */
export default function ExpenseModal({
    open,
    onOpenChange,
    onSuccess,
    onOpenHelpDrawer,
    initialData = null,
}) {
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const fileInputRef = useRef(null);
    const isEditing = !!initialData;

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            amount: "",
            expense_date: format(new Date(), "yyyy-MM-dd"),
            category: "software_subscriptions",
            description: "",
            merchant: "",
            deductible: "yes",
            deduction_percentage: 100,
            receipt_url: "",
            payment_method: "credit_card",
            notes: "",
        },
    });

    const receiptUrl = watch("receipt_url");
    const deductible = watch("deductible");

    // Populate form when editing
    useEffect(() => {
        if (open && initialData) {
            const dedType =
                !initialData.is_tax_deductible
                    ? "no"
                    : initialData.deduction_percentage < 100
                        ? "partial"
                        : "yes";
            reset({
                amount: initialData.amount || "",
                expense_date: initialData.expense_date || format(new Date(), "yyyy-MM-dd"),
                category: initialData.category || "other",
                description: initialData.description || "",
                merchant: initialData.merchant || "",
                deductible: dedType,
                deduction_percentage: initialData.deduction_percentage ?? 100,
                receipt_url: initialData.receipt_url || "",
                payment_method: initialData.payment_method || "credit_card",
                notes: initialData.notes || "",
            });
            if (dedType === "partial" || initialData.notes) setShowAdvanced(true);
        } else if (open && !initialData) {
            reset({
                amount: "",
                expense_date: format(new Date(), "yyyy-MM-dd"),
                category: "software_subscriptions",
                description: "",
                merchant: "",
                deductible: "yes",
                deduction_percentage: 100,
                receipt_url: "",
                payment_method: "credit_card",
                notes: "",
            });
            setShowAdvanced(false);
        }
    }, [open, initialData, reset]);

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            is_tax_deductible: data.deductible !== "no",
            deduction_percentage:
                data.deductible === "yes"
                    ? 100
                    : data.deductible === "no"
                        ? 0
                        : data.deduction_percentage,
        };

        try {
            if (isEditing) {
                await base44.entities.Expense.update(initialData.id, payload);
                toast.success("Expense updated");
            } else {
                await base44.entities.Expense.create(payload);
                toast.success("Expense added");
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to save expense: " + (error?.message || "Unknown error"));
        }
    };

    const handleReceiptUpload = async (file) => {
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
        if (!allowed.includes(file.type)) {
            toast.error("Please upload an image (JPEG, PNG, WebP) or PDF");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be smaller than 10 MB");
            return;
        }

        setUploadingReceipt(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setValue("receipt_url", file_url, { shouldValidate: true });
            toast.success("Receipt attached");
        } catch {
            toast.error("Upload failed — please try again");
        } finally {
            setUploadingReceipt(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleReceiptUpload(file);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-[var(--z-bg-2)] border border-[var(--z-border-1)] max-w-xl max-h-[92vh] overflow-y-auto p-0 rounded-xl"
                style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
            >
                {/* Header */}
                <DialogHeader className="sticky top-0 z-10 px-6 py-5 border-b border-[var(--z-border-1)] bg-[var(--z-bg-2)]">
                    <DialogTitle className="text-[15px] font-semibold text-[var(--z-text-1)]">
                        {isEditing ? "Edit Expense" : "Add Expense"}
                    </DialogTitle>
                    <p className="text-[11px] text-[var(--z-text-3)] mt-0.5">
                        All fields marked * are required
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

                    {/* ── Two-column: Date + Amount ── */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="expense_date" className="text-[12px] text-[var(--z-text-2)] font-medium">
                                Date *
                            </Label>
                            <Controller
                                name="expense_date"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="expense_date"
                                        type="date"
                                        className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] h-9 focus-visible:ring-[var(--z-accent)]"
                                    />
                                )}
                            />
                            {errors.expense_date && (
                                <p className="text-[11px] text-[var(--z-danger)]">{errors.expense_date.message}</p>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <Label htmlFor="amount" className="text-[12px] text-[var(--z-text-2)] font-medium">
                                Amount (USD) *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--z-text-3)]">
                                    $
                                </span>
                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] h-9 pl-7 font-mono focus-visible:ring-[var(--z-accent)]"
                                        />
                                    )}
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-[11px] text-[var(--z-danger)]">{errors.amount.message}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Merchant ── */}
                    <div className="space-y-1.5">
                        <Label htmlFor="merchant" className="text-[12px] text-[var(--z-text-2)] font-medium">
                            Merchant / Payee
                        </Label>
                        <Controller
                            name="merchant"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    id="merchant"
                                    placeholder="e.g. Adobe, AWS, Starbucks"
                                    className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] h-9 focus-visible:ring-[var(--z-accent)]"
                                />
                            )}
                        />
                    </div>

                    {/* ── Description ── */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-[12px] text-[var(--z-text-2)] font-medium">
                            Description
                        </Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    id="description"
                                    placeholder="What was this expense for? Be specific — this creates your audit trail."
                                    className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] min-h-[72px] resize-none focus-visible:ring-[var(--z-accent)]"
                                />
                            )}
                        />
                    </div>

                    {/* ── Category ── */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="category" className="text-[12px] text-[var(--z-text-2)] font-medium">
                                Category *
                            </Label>
                            <button
                                type="button"
                                onClick={onOpenHelpDrawer}
                                className="flex items-center gap-1 text-[11px] text-[var(--z-accent)] hover:text-[var(--z-accent-2)] transition-colors focus-visible:outline-none focus-visible:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Learn what counts
                            </button>
                        </div>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger
                                        id="category"
                                        className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] h-9 focus-visible:ring-[var(--z-accent)]"
                                    >
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--z-bg-2)] border-[var(--z-border-1)]">
                                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                                            <SelectItem key={key} value={key} className="text-[13px]">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-sm">{cat.icon}</span>
                                                    <span>{cat.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.category && (
                            <p className="text-[11px] text-[var(--z-danger)]">{errors.category.message}</p>
                        )}
                    </div>

                    {/* ── Deductible selector ── */}
                    <div className="space-y-1.5">
                        <Label className="text-[12px] text-[var(--z-text-2)] font-medium">
                            Tax Deductible
                        </Label>
                        <Controller
                            name="deductible"
                            control={control}
                            render={({ field }) => (
                                <div className="flex gap-2" role="group" aria-label="Deductibility">
                                    {[
                                        { value: "yes", label: "Yes", activeClass: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" },
                                        { value: "partial", label: "Partial", activeClass: "bg-amber-500/15 border-amber-500/40 text-amber-400" },
                                        { value: "no", label: "No", activeClass: "bg-[var(--z-danger)]/15 border-[var(--z-danger)]/40 text-[var(--z-danger)]" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                field.onChange(opt.value);
                                                if (opt.value === "partial") {
                                                    setShowAdvanced(true);
                                                    setValue("deduction_percentage", 50);
                                                } else {
                                                    setValue("deduction_percentage", opt.value === "yes" ? 100 : 0);
                                                }
                                            }}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg border text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]",
                                                field.value === opt.value
                                                    ? opt.activeClass
                                                    : "border-[var(--z-border-1)] text-[var(--z-text-3)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-2)] bg-[var(--z-bg-3)]"
                                            )}
                                            aria-pressed={field.value === opt.value}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        />
                    </div>

                    {/* Partial percentage — shown when deductible = partial */}
                    {deductible === "partial" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="deduction_percentage" className="text-[12px] text-[var(--z-text-2)] font-medium">
                                Deduction Percentage
                            </Label>
                            <div className="relative">
                                <Controller
                                    name="deduction_percentage"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            id="deduction_percentage"
                                            type="number"
                                            min="1"
                                            max="99"
                                            className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] h-9 pr-8 font-mono focus-visible:ring-[var(--z-accent)]"
                                        />
                                    )}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--z-text-3)]">
                                    %
                                </span>
                            </div>
                            {errors.deduction_percentage && (
                                <p className="text-[11px] text-[var(--z-danger)]">{errors.deduction_percentage.message}</p>
                            )}
                        </div>
                    )}

                    {/* ── Payment Method ── */}
                    <div className="space-y-1.5">
                        <Label htmlFor="payment_method" className="text-[12px] text-[var(--z-text-2)] font-medium">
                            Payment Method *
                        </Label>
                        <Controller
                            name="payment_method"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger
                                        id="payment_method"
                                        className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] h-9 focus-visible:ring-[var(--z-accent)]"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--z-bg-2)] border-[var(--z-border-1)]">
                                        {PAYMENT_METHODS.map((m) => (
                                            <SelectItem key={m.value} value={m.value} className="text-[13px]">
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* ── Receipt Upload ── */}
                    <div className="space-y-1.5">
                        <Label className="text-[12px] text-[var(--z-text-2)] font-medium">
                            Receipt
                        </Label>
                        <div
                            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className={cn(
                                "rounded-lg border-2 border-dashed transition-colors",
                                dragActive
                                    ? "border-[var(--z-accent)] bg-[var(--z-accent)]/5"
                                    : "border-[var(--z-border-1)] hover:border-[var(--z-border-2)]"
                            )}
                        >
                            {receiptUrl ? (
                                <div className="flex items-center gap-3 p-3">
                                    <div
                                        className="w-12 h-12 rounded-lg border border-[var(--z-border-1)] bg-cover bg-center flex-shrink-0"
                                        style={{ backgroundImage: `url(${receiptUrl})` }}
                                        aria-label="Receipt preview"
                                        role="img"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[var(--z-text-1)]">Receipt attached</p>
                                        <a
                                            href={receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-[var(--z-accent)] hover:text-[var(--z-accent-2)] transition-colors"
                                        >
                                            View file ↗
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setValue("receipt_url", "")}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--z-text-3)] hover:text-[var(--z-danger)] hover:bg-[var(--z-danger)]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                                        aria-label="Remove receipt"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingReceipt}
                                    className="w-full p-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] focus-visible:ring-inset rounded-lg"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) => handleReceiptUpload(e.target.files?.[0])}
                                        aria-label="Upload receipt file"
                                    />
                                    {uploadingReceipt ? (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <Loader2 className="w-5 h-5 animate-spin text-[var(--z-text-3)]" />
                                            <p className="text-[12px] text-[var(--z-text-3)]">Uploading…</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5">
                                            <Receipt className="w-5 h-5 text-[var(--z-text-3)]" />
                                            <p className="text-[12px] font-medium text-[var(--z-text-2)]">
                                                Drop receipt here or click to upload
                                            </p>
                                            <p className="text-[11px] text-[var(--z-text-3)]">
                                                JPEG, PNG, PDF · Max 10 MB
                                            </p>
                                        </div>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Advanced fields toggle ── */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced((v) => !v)}
                            className="flex items-center gap-1.5 text-[12px] text-[var(--z-text-3)] hover:text-[var(--z-text-2)] transition-colors focus-visible:outline-none focus-visible:underline"
                            aria-expanded={showAdvanced}
                        >
                            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showAdvanced ? "Hide" : "Show"} additional fields (Notes)
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 space-y-1.5">
                                <Label htmlFor="notes" className="text-[12px] text-[var(--z-text-2)] font-medium">
                                    Notes
                                </Label>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <Textarea
                                            {...field}
                                            id="notes"
                                            placeholder="Internal notes, project name, client reference…"
                                            className="bg-[var(--z-bg-3)] border-[var(--z-border-1)] text-[var(--z-text-1)] text-[13px] min-h-[72px] resize-none focus-visible:ring-[var(--z-accent)]"
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Disclaimer ── */}
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-[var(--z-bg-3)] border border-[var(--z-border-1)] rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--z-warn)] flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[var(--z-text-3)] leading-relaxed">
                            General guidance only — not tax advice. Deductibility depends on your
                            situation. Consult a qualified accountant before filing.
                        </p>
                    </div>

                    {/* ── Footer actions ── */}
                    <div className="flex gap-3 pt-1 border-t border-[var(--z-border-1)]">
                        <Button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-9 text-[13px] bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-[var(--z-text-2)] hover:bg-[var(--z-bg-3)] hover:text-[var(--z-text-1)] hover:border-[var(--z-border-2)]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-9 text-[13px] bg-[var(--z-accent)] hover:bg-[var(--z-accent-2)] text-[#09090B] font-semibold border-0 focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    {isEditing ? "Save Changes" : "Add Expense"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
