import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    Wifi,
    Server,
    ShieldCheck,
    Database,
    Activity,
    Layers,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Simulation Data ---
const MOCK_DATA = Array.from({ length: 8 }).map((_, i) => ({
    id: `tx_${2990 + i}`,
    source: i % 3 === 0 ? 'STRIPE' : i % 2 === 0 ? 'YOUTUBE' : 'PATREON',
    amount: (Math.random() * 1000 + 50).toFixed(2),
    timestamp: `10:42:${(10 + i).toString().padStart(2, '0')}.442`,
    bankRef: `CH_WIRE_${8829 + i}`,
    latency: `${Math.floor(Math.random() * 40) + 10}ms`,
}));

// --- Steps Data ---
const STEPS = [
    {
        id: 'step_1',
        title: '01 Connect platforms',
        description: 'Zerithum ingests transaction metadata from platform APIs. We support 20+ integrations including YouTube, Stripe, and Patreon.',
        phase: 'ingesting'
    },
    {
        id: 'step_2',
        title: '02 Connect bank feed',
        description: 'Read-only access via Plaid. We never store bank credentials and cannot initiate transactions. Manual statement upload is also supported.',
        phase: 'scanning'
    },
    {
        id: 'step_3',
        title: '03 Reconcile & Export',
        description: 'Zerithum reconciles payouts, flags anomalies for review, and writes an immutable audit trail. Generate tax-ready reports in one click.',
        phase: 'complete'
    }
];

