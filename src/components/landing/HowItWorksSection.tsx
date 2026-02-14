import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    ShieldCheck,
    Youtube,
    CreditCard,
    DollarSign,
    Zap,
    Loader2,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Simulation Data ---
const TRANSACTIONS = [
    {
        id: 'tx_1',
        platform: 'YouTube',
        p_amount: '$8,432.10',
        p_date: 'Mar 12',
        bank: 'Chase',
        b_amount: '$8,432.10',
        b_date: 'Mar 12',
        status: 'matched',
        icon: Youtube,
        color: 'text-red-500'
    },
    {
        id: 'tx_2',
        platform: 'Stripe',
        p_amount: '$1,250.00',
        p_date: 'Mar 13',
        bank: 'Chase',
        b_amount: '$1,220.50',
        b_date: 'Mar 13',
        status: 'fee_adjusted', // $29.50 fee
        icon: CreditCard,
        color: 'text-indigo-500'
    },
    {
        id: 'tx_3',
        platform: 'Patreon',
        p_amount: '$3,890.55',
        p_date: 'Mar 14',
        bank: 'Chase',
        b_amount: '$3,890.55',
        b_date: 'Mar 15', // Date drift
        status: 'date_drift',
        icon: DollarSign,
        color: 'text-orange-500'
    },
];

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-32 bg-[#0a0a0b] relative overflow-hidden font-sans" aria-label="How Zerithum Works">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-6">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Live Ledger Construction
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
                        The source of truth.
                    </h2>
                    <p className="text-xl text-zinc-400 font-light">
                        We don't just guess. We build a definitive ledger by locking platform data to bank reality.
                    </p>
                </div>

                {/* The Living Ledger Widget */}
                <LivingLedgerWidget />
            </div>
        </section>
    );
};

const LivingLedgerWidget = () => {
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex >= TRANSACTIONS.length) {
                // Reset loop after a pause
                setTimeout(() => setRows([]), 2000);
                currentIndex = 0;
                return;
            }

            const tx = TRANSACTIONS[currentIndex];
            setRows(prev => [...prev, { ...tx, stage: 'ingest' }]);

            // Sequence: Ingest -> Bank Match -> Reconcile
            // We use timeouts to update the state of the *specific* row we just added

            // Step 1: Bank Match (Snap in)
            setTimeout(() => {
                setRows(prev => prev.map(r => r.id === tx.id ? { ...r, stage: 'match' } : r));
            }, 800);

            // Step 2: Reconcile (Green check)
            setTimeout(() => {
                setRows(prev => prev.map(r => r.id === tx.id ? { ...r, stage: 'verified' } : r));
            }, 1600);

            currentIndex++;
        }, 2000); // Add new row every 2s

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Toolbar / Header */}
            <div className="h-12 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
                    <span className="text-xs font-mono text-zinc-500">Zerithum Ledger v2.1</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                    <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Live Sync</span>
                </div>
            </div>

            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/20 text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                <div className="col-span-4">Platform Source</div>
                <div className="col-span-4">Bank Verification</div>
                <div className="col-span-2">Difference</div>
                <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Rows */}
            <div className="min-h-[400px] bg-[#050505] p-4 space-y-2">
                <AnimatePresence>
                    {rows.map((row) => (
                        <LedgerRow key={row.id} data={row} />
                    ))}
                    {rows.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex items-center justify-center pt-32"
                        >
                            <span className="text-zinc-700 text-sm font-mono animate-pulse">Waiting for transaction stream...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const LedgerRow = ({ data }: { data: any }) => {
    const isMatched = data.stage === 'match' || data.stage === 'verified';
    const isVerified = data.stage === 'verified';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative overflow-hidden rounded-lg border transition-colors duration-500",
                isVerified ? "bg-emerald-950/10 border-emerald-900/30" : "bg-zinc-900/40 border-zinc-800"
            )}
        >
            {/* Scanning Line Effect */}
            {isMatched && !isVerified && (
                <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '200%' }}
                    transition={{ duration: 0.8, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12 z-0 pointer-events-none"
                />
            )}

            <div className="grid md:grid-cols-12 gap-4 p-4 relative z-10 items-center">

                {/* 1. Platform Data */}
                <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                    <div className={cn("p-2 rounded-md bg-zinc-900 border border-zinc-800", data.color)}>
                        <data.icon className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-zinc-200">{data.platform}</div>
                        <div className="text-xs text-zinc-500 font-mono">{data.p_date} • {data.p_amount}</div>
                    </div>
                </div>

                {/* 2. Bank Data (Slides in) */}
                <div className="col-span-12 md:col-span-4 relative h-10 flex items-center">
                    <AnimatePresence>
                        {isMatched ? (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                    CH
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-300">{data.bank}</div>
                                    <div className="text-xs text-zinc-500 font-mono">{data.b_date} • {data.b_amount}</div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="h-2 w-24 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-2 w-12 bg-zinc-800 rounded animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. Logic / Difference */}
                <div className="col-span-6 md:col-span-2">
                    {isVerified && data.status === 'fee_adjusted' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-mono border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" /> Fee Detected
                        </span>
                    )}
                    {isVerified && data.status === 'date_drift' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-mono border border-blue-500/20">
                            <RefreshCw className="w-3 h-3" /> Date Drift
                        </span>
                    )}
                    {isVerified && data.status === 'matched' && (
                        <span className="text-xs text-zinc-600 font-mono">--</span>
                    )}
                </div>

                {/* 4. Status */}
                <div className="col-span-6 md:col-span-2 text-right">
                    {isVerified ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                        </motion.div>
                    ) : (
                        <span className="text-xs text-zinc-600 font-mono italic">Processing...</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default HowItWorksSection;
