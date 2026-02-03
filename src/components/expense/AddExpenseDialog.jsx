import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { base44 } from "@/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Sparkles, Upload, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/expenseCategories";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const expenseSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    expense_date: z.string().min(1, "Date is required"),
    merchant: z.string().optional(),
    description: z.string().optional(),
    category: z.string(),
    is_tax_deductible: z.boolean(),
    deduction_percentage: z.coerce.number().min(0).max(100),
    payment_method: z.string(),
    receipt_url: z.string().optional(),
});

export default function AddExpenseDialog({ open, onOpenChange, onSuccess }) {
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [processingReceipt, setProcessingReceipt] = useState(false);
    const [categorizing, setCategorizing] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const { control, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            amount: "",
            expense_date: format(new Date(), "yyyy-MM-dd"),
            category: "software_subscriptions",
            description: "",
            merchant: "",
            is_tax_deductible: true,
            deduction_percentage: 100,
            receipt_url: "",
            payment_method: "credit_card",
        }
    });

    const receiptUrl = watch("receipt_url");
    const description = watch("description");
    const merchant = watch("merchant");
    const amount = watch("amount");

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const onSubmit = async (data) => {
        try {
            await base44.entities.Expense.create(data);
            toast.success("Expense added successfully");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to add expense: " + error.message);
        }
    };

    const handleReceiptUpload = async (file) => {
        if (!file) return;

        setUploadingReceipt(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setValue("receipt_url", file_url);

            setProcessingReceipt(true);
            const result = await base44.functions.invoke('processReceipt', { receiptUrl: file_url });

            if (result.data.success) {
                const { extracted, categorization } = result.data;

                if (extracted.merchant) setValue("merchant", extracted.merchant);
                if (extracted.amount) setValue("amount", extracted.amount);
                if (extracted.date) setValue("expense_date", extracted.date);
                if (extracted.description) setValue("description", extracted.description);

                if (categorization.category) setValue("category", categorization.category);
                if (categorization.is_tax_deductible !== undefined) setValue("is_tax_deductible", categorization.is_tax_deductible);
                if (categorization.deduction_percentage) setValue("deduction_percentage", categorization.deduction_percentage);

                toast.success("Receipt processed successfully!");
            }
        } catch (error) {
            toast.error("Failed to process receipt");
        } finally {
            setUploadingReceipt(false);
            setProcessingReceipt(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleReceiptUpload(file);
        } else {
            toast.error("Please drop an image file");
        }
    };

    const handleAICategorize = async () => {
        if (!description && !merchant) {
            toast.error("Add a description or merchant first");
            return;
        }

        setCategorizing(true);
        try {
            const result = await base44.functions.invoke('categorizeExpense', {
                description: description,
                merchant: merchant,
                amount: parseFloat(amount) || 0,
                receiptUrl: receiptUrl
            });

            if (result.data.success) {
                setValue("category", result.data.category);
                setValue("is_tax_deductible", result.data.is_tax_deductible);
                setValue("deduction_percentage", result.data.deduction_percentage);
                toast.success(`Categorized as ${CATEGORIES[result.data.category].label}`);
            }
        } catch (error) {
            toast.error("Failed to categorize");
        } finally {
            setCategorizing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="card-modern rounded-2xl border max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-xl">
                    <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                        Add Expense
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
                    {/* Smart Receipt Uploader */}
                    <div
                        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 
              ${dragActive ? 'border-zteal-400 bg-zteal-400/5' : 'border-white/10 bg-white/[0.02]'} 
              ${receiptUrl ? 'p-4' : 'p-8 text-center hover:border-zteal-400/30'}`}
                        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {receiptUrl ? (
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${receiptUrl})` }} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">Receipt Uploaded</p>
                                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                        <Sparkles className="w-3 h-3" /> Processed & Data Extracted
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setValue("receipt_url", "")}
                                    className="text-white/40 hover:text-red-400"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div onClick={() => document.getElementById('receipt-upload').click()} className="cursor-pointer">
                                <Input
                                    id="receipt-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleReceiptUpload(e.target.files?.[0])}
                                    disabled={uploadingReceipt || processingReceipt}
                                    className="hidden"
                                />
                                {(uploadingReceipt || processingReceipt) ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-zteal-400 mb-2" />
                                        <p className="text-sm text-white/60">Scanning receipt...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1">
                                            <Receipt className="w-6 h-6 text-white/40" />
                                        </div>
                                        <p className="text-sm font-medium text-white">Drop receipt here to auto-fill</p>
                                        <p className="text-xs text-white/40">or click to upload</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/60">Amount *</Label>
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                )}
                            />
                            {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/60">Date *</Label>
                            <Controller
                                name="expense_date"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="date"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                )}
                            />
                            {errors.expense_date && <p className="text-xs text-red-400">{errors.expense_date.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/60">Merchant</Label>
                        <Controller
                            name="merchant"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Amazon, Adobe, etc."
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/60">Description</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="What was this expense for?"
                                    className="bg-white/5 border-white/10 text-white min-h-[80px]"
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-white/60">Category</Label>
                            <Button
                                type="button"
                                onClick={handleAICategorize}
                                disabled={categorizing}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-zteal-400 hover:text-zteal-300 hover:bg-zteal-400/10 px-2"
                            >
                                {categorizing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                AI Suggest
                            </Button>
                        </div>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CATEGORIES).map(([key, cat]) => (
                                            <SelectItem key={key} value={key}>
                                                <span className="flex items-center gap-2">
                                                    <span>{cat.icon}</span>
                                                    <span>{cat.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/60">Tax Deductible %</Label>
                            <Controller
                                name="deduction_percentage"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/60">Payment Method</Label>
                            <Controller
                                name="payment_method"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
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
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 border-white/10 text-white/70 hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-zteal-400 hover:bg-zteal-600 text-white"
                        >
                            {isSubmitting ? (
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
    );
}
