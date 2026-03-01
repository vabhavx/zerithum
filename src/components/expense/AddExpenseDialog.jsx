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
import { Loader2, Plus, Sparkles, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/expenseCategories";
import { format } from "date-fns";

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
        defaultValues: { amount: "", expense_date: format(new Date(), "yyyy-MM-dd"), category: "software_subscriptions", description: "", merchant: "", is_tax_deductible: true, deduction_percentage: 100, receipt_url: "", payment_method: "credit_card" }
    });

    const receiptUrl = watch("receipt_url");
    const description = watch("description");
    const merchant = watch("merchant");
    const amount = watch("amount");

    useEffect(() => { if (!open) reset(); }, [open, reset]);

    const onSubmit = async (data) => {
        try { await base44.entities.Expense.create(data); toast.success("Expense added successfully"); onSuccess?.(); onOpenChange(false); } catch (error) { toast.error("Failed to add expense: " + error.message); }
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
        } catch (error) { toast.error("Failed to process receipt"); } finally { setUploadingReceipt(false); setProcessingReceipt(false); }
    };

    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if (file && file.type.startsWith('image/')) { handleReceiptUpload(file); } else { toast.error("Please drop an image file"); } };

    const handleAICategorize = async () => {
        if (!description && !merchant) { toast.error("Add a description or merchant first"); return; }
        setCategorizing(true);
        try {
            const result = await base44.functions.invoke('categorizeExpense', { description, merchant, amount: parseFloat(amount) || 0, receiptUrl });
            if (result.data.success) { setValue("category", result.data.category); setValue("is_tax_deductible", result.data.is_tax_deductible); setValue("deduction_percentage", result.data.deduction_percentage); toast.success(`Categorized as ${CATEGORIES[result.data.category].label}`); }
        } catch (error) { toast.error("Failed to categorize"); } finally { setCategorizing(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl border border-gray-200 bg-white max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                    <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">Add Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
                    <div className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-gray-50'} ${receiptUrl ? 'p-4' : 'p-8 text-center hover:border-gray-400'}`} onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                        {receiptUrl ? (
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url(${receiptUrl})` }} />
                                <div className="flex-1"><p className="text-sm font-medium text-gray-900">Receipt Uploaded</p><p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><Sparkles className="w-3 h-3" /> Processed & Data Extracted</p></div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setValue("receipt_url", "")} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <div onClick={() => document.getElementById('receipt-upload').click()} className="cursor-pointer">
                                <Input id="receipt-upload" type="file" accept="image/*" onChange={(e) => handleReceiptUpload(e.target.files?.[0])} disabled={uploadingReceipt || processingReceipt} className="hidden" />
                                {(uploadingReceipt || processingReceipt) ? (<div className="flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" /><p className="text-sm text-gray-500">Scanning receipt...</p></div>) : (<div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"><Receipt className="w-6 h-6 text-gray-400" /></div><p className="text-sm font-medium text-gray-900">Drop receipt here to auto-fill</p><p className="text-xs text-gray-400">or click to upload</p></div>)}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-gray-500 text-sm">Amount *</Label><Controller name="amount" control={control} render={({ field }) => (<Input {...field} type="number" step="0.01" placeholder="0.00" className="border-gray-200 bg-white text-gray-900" />)} />{errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}</div>
                        <div className="space-y-2"><Label className="text-gray-500 text-sm">Date *</Label><Controller name="expense_date" control={control} render={({ field }) => (<Input {...field} type="date" className="border-gray-200 bg-white text-gray-900" />)} />{errors.expense_date && <p className="text-xs text-red-600">{errors.expense_date.message}</p>}</div>
                    </div>
                    <div className="space-y-2"><Label className="text-gray-500 text-sm">Merchant</Label><Controller name="merchant" control={control} render={({ field }) => (<Input {...field} placeholder="Amazon, Adobe, etc." className="border-gray-200 bg-white text-gray-900" />)} /></div>
                    <div className="space-y-2"><Label className="text-gray-500 text-sm">Description</Label><Controller name="description" control={control} render={({ field }) => (<Textarea {...field} placeholder="What was this expense for?" className="border-gray-200 bg-white text-gray-900 min-h-[80px]" />)} /></div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between"><Label className="text-gray-500 text-sm">Category</Label><Button type="button" onClick={handleAICategorize} disabled={categorizing} variant="ghost" size="sm" className="h-6 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2">{categorizing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}AI Suggest</Button></div>
                        <Controller name="category" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="border-gray-200 bg-white text-gray-900"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent className="border-gray-200 bg-white text-gray-900">{Object.entries(CATEGORIES).map(([key, cat]) => (<SelectItem key={key} value={key}><span className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span></SelectItem>))}</SelectContent></Select>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-gray-500 text-sm">Tax Deductible %</Label><Controller name="deduction_percentage" control={control} render={({ field }) => (<Input {...field} type="number" min="0" max="100" className="border-gray-200 bg-white text-gray-900" />)} /></div>
                        <div className="space-y-2"><Label className="text-gray-500 text-sm">Payment Method</Label><Controller name="payment_method" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="border-gray-200 bg-white text-gray-900"><SelectValue /></SelectTrigger><SelectContent className="border-gray-200 bg-white text-gray-900"><SelectItem value="credit_card">Credit Card</SelectItem><SelectItem value="debit_card">Debit Card</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>)} /></div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">{isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Add Expense</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
