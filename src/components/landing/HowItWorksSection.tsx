import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Terminal,
    Zap,
    CreditCard,
    DollarSign,
    Youtube,
    Server,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Data ---
const STREAM_ITEMS = [
    { id: 'tx_881', source: 'YouTube', amount: '$8,432.10', icon: Youtube, color: 'text-red-500' },
    { id: 'tx_882', source: 'Stripe', amount: '$1,250.00', icon: CreditCard, color: 'text-indigo-500' },
    { id: 'tx_883', source: 'Patreon', amount: '$3,890.55', icon: DollarSign, color: 'text-orange-500' },
    { id: 'tx_884', source: 'Gumroad', amount: '$420.69', icon: DollarSign, color: 'text-pink-500' },
];

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-24 bg-zinc-950 relative overflow-hidden" aria-label="How Zerithum Works">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
                        Revenue, reality checked.
                    </h2>
                    <p className="text-xl text-zinc-400 font-light">
                        High-frequency reconciliation. We match platform signals to bank truths in milliseconds.
                    </p>
                </div>

                {/* Pipeline Widget */}
                <PipelineWidget />

            </div>
        </section>
    );
};

const PipelineWidget = () => {
    const [activeItem, setActiveItem] = useState<typeof STREAM_ITEMS[0] | null>(null);
    const [processedList, setProcessedList] = useState<typeof STREAM_ITEMS>([]);
    const [phase, setPhase] = useState<'idle' | 'ingest' | 'scan' | 'match' | 'verify'>('idle');

    // Continuous Animation Loop
    useEffect(() => {
        let currentIndex = 0;
        let mounted = true;

        const runSequence = async () => {
            if (!mounted) return;

            // Reset if we've done all items
            if (currentIndex >= STREAM_ITEMS.length) {
                // Wait a bit, then clear list and restart
                await new Promise(r => setTimeout(r, 2000));
                if (!mounted) return;
                setProcessedList([]);
                currentIndex = 0;
            }

            const item = STREAM_ITEMS[currentIndex];
            setActiveItem(item);

            // Phase 1: Ingest (Appear on left/top)
            setPhase('ingest');
            await new Promise(r => setTimeout(r, 500));
            if (!mounted) return;

            // Phase 2: Scan (Move to center)
            setPhase('scan');
            await new Promise(r => setTimeout(r, 600));
            if (!mounted) return;

            // Phase 3: Match (Flash Green)
            setPhase('match');
            await new Promise(r => setTimeout(r, 400));
            if (!mounted) return;

            // Phase 4: Verify (Move to right/bottom list)
            setPhase('verify');
            setProcessedList(prev => [...prev, item]);
            await new Promise(r => setTimeout(r, 400)); // Time for exit animation
            if (!mounted) return;

            setActiveItem(null);
            currentIndex++;

            // Short pause between items
            await new Promise(r => setTimeout(r, 200));

            // Recursive call for next item
            runSequence();
        };

        runSequence();

        return () => { mounted = false; };
    }, []);

    return (
        <div className="max-w-5xl mx-auto bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="h-10 bg-[#0c0c0e] border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="text-zinc-500 tracking-widest text-[10px] font-medium flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    ZERITHUM_PIPELINE_V4
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                    STATUS: <span className="text-emerald-500">ACTIVE_LOOP</span>
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative h-auto md:h-[320px] bg-[#0a0a0b] flex flex-col md:flex-row items-center justify-between p-8 md:p-8 overflow-hidden gap-12 md:gap-0">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

                {/* ZONE 1: INGESTION */}
                <div className="w-full md:w-1/3 h-auto md:h-full flex flex-col items-center relative z-10 border-b md:border-b-0 md:border-r border-dashed border-zinc-800/50 pb-8 md:pb-0">
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-2">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>
                        <h3 className="text-zinc-300 text-xs font-bold uppercase tracking-wider">1. Platform Signal</h3>
                    </div>

                    {/* Active Item - Ingest State */}
                    <AnimatePresence>
                        {phase === 'ingest' && activeItem && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg flex items-center gap-3 w-48 shadow-lg"
                            >
                                <activeItem.icon className={cn("w-5 h-5", activeItem.color)} />
                                <div>
                                    <div className="text-xs font-bold text-white">{activeItem.source}</div>
                                    <div className="text-[10px] font-mono text-zinc-500">Payload Rx</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ZONE 2: PROCESSING ENGINE */}
                <div className="w-full md:w-1/3 h-auto md:h-full flex flex-col items-center relative z-10">
                     <div className="mb-8 text-center">
                        <div className="flex justify-center mb-2">
                             <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <Server className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-zinc-300 text-xs font-bold uppercase tracking-wider">2. Reconciliation</h3>
                    </div>

                    {/* Scanner Visuals */}
                    <div className="relative w-64 h-24 flex items-center justify-center">
                         {/* Connection Lines (Desktop Horizontal, Mobile Vertical handled by stacking/spacing but nice to have visual) */}
                         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-800 -z-10 hidden md:block" />
                         {/* Vertical line for mobile */}
                         <div className="absolute -top-12 left-1/2 w-[1px] h-[calc(100%+6rem)] bg-zinc-800 -z-10 md:hidden" />

                         <AnimatePresence>
                            {(phase === 'scan' || phase === 'match') && activeItem && (
                                <motion.div
                                    layoutId="active-card"
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 50, opacity: 0 }}
                                    className={cn(
                                        "bg-zinc-900 border p-4 rounded-xl flex items-center gap-4 w-56 shadow-2xl relative overflow-hidden transition-colors duration-300",
                                        phase === 'match' ? "border-emerald-500 bg-emerald-950/20" : "border-zinc-700"
                                    )}
                                >
                                    {/* Scan Beam */}
                                    {phase === 'scan' && (
                                        <motion.div
                                            initial={{ left: "-100%" }}
                                            animate={{ left: "200%" }}
                                            transition={{ duration: 1, ease: "linear" }}
                                            className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent skew-x-12"
                                        />
                                    )}

                                    <div className={cn("w-8 h-8 rounded flex items-center justify-center bg-black/40", activeItem.color)}>
                                        <activeItem.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-mono text-zinc-400">AMOUNT</div>
                                        <div className="text-sm font-bold text-white">{activeItem.amount}</div>
                                    </div>

                                    {phase === 'match' && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-1 right-1"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                         </AnimatePresence>
                    </div>

                    {/* Status Text */}
                    <div className="h-6 mt-4 flex items-center justify-center">
                         {phase === 'scan' && <span className="text-[10px] font-mono text-blue-400 animate-pulse">SCANNING_BANK_FEED...</span>}
                         {phase === 'match' && <span className="text-[10px] font-mono text-emerald-400 font-bold">MATCH CONFIRMED</span>}
                    </div>
                </div>

                {/* ZONE 3: VERIFIED LEDGER */}
                <div className="w-full md:w-1/3 h-auto md:h-full flex flex-col items-center relative z-10 border-t md:border-t-0 md:border-l border-dashed border-zinc-800/50 pt-8 md:pt-0">
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-2">
                             <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <Database className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                        <h3 className="text-zinc-300 text-xs font-bold uppercase tracking-wider">3. Verified Ledger</h3>
                    </div>

                    <div className="w-full max-w-[240px] bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex-1 min-h-[140px] md:min-h-0 md:max-h-[180px]">
                         <div className="p-2 bg-zinc-900/50 border-b border-zinc-800 text-[9px] text-zinc-500 font-mono uppercase">Recent Transactions</div>
                         <div className="p-2 space-y-2 overflow-hidden">
                            <AnimatePresence initial={false} mode="popLayout">
                                {processedList.slice(-3).map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20, backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                                        animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }}
                                        transition={{ duration: 0.5 }}
                                        className="flex items-center justify-between p-2 rounded border border-zinc-800/50 bg-zinc-900/20"
                                    >
                                        <div className="flex items-center gap-2">
                                            <item.icon className="w-3 h-3 text-zinc-500" />
                                            <span className="text-[10px] text-zinc-300 font-mono">{item.amount}</span>
                                        </div>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {processedList.length === 0 && (
                                <div className="text-[10px] text-zinc-600 text-center py-4 italic">Waiting for verify...</div>
                            )}
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HowItWorksSection;
