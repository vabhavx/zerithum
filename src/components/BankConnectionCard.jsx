import { useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import {
    Landmark, CheckCircle2, AlertTriangle, Loader2, Unplug, RefreshCw,
    ChevronDown, ChevronUp, Upload, Shield, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { auth, functions } from "@/api/supabaseClient";
import supabase from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { GlassCard, itemVariants } from "@/components/ui/glass-card";
import { useTellerConnect } from "@/hooks/use-teller-connect";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function StatusBadge({ status }) {
    if (status === "active") return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Connected
        </span>
    );
    if (status === "reauth_required") return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" /> Needs reconnection
        </span>
    );
    if (status === "error") return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            <AlertTriangle className="h-3 w-3" /> Error
        </span>
    );
    return null;
}

function HowItWorks() {
    const [open, setOpen] = useState(false);
    const steps = [
        { title: "Connect securely", desc: "Select your bank from Teller's secure widget. Zerithum never sees your bank login." },
        { title: "Transactions sync", desc: "Posted deposits are automatically fetched. Only read-only access is used." },
        { title: "Auto-reconcile", desc: "Bank deposits are matched against your platform payouts to flag discrepancies." },
    ];
    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                How it works
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {steps.map((step, i) => (
                                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                    <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <Shield className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-500">
                                Zerithum uses Teller for observation only. No payments, no money movement, no bank credentials stored.
                                Your data is encrypted at rest with AES-256, and all connections use mutual TLS.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function BankConnectionCard({
    connection,
    accounts = [],
    isLoading: isLoadingProp,
}) {
    const queryClient = useQueryClient();
    const [syncing, setSyncing] = useState(false);
    const [disconnectOpen, setDisconnectOpen] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);
    const fileInputRef = useRef(null);

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["bankConnection"] });
        queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
    }, [queryClient]);

    const { open: openTellerConnect, isLoading: tellerLoading } = useTellerConnect({
        enrollmentId: connection?.status === "reauth_required" ? connection.teller_enrollment_id : undefined,
        onSuccess: () => {
            toast.success("Bank connected successfully");
            invalidate();
        },
        onError: (err) => {
            toast.error(err?.message || "Failed to connect bank");
        },
    });

    const handleConnectBank = () => {
        openTellerConnect();
    };

    const handleSync = async () => {
        if (!connection?.id || syncing) return;
        setSyncing(true);
        try {
            const result = await functions.invoke("tellerSync", { connectionId: connection.id });
            if (result?.reauth_required) {
                toast.error("Bank connection needs to be renewed");
            } else {
                toast.success(`Synced ${result?.transactionCount || 0} transactions`);
            }
            invalidate();
        } catch (err) {
            toast.error(err?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!connection?.id) return;
        setDisconnecting(true);
        try {
            await functions.invoke("tellerDisconnect", { connectionId: connection.id });
            toast.success("Bank disconnected");
            setDisconnectOpen(false);
            invalidate();
        } catch (err) {
            toast.error(err?.message || "Failed to disconnect");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleCsvUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvUploading(true);
        try {
            const text = await file.text();
            const lines = text.trim().split("\n");
            if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row");

            const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
            const dateIdx = headers.findIndex((h) => h.includes("date"));
            const amountIdx = headers.findIndex((h) => h.includes("amount"));
            const descIdx = headers.findIndex((h) => h.includes("description") || h.includes("memo") || h.includes("detail"));

            if (dateIdx === -1 || amountIdx === -1) throw new Error("CSV must have 'date' and 'amount' columns");

            const user = await auth.me();
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
                // Convert to cents using integer arithmetic (no floating point)
                const amountCents = Math.round(parseFloat(cols[amountIdx]) * 100);
                if (isNaN(amountCents)) continue;
                rows.push({
                    user_id: user.id,
                    transaction_date: cols[dateIdx],
                    posted_date: cols[dateIdx],
                    amount: Math.abs(amountCents) / 100, // Store as decimal in DB
                    description: descIdx >= 0 ? cols[descIdx] : "",
                    transaction_type: amountCents >= 0 ? "credit" : "debit",
                    teller_status: "posted",
                    source: "csv_upload",
                    is_reconciled: false,
                });
            }

            if (rows.length === 0) throw new Error("No valid transactions found in CSV");

            const { error } = await supabase
                .from('bank_transactions')
                .insert(rows);

            if (error) throw new Error(`Failed to import: ${error.message}`);
            toast.success(`Imported ${rows.length} transactions from CSV`);
            invalidate();
        } catch (err) {
            toast.error(err?.message || "Failed to import CSV");
        } finally {
            setCsvUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Loading skeleton
    if (isLoadingProp) {
        return (
            <GlassCard className="p-6">
                <div className="animate-pulse space-y-3">
                    <div className="h-5 w-48 rounded bg-gray-100" />
                    <div className="h-4 w-72 rounded bg-gray-50" />
                    <div className="h-9 w-36 rounded bg-gray-100" />
                </div>
            </GlassCard>
        );
    }

    const isConnected = connection && connection.status !== "disconnected";
    const needsReauth = connection?.status === "reauth_required";

    // ── Not Connected ────────────────────────────────────────────────
    if (!isConnected) {
        return (
            <GlassCard className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                            <Landmark className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Connect your bank account</h2>
                            <p className="mt-1 text-xs text-gray-500 max-w-lg leading-relaxed">
                                Link your real bank transactions via Teller to automatically reconcile
                                platform payouts against posted deposits. Read-only, no payments.
                            </p>
                            <HowItWorks />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <Button
                            type="button"
                            onClick={handleConnectBank}
                            disabled={tellerLoading}
                            className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium"
                        >
                            {tellerLoading ? (
                                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Connecting</>
                            ) : (
                                <><Landmark className="mr-1.5 h-3.5 w-3.5" /> Connect Bank</>
                            )}
                        </Button>
                        <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            <Upload className="h-3.5 w-3.5" />
                            Upload CSV instead
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleCsvUpload}
                                disabled={csvUploading}
                            />
                        </label>
                    </div>
                </div>
            </GlassCard>
        );
    }

    // ── Connected / Reauth Required ──────────────────────────────────
    return (
        <GlassCard className="p-6">
            {needsReauth && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Bank connection needs to be renewed</p>
                        <p className="mt-0.5 text-xs text-amber-600">
                            {connection.error_message || "Your bank requires re-authentication. Click Reconnect to restore access."}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                        <div className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${needsReauth ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                        <Landmark className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-gray-900">{connection.institution_name}</h2>
                            <StatusBadge status={connection.status} />
                        </div>
                        {connection.last_synced_at && (
                            <p className="mt-1 text-xs text-gray-400">
                                Last synced {format(new Date(connection.last_synced_at), "MMM d, yyyy h:mm a")}
                            </p>
                        )}
                        {/* Account list */}
                        {accounts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {accounts.map((acct) => (
                                    <span
                                        key={acct.id}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-600"
                                    >
                                        {acct.name}
                                        {acct.last_four && <span className="font-mono-financial text-gray-400">****{acct.last_four}</span>}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {needsReauth ? (
                        <Button
                            type="button"
                            onClick={handleConnectBank}
                            disabled={tellerLoading}
                            className="h-8 bg-amber-600 text-white hover:bg-amber-700 text-xs font-medium"
                        >
                            {tellerLoading ? (
                                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Reconnecting</>
                            ) : (
                                <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reconnect</>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={syncing}
                            onClick={handleSync}
                            className="h-8 border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            {syncing ? (
                                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Syncing</>
                            ) : (
                                <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync</>
                            )}
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDisconnectOpen(true)}
                        className="h-8 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"
                    >
                        <Unplug className="mr-1.5 h-3.5 w-3.5" /> Disconnect
                    </Button>
                </div>
            </div>

            {/* Manual upload fallback */}
            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Upload CSV manually
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCsvUpload}
                        disabled={csvUploading}
                    />
                </label>
                {csvUploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
            </div>

            {/* Disconnect confirmation */}
            <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
                <DialogContent className="max-w-sm rounded-xl border border-gray-200 bg-white text-gray-900">
                    <DialogHeader>
                        <DialogTitle>Disconnect {connection.institution_name}?</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Your synced bank transactions will be preserved for reconciliation history. You can reconnect anytime.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDisconnectOpen(false)}
                            className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="h-9 bg-red-600 text-white hover:bg-red-700"
                        >
                            {disconnecting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disconnecting</>
                            ) : "Disconnect"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </GlassCard>
    );
}
