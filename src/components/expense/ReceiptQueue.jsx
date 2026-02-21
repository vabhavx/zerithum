import React, { useState, useRef } from "react";
import { Receipt, Upload, Clock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * ReceiptQueue
 * Lists expenses missing receipts. Allows upload or tagging as "Request later".
 * Collapsible panel, shows count badge.
 */
export default function ReceiptQueue({ expenses }) {
    const [collapsed, setCollapsed] = useState(false);
    const queryClient = useQueryClient();

    const missing = expenses.filter(
        (e) => !e.receipt_url || e.receipt_url.trim() === ""
    );

    if (missing.length === 0) return null;

    return (
        <section className="z-card mb-5" aria-label="Missing receipts queue">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] focus-visible:ring-inset rounded-t-lg"
                onClick={() => setCollapsed((v) => !v)}
                aria-expanded={!collapsed}
                aria-controls="receipt-queue-body"
            >
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[var(--z-warn)] flex-shrink-0" />
                    <span className="text-[13px] font-medium text-[var(--z-text-1)]">
                        Missing Receipts
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--z-warn)]/10 text-[var(--z-warn)]">
                        {missing.length}
                    </span>
                </div>
                {collapsed ? (
                    <ChevronDown className="w-4 h-4 text-[var(--z-text-3)]" />
                ) : (
                    <ChevronUp className="w-4 h-4 text-[var(--z-text-3)]" />
                )}
            </button>

            {/* Body */}
            {!collapsed && (
                <div id="receipt-queue-body" className="border-t border-[var(--z-border-1)]">
                    <div className="divide-y divide-[var(--z-border-1)]">
                        {missing.map((expense) => (
                            <ReceiptQueueRow
                                key={expense.id}
                                expense={expense}
                                onUpdate={() =>
                                    queryClient.invalidateQueries({ queryKey: ["expenses"] })
                                }
                            />
                        ))}
                    </div>
                    <div className="px-5 py-3 border-t border-[var(--z-border-1)]">
                        <p className="text-[11px] text-[var(--z-text-3)]">
                            Expenses without receipts are flagged during audits and may result in
                            disallowed deductions. IRS generally requires documentation for deductions ≥ $75.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

function ReceiptQueueRow({ expense, onUpdate }) {
    const [uploading, setUploading] = useState(false);
    const [tagging, setTagging] = useState(false);
    const fileRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await base44.entities.Expense.update(expense.id, {
                receipt_url: file_url,
                receipt_status: "attached",
            });
            toast.success("Receipt attached");
            onUpdate();
        } catch {
            toast.error("Upload failed — please try again");
        } finally {
            setUploading(false);
        }
    };

    const handleTagLater = async () => {
        setTagging(true);
        try {
            await base44.entities.Expense.update(expense.id, {
                receipt_status: "pending",
            });
            toast.success("Tagged as 'Request receipt later'");
            onUpdate();
        } catch {
            toast.error("Failed to tag expense");
        } finally {
            setTagging(false);
        }
    };

    const isPendingTag = expense.receipt_status === "pending";

    return (
        <div className="flex items-center justify-between px-5 py-3.5 gap-4 group">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-[var(--z-text-1)] truncate">
                        {expense.merchant || expense.description || "Unnamed expense"}
                    </p>
                    {isPendingTag && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[var(--z-bg-3)] text-[var(--z-text-3)] border border-[var(--z-border-1)] flex-shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            Request later
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-[var(--z-text-3)] mt-0.5">
                    {expense.expense_date
                        ? format(new Date(expense.expense_date), "MMM d, yyyy")
                        : "No date"}{" "}
                    · ${(expense.amount || 0).toFixed(2)}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Upload button */}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                    aria-label={`Upload receipt for ${expense.merchant || "expense"}`}
                />
                <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]",
                        uploading
                            ? "bg-[var(--z-bg-3)] text-[var(--z-text-3)] cursor-wait"
                            : "bg-[var(--z-accent)]/10 text-[var(--z-accent)] hover:bg-[var(--z-accent)]/20"
                    )}
                >
                    <Upload className="w-3 h-3" />
                    {uploading ? "Uploading…" : "Upload"}
                </button>

                {/* Tag later button */}
                {!isPendingTag && (
                    <button
                        onClick={handleTagLater}
                        disabled={tagging}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-[var(--z-text-3)] hover:text-[var(--z-text-2)] hover:bg-[var(--z-bg-3)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                    >
                        <Clock className="w-3 h-3" />
                        {tagging ? "Saving…" : "Request later"}
                    </button>
                )}
            </div>
        </div>
    );
}
