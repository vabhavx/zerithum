import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, AlertCircle, Video, CreditCard, Globe, ShoppingBag, Database, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const MethodologyAnimations = ({ type }) => {
    if (type === 'matching') return <MatchingFlowAnimationV2 />;
    if (type === 'scoring') return <ScoringRulesAnimationV2 />;
    if (type === 'audit') return <AuditTrailAnimationV2 />;
    return null;
};

// --- Animation 1: Matching Flow V2 (Quantum Matcher) ---
const MatchingFlowAnimationV2 = () => {
    const [matches, setMatches] = useState([]);
    const shouldReduceMotion = useReducedMotion();

    // Simulating a stream of transactions
    useEffect(() => {
        if (shouldReduceMotion) {
            setMatches([
                { id: 1, platform: 'YouTube', amount: '$1,200.00', bankAmount: '$1,200.00', status: 'match', icon: Video },
                { id: 2, platform: 'Patreon', amount: '$450.00', bankAmount: '$448.00', status: 'review', icon: Globe },
                { id: 3, platform: 'Stripe', amount: '$89.00', bankAmount: '$89.00', status: 'match', icon: CreditCard },
            ]);
            return;
        }

        let idCounter = 0;
        const interval = setInterval(() => {
            idCounter++;
            const newMatch = {
                id: idCounter,
                platform: ['YouTube', 'Patreon', 'Stripe', 'Gumroad'][idCounter % 4],
                amount: ['$1,200.00', '$450.00', '$89.00', '$2,400.00'][idCounter % 4],
                bankAmount: ['$1,200.00', '$448.00', '$89.00', '$2,380.00'][idCounter % 4],
                status: idCounter % 4 === 1 || idCounter % 4 === 3 ? 'review' : 'match', // Some mismatches
                icon: [Video, Globe, CreditCard, ShoppingBag][idCounter % 4],
            };

            setMatches(prev => [newMatch, ...prev].slice(0, 5));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-zinc-950/50 flex flex-col items-center justify-center relative overflow-hidden border border-zinc-800 rounded-xl">
             {/* Header */}
            <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Reconciliation Engine</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-600">v2.4.0</div>
            </div>

            {/* Central Beam */}
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-zinc-800 via-emerald-500/20 to-zinc-800 -translate-x-1/2 z-0"></div>

            <div className="w-full max-w-lg space-y-2 relative z-10 px-4 mt-8">
                <AnimatePresence mode='popLayout'>
                    {matches.map((match) => (
                        <motion.div
                            key={match.id}
                            layout
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative"
                        >
                            {/* Connector Line */}
                            {match.status === 'match' && (
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-[2px] bg-emerald-500/50 z-0"
                                />
                            )}
                             {match.status === 'review' && (
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-[1px] border-t border-dashed border-yellow-500/50 z-0"
                                />
                            )}

                            <div className="flex items-center justify-between gap-8">
                                {/* Left: Platform */}
                                <div className="flex-1 flex justify-end">
                                    <div className={cn(
                                        "bg-zinc-900 border text-xs px-3 py-2 rounded-md flex items-center gap-3 w-40 justify-between shadow-sm relative overflow-hidden",
                                        match.status === 'match' ? "border-zinc-800" : "border-yellow-900/20"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <match.icon className="w-3 h-3 text-zinc-400" />
                                            <span className="text-zinc-300 font-medium">{match.platform}</span>
                                        </div>
                                        <span className="font-mono text-zinc-500">{match.amount}</span>
                                        {match.status === 'match' && (
                                             <motion.div
                                                initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1, ease: "linear" }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
                                             />
                                        )}
                                    </div>
                                </div>

                                {/* Center: Status Icon */}
                                <div className="relative z-10">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center border bg-zinc-950",
                                        match.status === 'match' ? "border-emerald-500/30 text-emerald-500" : "border-yellow-500/30 text-yellow-500"
                                    )}>
                                        {match.status === 'match' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    </div>
                                </div>

                                {/* Right: Bank */}
                                <div className="flex-1 flex justify-start">
                                    <div className={cn(
                                        "bg-zinc-900 border text-xs px-3 py-2 rounded-md flex items-center gap-3 w-40 justify-between shadow-sm",
                                        match.status === 'match' ? "border-zinc-800" : "border-yellow-900/20"
                                    )}>
                                         <span className="font-mono text-zinc-500">{match.bankAmount}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-300 font-medium">Bank</span>
                                            <Database className="w-3 h-3 text-zinc-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
             {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-20"></div>
        </div>
    );
};

// --- Animation 2: Scoring Rules V2 (Precision Scale) ---
const ScoringRulesAnimationV2 = () => {
    const [state, setState] = useState('scanning'); // scanning, locked
    const [score, setScore] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    // Cycle through examples
    useEffect(() => {
        if (shouldReduceMotion) {
            setState('locked');
            setScore(99.8);
            return;
        }

        const cycle = async () => {
            while (true) {
                // Phase 1: Reset
                setState('reset');
                setScore(0);
                await new Promise(r => setTimeout(r, 500));

                // Phase 2: Scanning (Ramping up)
                setState('scanning');
                const target = 99.8;
                const duration = 1000;
                const start = Date.now();

                while (Date.now() - start < duration) {
                    const progress = (Date.now() - start) / duration;
                    setScore(Math.floor(progress * target * 10) / 10);
                    await new Promise(r => requestAnimationFrame(r));
                }

                // Phase 3: Locked
                setState('locked');
                setScore(target);
                await new Promise(r => setTimeout(r, 2000));
            }
        };
        cycle();
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
             {/* Header */}
             <div className="absolute top-4 left-6 text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Confidence Engine
            </div>

            {/* Radar UI */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Rings */}
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
                        className={cn(
                            "absolute rounded-full border border-dashed",
                            i === 1 ? "w-full h-full border-zinc-800" :
                            i === 2 ? "w-48 h-48 border-zinc-800/50" :
                            "w-32 h-32 border-zinc-800/30"
                        )}
                    />
                ))}

                {/* Center Content */}
                <div className="flex flex-col items-center relative z-10">
                    <motion.div
                        key={state}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-mono font-bold text-white tracking-tighter"
                    >
                        {score.toFixed(1)}<span className="text-xl text-zinc-600">%</span>
                    </motion.div>

                    <div className="mt-2 flex flex-col items-center gap-1">
                        <AnimatePresence mode='wait'>
                            {state === 'locked' && (
                                <motion.div
                                    initial={{ y: 5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -5, opacity: 0 }}
                                    className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
                                >
                                    Match Verified
                                </motion.div>
                            )}
                            {state === 'scanning' && (
                                <motion.div
                                    initial={{ y: 5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -5, opacity: 0 }}
                                    className="text-zinc-500 text-xs font-mono animate-pulse"
                                >
                                    Calculating...
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Floating Indicators */}
                <motion.div
                    animate={{ x: [0, 10, 0], opacity: state === 'locked' ? 1 : 0.3 }}
                    className="absolute -right-12 top-10 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-mono text-zinc-400"
                >
                    Δ Date: 0ms
                </motion.div>
                <motion.div
                    animate={{ x: [0, -10, 0], opacity: state === 'locked' ? 1 : 0.3 }}
                    className="absolute -left-12 bottom-10 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-mono text-zinc-400"
                >
                    Δ Amt: 0.00
                </motion.div>
            </div>
        </div>
    );
};

// --- Animation 3: Audit Trail V2 (Immutable Ledger) ---
const AuditTrailAnimationV2 = () => {
    const [rows, setRows] = useState([]);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (shouldReduceMotion) {
            setRows([
                { id: 1, hash: '8a7b9c2d3e4f', platform: 'YouTube', amount: '1,200.00', status: 'sealed' },
                { id: 2, hash: '1a2b3c4d5e6f', platform: 'Patreon', amount: '450.00', status: 'sealed' },
                { id: 3, hash: '9z8y7x6w5v4u', platform: 'Stripe', amount: '89.00', status: 'sealed' },
            ]);
            return;
        }

        let counter = 0;
        const platforms = ['YouTube', 'Patreon', 'Stripe', 'Gumroad', 'Twitch'];

        const addRow = () => {
            counter++;
            const newRow = {
                id: counter,
                hash: Math.random().toString(36).substring(2, 15),
                platform: platforms[counter % platforms.length],
                amount: (Math.random() * 1000).toFixed(2),
                timestamp: new Date().toLocaleTimeString(),
                status: 'pending' // pending -> sealed
            };

            setRows(prev => [newRow, ...prev].slice(0, 6));

            // Seal it after a delay
            setTimeout(() => {
                setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, status: 'sealed' } : r));
            }, 800);
        };

        const interval = setInterval(addRow, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full p-6 bg-zinc-950/50 flex flex-col border border-zinc-800 rounded-xl overflow-hidden relative">
             <div className="flex items-center justify-between mb-4 z-10">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3 h-3" /> Immutable Ledger
                </div>
                <div className="flex gap-2 items-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] text-zinc-500 font-mono">BLOCK_HEIGHT: {992811 + rows.length}</span>
                </div>
            </div>

            <div className="w-full rounded-lg overflow-hidden bg-zinc-900 shadow-sm flex-1 flex flex-col z-10 border border-zinc-800">
                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                    <div className="col-span-1">Hash</div>
                    <div className="col-span-1">Platform</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-1 text-right">State</div>
                </div>

                <div className="bg-zinc-900/50 relative flex-1">
                    <AnimatePresence mode='popLayout'>
                        {rows.map((row) => (
                            <motion.div
                                key={row.id}
                                layout
                                initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                    filter: { duration: 0.3 } // prevent negative blur
                                }}
                                className={cn(
                                    "grid grid-cols-4 gap-4 px-4 py-3 text-[11px] font-mono items-center border-b border-zinc-800/50",
                                    row.status === 'sealed' ? "bg-emerald-500/5" : "bg-transparent"
                                )}
                            >
                                <div className="col-span-1 flex items-center gap-2 truncate text-zinc-600">
                                    {row.status === 'sealed' ? <Shield className="w-3 h-3 text-emerald-500 shrink-0" /> : <div className="w-3 h-3 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin shrink-0" />}
                                    <span className="truncate">{row.hash}</span>
                                </div>
                                <div className="col-span-1 text-zinc-300 truncate">{row.platform}</div>
                                <div className="col-span-1 text-right text-zinc-400 font-mono">${row.amount}</div>
                                <div className="col-span-1 text-right flex justify-end">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-[2px] border text-[9px] font-bold uppercase transition-colors duration-500",
                                        row.status === 'sealed' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/10" : "border-zinc-700 text-zinc-500 bg-zinc-800"
                                    )}>
                                        {row.status === 'sealed' ? 'VERIFIED' : 'HASHING'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        </div>
    );
};

export default MethodologyAnimations;
