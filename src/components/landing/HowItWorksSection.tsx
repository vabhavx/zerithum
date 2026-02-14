import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    ShieldCheck,
    Youtube,
    CreditCard,
    DollarSign,
    Zap,
    ArrowRightLeft,
    CheckCircle2,
    Building2,
    Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Simulation Data ---
// We need pairs that match, and some noise that doesn't immediately.
const TX_PAIRS = [
    {
        id: 'tx_1',
        platform: { name: 'YouTube', amount: 8432.10, icon: Youtube, color: 'text-red-500' },
        bank: { name: 'Chase Deposit', amount: 8432.10, date: 'Mar 12' }
    },
    {
        id: 'tx_2',
        platform: { name: 'Stripe', amount: 1250.00, icon: CreditCard, color: 'text-indigo-500' },
        bank: { name: 'Stripe Payout', amount: 1220.50, date: 'Mar 13' } // Fee deduction scenario
    },
    {
        id: 'tx_3',
        platform: { name: 'Patreon', amount: 3890.55, icon: DollarSign, color: 'text-orange-500' },
        bank: { name: 'Patreon Irel...', amount: 3890.55, date: 'Mar 14' }
    },
    {
        id: 'tx_4',
        platform: { name: 'Gumroad', amount: 420.69, icon: Zap, color: 'text-pink-500' },
        bank: { name: 'Gumroad Inc', amount: 420.69, date: 'Mar 15' }
    },
];

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-32 bg-black relative overflow-hidden" aria-label="How Zerithum Works">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-6">
                        <ArrowRightLeft className="w-3 h-3 text-emerald-500" />
                        Neural Reconciliation
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 tracking-tight">
                        We connect the disconnect.
                    </h2>
                    <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto">
                        Your platforms say one thing. Your bank says another. <br className="hidden md:block" />
                        We identify the truth in between.
                    </p>
                </div>

                {/* The Neural Matcher Widget */}
                <NeuralMatcherWidget />
            </div>
        </section>
    );
};

const NeuralMatcherWidget = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    // Auto-cycle logic
    useEffect(() => {
        if (isHovering) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % TX_PAIRS.length);
        }, 3000); // 3 seconds per "Story"

        return () => clearInterval(interval);
    }, [isHovering]);

    const activePair = TX_PAIRS[activeIndex];

    return (
        <div
            className="max-w-5xl mx-auto min-h-[500px] relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 select-none"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* --- LEFT: PLATFORM SIGNAL --- */}
            <div className="relative w-full md:w-80 h-40 md:h-auto flex flex-col items-center md:items-end justify-center">
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4 md:mb-8 text-right w-full">Platform Signal</div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={`plat-${activePair.id}`}
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9, filter: "blur(4px)" }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full shadow-2xl relative group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg bg-zinc-950 border border-zinc-800", activePair.platform.color)}>
                                    <activePair.platform.icon className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-200 font-medium">{activePair.platform.name}</span>
                            </div>
                            <Wifi className="w-4 h-4 text-zinc-600 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-zinc-500 font-mono">REPORTED EARNINGS</div>
                            <div className="text-2xl text-white font-bold tracking-tight">
                                ${activePair.platform.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        {/* Connector Node */}
                        <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-zinc-700 rounded-full border-2 border-black hidden md:block" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* --- CENTER: THE NEURAL CORE (Matching Logic) --- */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full md:w-auto h-32 md:h-64">
                {/* Visual Connector Line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[2px] bg-gradient-to-r from-zinc-800 via-emerald-500/50 to-zinc-800 md:w-64 md:h-[2px] hidden md:block" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[2px] bg-gradient-to-b from-zinc-800 via-emerald-500/50 to-zinc-800 md:hidden" />

                <motion.div
                    key={`core-${activePair.id}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black border border-emerald-500/30 p-1 rounded-full relative shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                >
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                        <Activity className="w-6 h-6 text-emerald-500" />
                    </div>

                    {/* Floating Status Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 24 }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono px-3 py-1 rounded-full backdrop-blur-md"
                    >
                        MATCH CONFIRMED
                    </motion.div>
                </motion.div>
            </div>

            {/* --- RIGHT: BANK TRUTH --- */}
            <div className="relative w-full md:w-80 h-40 md:h-auto flex flex-col items-center md:items-start justify-center">
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4 md:mb-8 text-left w-full">Bank Feed</div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={`bank-${activePair.id}`}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9, filter: "blur(4px)" }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full shadow-2xl relative"
                    >
                         {/* Connector Node */}
                         <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-zinc-700 rounded-full border-2 border-black hidden md:block" />

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-200 font-medium">{activePair.bank.name}</span>
                            </div>
                            <span className="text-xs font-mono text-zinc-500">{activePair.bank.date}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-zinc-500 font-mono">ACTUAL DEPOSIT</div>
                            <div className="text-2xl text-emerald-400 font-bold tracking-tight">
                                ${activePair.bank.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* --- BOTTOM: RESULT LOG (Appears after match) --- */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 md:bottom-auto md:top-[calc(100%+2rem)] w-full max-w-lg">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={`log-${activePair.id}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm mx-auto w-fit"
                    >
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-zinc-400 font-mono">
                            Reconciled <span className="text-white">{activePair.platform.name}</span> to <span className="text-white">Bank</span> • Confidence <span className="text-emerald-400">99.9%</span>
                        </span>
                    </motion.div>
                 </AnimatePresence>
            </div>

        </div>
    );
};

export default HowItWorksSection;
