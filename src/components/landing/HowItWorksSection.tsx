import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Terminal,
    Shield,
    Zap,
    Youtube,
    CreditCard,
    DollarSign,
    Search,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Data ---
const INCOMING_STREAM = [
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
    const [processedItems, setProcessedItems] = useState<typeof INCOMING_STREAM>([]);
    const [isReplaying, setIsReplaying] = useState(false);
    const [scanIndex, setScanIndex] = useState(-1);

    // Animation Loop
    useEffect(() => {
        if (isReplaying) return;

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex >= INCOMING_STREAM.length) {
                clearInterval(interval);
                return;
            }

            const index = currentIndex;
            setScanIndex(index);

            // Add to processed list after a brief "scan" delay
            setTimeout(() => {
                setProcessedItems(prev => [...prev, INCOMING_STREAM[index]]);
            }, 400); // 400ms scan time

            currentIndex++;
        }, 800); // New item every 800ms

        return () => clearInterval(interval);
    }, [isReplaying]);

    const handleReplay = () => {
        setIsReplaying(true);
        setProcessedItems([]);
        setScanIndex(-1);
        setTimeout(() => setIsReplaying(false), 500);
    };

    return (
        <div className="max-w-5xl mx-auto bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Window Header */}
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
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className={cn("w-2 h-2 rounded-full", processedItems.length === 4 ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                    {processedItems.length === 4 ? "SYNC COMPLETE" : "PROCESSING..."}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 h-[400px] divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-[#0a0a0b] relative">

                {/* --- LEFT: RAW SIGNALS --- */}
                <div className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Incoming Signals
                        </div>
                        <div className="font-mono text-[10px] text-zinc-600">BUFFER: {4 - processedItems.length}</div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <AnimatePresence>
                            {INCOMING_STREAM.map((item, i) => {
                                const isProcessed = processedItems.find(p => p.id === item.id);
                                const isScanning = scanIndex === i;

                                if (isProcessed) return null; // Remove from left once processed

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            scale: isScanning ? 1.05 : 1,
                                            borderColor: isScanning ? 'rgba(16, 185, 129, 0.5)' : 'rgba(39, 39, 42, 1)'
                                        }}
                                        exit={{ x: 100, opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded flex items-center justify-center bg-zinc-900 border border-zinc-800", item.color)}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-zinc-300">{item.source} Payload</div>
                                                <div className="text-[10px] font-mono text-zinc-600">{item.id}</div>
                                            </div>
                                        </div>
                                        <div className="font-mono text-zinc-400 text-xs">{item.amount}</div>

                                        {isScanning && (
                                            <motion.div
                                                layoutId="scanner"
                                                className="absolute inset-0 border-2 border-emerald-500/30 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                transition={{ duration: 0.2 }}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {processedItems.length === 4 && (
                            <div className="text-center py-12 text-zinc-600 text-xs font-mono animate-pulse">
                                // STREAM IDLE
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CENTER: SCANNER BEAM (Desktop Only) --- */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-zinc-800 hidden md:block z-20 overflow-visible">
                     <div className="absolute top-0 bottom-0 -left-[1px] w-[3px] bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent opacity-50" />
                </div>


                {/* --- RIGHT: VERIFIED LEDGER --- */}
                <div className="p-6 bg-zinc-900/10 relative">
                     <div className="flex justify-between items-center mb-6">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            Verified Ledger
                        </div>
                        <div className="font-mono text-[10px] text-zinc-600">HASH: SHA-256</div>
                    </div>

                    <div className="w-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-2 p-2 bg-zinc-900/50 border-b border-zinc-800 text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                            <div className="col-span-2">Origin</div>
                            <div className="text-right">Amount</div>
                            <div className="text-center">Status</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-zinc-800/50 min-h-[200px]">
                            <AnimatePresence mode="popLayout">
                                {processedItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: -10, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                                        animate={{ opacity: 1, y: 0, backgroundColor: "rgba(9, 9, 11, 0)" }}
                                        transition={{ duration: 0.5 }}
                                        className="grid grid-cols-4 gap-2 p-3 items-center group hover:bg-zinc-900/30 transition-colors"
                                    >
                                        <div className="col-span-2 flex items-center gap-2">
                                            <item.icon className={cn("w-3 h-3", item.color)} />
                                            <span className="text-xs text-zinc-300 font-medium">{item.source}</span>
                                        </div>
                                        <div className="text-right font-mono text-xs text-zinc-400">{item.amount}</div>
                                        <div className="flex justify-center">
                                            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] text-emerald-500 font-bold tracking-wider">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                MATCH
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {processedItems.length === 0 && (
                                <div className="p-8 text-center text-[10px] text-zinc-600 font-mono">
                                    WAITING_FOR_DATA...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bank Context Note */}
                    <div className="mt-4 flex items-start gap-2 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded text-[10px] text-zinc-500">
                        <Search className="w-3 h-3 mt-0.5 shrink-0" />
                        <p className="font-mono leading-relaxed">
                            <span className="text-zinc-400">Context:</span> Each matched row is cryptographically linked to a confirmed bank deposit trace ID.
                            <span className="text-emerald-500/80 ml-1">No anomalies detected.</span>
                        </p>
                    </div>

                </div>
            </div>

            {/* Replay Control */}
            {processedItems.length === 4 && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-30">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <Button
                            onClick={handleReplay}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs tracking-wider"
                        >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            RUN_SEQUENCE_AGAIN
                        </Button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default HowItWorksSection;