const HowItWorksSection = () => {
    const [activePhase, setActivePhase] = useState<'idle' | 'ingesting' | 'scanning' | 'complete'>('idle');

    return (
        <section id="how-it-works" className="py-24 bg-[#020204] relative overflow-hidden" aria-label="How Zerithum Works">
            {/* Dark Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">

                {/* Header */}
                <div className="mb-16 md:text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-950/30 border border-emerald-900/50 text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-6">
                        <Cpu className="w-3 h-3" />
                        System Architecture
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight font-sans">
                        High-frequency reconciliation.
                    </h2>
                    <p className="text-lg text-zinc-500 font-light">
                        A real-time engine that ingests platform signals, locks them to bank data, and commits the truth to your ledger. Zero manual drift.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">

                    {/* LEFT COLUMN: Explanatory Steps */}
                    <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32">
                        {STEPS.map((step) => {
                            const isActive = activePhase === step.phase || (activePhase === 'complete' && step.phase === 'scanning'); // Keep logic simple
                            // Better logic:
                            // Ingesting -> Step 1 active
                            // Scanning -> Step 2 active
                            // Complete -> Step 3 active

                            const isCurrent = activePhase === step.phase;
                            const isPast = (activePhase === 'scanning' && step.phase === 'ingesting') ||
                                           (activePhase === 'complete' && (step.phase === 'ingesting' || step.phase === 'scanning'));

                            return (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "relative pl-6 transition-all duration-500 border-l-2",
                                        isCurrent ? "border-emerald-500" : isPast ? "border-zinc-800" : "border-zinc-900"
                                    )}
                                >
                                    <h3 className={cn(
                                        "text-lg font-bold mb-2 transition-colors duration-300",
                                        isCurrent ? "text-white" : isPast ? "text-zinc-400" : "text-zinc-600"
                                    )}>
                                        {step.title}
                                    </h3>
                                    <p className={cn(
                                        "text-sm leading-relaxed transition-colors duration-300",
                                        isCurrent ? "text-zinc-400" : "text-zinc-700"
                                    )}>
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT COLUMN: The Quantum Ledger Widget */}
                    <div className="lg:col-span-8">
                        <QuantumLedgerWidget onStateChange={setActivePhase} />
                    </div>

                </div>
            </div>
        </section>
    );
};

const QuantumLedgerWidget = ({ onStateChange }: { onStateChange: (state: any) => void }) => {
    const [rows, setRows] = useState<any[]>([]);
    const [scanPosition, setScanPosition] = useState(0);
    const [processedCount, setProcessedCount] = useState(14280);
    const [activeState, setActiveState] = useState<'idle' | 'ingesting' | 'scanning' | 'complete'>('idle');

    // Sync state with parent
    useEffect(() => {
        onStateChange(activeState);
    }, [activeState, onStateChange]);

    // Main Loop
    useEffect(() => {
        let mounted = true;

        const runCycle = async () => {
            if (!mounted) return;

            // 1. Reset / Idle
            setActiveState('idle');
            setRows([]);
            setScanPosition(0);
            await new Promise(r => setTimeout(r, 500));
            if (!mounted) return;

            // 2. Ingest (Fast Fill) -> Step 1 Active
            setActiveState('ingesting');
            const newRows = MOCK_DATA.map(d => ({ ...d, status: 'pending' }));

            // Staggered row entry
            for (let i = 0; i < newRows.length; i++) {
                setRows(prev => [...prev, newRows[i]]);
                await new Promise(r => setTimeout(r, 50)); // Very fast ingest
            }
            if (!mounted) return;

            await new Promise(r => setTimeout(r, 800)); // Pause to read Step 1

            // 3. Scan (Verification Beam) -> Step 2 Active
            setActiveState('scanning');
            // Animate scan position from 0 to 100% over 2.0s
            const scanDuration = 2000;
            const steps = 40;
            const stepTime = scanDuration / steps;

            for (let i = 0; i <= steps; i++) {
                const progress = i / steps;
                setScanPosition(progress * 100);

                const rowsToVerify = Math.floor(progress * newRows.length);
                setRows(prev => prev.map((row, idx) =>
                    idx < rowsToVerify ? { ...row, status: 'verified' } : row
                ));

                if (i % 5 === 0) setProcessedCount(prev => prev + 1);

                await new Promise(r => setTimeout(r, stepTime));
                if (!mounted) return;
            }

            // 4. Complete -> Step 3 Active
            setActiveState('complete');
            await new Promise(r => setTimeout(r, 3000)); // Hold result longer to read Step 3

            // Loop
            runCycle();
        };

        runCycle();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="w-full bg-[#050505] border border-zinc-800 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] font-mono text-sm relative">
            {/* Top Bar */}
            <div className="h-10 bg-[#0a0a0c] border-b border-zinc-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5 text-emerald-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>LIVE_FEED</span>
                    </div>
                    <span className="hidden md:inline">REGION: US_EAST_1</span>
                    <span className="hidden md:inline">LATENCY: 12ms</span>
                </div>
                <div className="text-xs text-zinc-600">
                    PROCESSED_EVENTS: <span className="text-zinc-300">{processedCount.toLocaleString()}</span>
                </div>
            </div>

            {/* Main Grid Area */}
            <div className="relative min-h-[400px] bg-[#050505]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-900 text-[10px] text-zinc-600 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-2 hidden sm:block">Timestamp</div>
                    <div className="col-span-3 sm:col-span-2">Source</div>
                    <div className="col-span-3 sm:col-span-2 text-right">Amount</div>
                    <div className="col-span-3 pl-4 hidden sm:block">Bank Ref</div>
                    <div className="col-span-5 sm:col-span-2 text-right">Status</div>
                </div>

                {/* Rows */}
                <div className="relative">
                    {rows.map((row, idx) => (
                        <div
                            key={row.id}
                            className={cn(
                                "grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-900/50 items-center transition-colors duration-200",
                                row.status === 'verified' ? "bg-emerald-950/5 text-emerald-100" : "text-zinc-400"
                            )}
                        >
                            <div className="col-span-1 text-zinc-600 text-[10px]">{idx + 1}</div>
                            <div className="col-span-2 text-[11px] hidden sm:block">{row.timestamp}</div>
                            <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    row.source === 'STRIPE' ? 'bg-indigo-500' :
                                    row.source === 'YOUTUBE' ? 'bg-red-500' : 'bg-orange-500'
                                )} />
                                <span className="text-[11px] font-bold">{row.source}</span>
                            </div>
                            <div className="col-span-3 sm:col-span-2 text-right font-medium">${row.amount}</div>
                            <div className="col-span-3 pl-4 text-[11px] text-zinc-500 hidden sm:flex items-center gap-2">
                                {row.status === 'verified' ? (
                                    <>
                                        <Database className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <span className="text-zinc-400 truncate">{row.bankRef}</span>
                                    </>
                                ) : (
                                    <span className="opacity-20">PENDING</span>
                                )}
                            </div>
                            <div className="col-span-5 sm:col-span-2 text-right">
                                {row.status === 'verified' ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] border border-emerald-500/30 tracking-wide">
                                        MATCHED
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-zinc-600 animate-pulse">Scanning...</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* The "Verification Beam" (Visual Scanner) */}
                {activeState === 'scanning' && (
                    <motion.div
                        className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20 pointer-events-none"
                        style={{ top: `${scanPosition}%` }}
                    >
                        <div className="absolute right-0 -top-2 bg-emerald-500 text-black text-[9px] px-1 font-bold">SCANNING</div>
                    </motion.div>
                )}

                {/* Empty State / Loading */}
                {activeState === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-zinc-700">
                            <Activity className="w-6 h-6 animate-pulse" />
                            <span className="text-xs tracking-widest">INITIALIZING STREAM...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="h-8 bg-[#0a0a0c] border-t border-zinc-800 flex items-center px-4 gap-6 text-[10px] text-zinc-600 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <Server className="w-3 h-3" />
                    <span className="hidden sm:inline">System Status:</span> <span className="text-emerald-500">Normal</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Verification:</span> <span className="text-zinc-300">Strict</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Connected</span>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksSection;
