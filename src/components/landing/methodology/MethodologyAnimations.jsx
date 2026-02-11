import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, AlertTriangle, AlertCircle, ArrowRight, Search, FileCheck, X, Video, CreditCard, Globe, ShoppingBag, Database, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const MethodologyAnimations = ({ type }) => {
    if (type === 'matching') return <MatchingFlowAnimation />;
    if (type === 'scoring') return <ScoringRulesAnimation />;
    if (type === 'audit') return <AuditTrailAnimation />;
    return null;
};

// --- Animation 1: Matching Flow ---
const MatchingFlowAnimation = () => {
    const [step, setStep] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (shouldReduceMotion) {
            setStep(3);
            return;
        }
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 5); // 0 to 4 (4 is reset/pause)
        }, 2500);
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    const items = [
        { id: 1, platform: 'YouTube', pAmount: '$1,800', bAmount: '$1,650', score: 0.85, status: 'review', reason: 'Fee deduction', icon: Video, color: 'text-red-500' },
        { id: 2, platform: 'Patreon', pAmount: '$1,200', bAmount: '$1,200', score: 0.99, status: 'auto', reason: 'Exact match', icon: Globe, color: 'text-orange-500' }, // Patreon usually orange/red
        { id: 3, platform: 'Stripe', pAmount: '$500', bAmount: '$480', score: 0.60, status: 'flagged', reason: 'Hold period', icon: CreditCard, color: 'text-indigo-500' },
        { id: 4, platform: 'Gumroad', pAmount: '$230', bAmount: '$230', score: 0.99, status: 'auto', reason: 'Exact match', icon: ShoppingBag, color: 'text-pink-500' },
    ];

    return (
        <div className="w-full h-full p-6 flex flex-col justify-center bg-zinc-950/50 relative overflow-hidden">
            <div className="absolute top-4 left-6 text-xs font-mono text-zinc-500 uppercase tracking-wider">Live Reconciliation Feed</div>

            <div className="grid grid-cols-3 gap-4 items-center relative z-10">
                {/* Platform Column */}
                <div className="space-y-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 pl-2">Platform Feed</div>
                    {items.map((item, idx) => (
                        <motion.div
                            key={`p-${item.id}`}
                            initial={{ opacity: 0.5, x: -10 }}
                            animate={{
                                opacity: step >= idx ? 1 : 0.3,
                                x: 0,
                                scale: step === idx ? 1.05 : 1,
                                borderColor: step === idx ? '#10b981' : '#27272a'
                            }}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border bg-zinc-900/80 transition-all",
                                step === idx ? "border-zinc-600 ring-1 ring-zinc-700" : "border-zinc-800"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4", item.color)} />
                                <span className="text-sm font-medium text-zinc-300">{item.platform}</span>
                            </div>
                            <span className="font-mono text-sm text-zinc-400">{item.pAmount}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Connection Lines (Visualized via Center Column) */}
                <div className="flex flex-col items-center justify-center space-y-4 h-full pt-6">
                     {items.map((item, idx) => (
                        <div key={`c-${item.id}`} className="h-[52px] w-full flex items-center justify-center relative">
                            {step >= idx && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="h-[2px] bg-zinc-800 absolute"
                                >
                                     {/* Center Badge */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className={cn(
                                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap z-20 shadow-sm",
                                            item.status === 'auto' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                            item.status === 'review' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                            "bg-red-500/10 border-red-500/20 text-red-400"
                                        )}
                                    >
                                        {item.score.toFixed(2)} • {item.reason}
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                     ))}
                </div>

                {/* Bank Column */}
                <div className="space-y-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 text-right pr-2">Bank Feed</div>
                    {items.map((item, idx) => (
                        <motion.div
                            key={`b-${item.id}`}
                            initial={{ opacity: 0.5, x: 10 }}
                            animate={{
                                opacity: step >= idx ? 1 : 0.3,
                                x: 0,
                                scale: step === idx ? 1.05 : 1
                            }}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border bg-zinc-900/80 transition-all",
                                step === idx ? "border-zinc-600 ring-1 ring-zinc-700" : "border-zinc-800"
                            )}
                        >
                            <span className="font-mono text-sm text-zinc-400">{item.bAmount}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-zinc-300">Deposit</span>
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <Database className="w-3 h-3 text-zinc-500" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Animation 2: Scoring Rules ---
const ScoringRulesAnimation = () => {
    const [sequence, setSequence] = useState(0); // 0: Start, 1: Check Amount, 2: Check Date, 3: Score, 4: Decision, 5: Audit, 6: Reset
    const [exampleIndex, setExampleIndex] = useState(0); // 0: Match, 1: Mismatch
    const shouldReduceMotion = useReducedMotion();

    const examples = [
        { platform: 'YouTube', pAmount: '$1,200', pDate: 'Jan 15', bAmount: '$1,200', bDate: 'Jan 15', score: 0.99, decision: 'Auto Reconciled', color: 'emerald', checks: { amount: true, date: true } },
        { platform: 'Patreon', pAmount: '$1,200', pDate: 'Jan 15', bAmount: '$1,150', bDate: 'Jan 16', score: 0.85, decision: 'Needs Review', color: 'yellow', checks: { amount: false, date: true } }
    ];

    const current = examples[exampleIndex];

    useEffect(() => {
        if (shouldReduceMotion) {
            setSequence(5);
            return;
        }
        const interval = setInterval(() => {
            setSequence(prev => {
                if (prev >= 6) {
                    setExampleIndex(i => (i + 1) % 2);
                    return 0;
                }
                return prev + 1;
            });
        }, 1200);
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/50">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                    <span className="text-xs font-mono text-zinc-500">CONFIDENCE_ENGINE_V2</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Inputs */}
                    <div className="flex justify-between items-end">
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Platform</div>
                            <div className="bg-zinc-800 px-3 py-2 rounded text-sm font-mono text-white">{current.pAmount}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{current.pDate}</div>
                        </div>
                        <div className="text-zinc-700 pb-4"><ArrowRight className="w-4 h-4" /></div>
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Bank</div>
                            <div className="bg-zinc-800 px-3 py-2 rounded text-sm font-mono text-white">{current.bAmount}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{current.bDate}</div>
                        </div>
                    </div>

                    {/* Checks */}
                    <div className="space-y-2">
                        <AnimatePresence>
                            {sequence >= 1 && (
                                <motion.div key="check-amount" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">Amount Check</span>
                                    {current.checks.amount ?
                                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Exact</span> :
                                        <span className="text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ~2% Var</span>
                                    }
                                </motion.div>
                            )}
                            {sequence >= 2 && (
                                <motion.div key="check-date" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">Date Check</span>
                                    {current.checks.date ?
                                        <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Match</span> :
                                        <span className="text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> +1 Day</span>
                                    }
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Score & Decision */}
                    <div className="pt-4 border-t border-zinc-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-zinc-500">CONFIDENCE SCORE</span>
                            {sequence >= 3 && (
                                <motion.span
                                    initial={{scale:0}} animate={{scale:1}}
                                    className={cn("text-xl font-mono font-bold", current.color === 'emerald' ? 'text-emerald-400' : 'text-yellow-400')}
                                >
                                    {current.score}
                                </motion.span>
                            )}
                        </div>
                        {sequence >= 4 && (
                            <motion.div
                                initial={{y:10, opacity:0}} animate={{y:0, opacity:1}}
                                className={cn(
                                    "w-full py-2 rounded text-center text-xs font-bold uppercase tracking-wider",
                                    current.color === 'emerald' ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                                )}
                            >
                                {current.decision}
                            </motion.div>
                        )}
                    </div>

                     {/* Audit Log Hint */}
                     {sequence >= 5 && (
                        <motion.div
                             initial={{opacity:0}} animate={{opacity:1}}
                             className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-zinc-600"
                        >
                            <Shield className="w-3 h-3" /> Logged
                        </motion.div>
                     )}
                </div>
            </div>
        </div>
    );
};

// --- Animation 3: Audit Trail ---
const AuditTrailAnimation = () => {
    const [rows, setRows] = useState([]);
    const shouldReduceMotion = useReducedMotion();

    // Data to stream
    const dataStream = [
        { id: 1, time: '14:08:22', platform: 'YouTube', debit: '$1,800', credit: '$1,650', conf: 0.85, status: 'Review' },
        { id: 2, time: '14:09:05', platform: 'Patreon', debit: '$1,200', credit: '$1,200', conf: 0.99, status: 'Auto' },
        { id: 3, time: '14:10:11', platform: 'Stripe', debit: '$500', credit: '$480', conf: 0.60, status: 'Flagged' },
        { id: 4, time: '14:11:45', platform: 'Gumroad', debit: '$230', credit: '$230', conf: 0.99, status: 'Auto' },
    ];

    useEffect(() => {
        if (shouldReduceMotion) {
            setRows(dataStream);
            return;
        }
        let index = 0;
        const interval = setInterval(() => {
            if (index < dataStream.length) {
                setRows(prev => [...prev, dataStream[index]]);
                index++;
            } else {
                // Reset to loop
                setRows([]);
                index = 0;
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    return (
        <div className="w-full h-full p-6 bg-zinc-950/50 flex flex-col">
             <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3 h-3" /> Immutable Ledger
                </div>
                <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] text-zinc-600">LIVE WRITES</span>
                </div>
            </div>

            <div className="w-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] font-medium text-zinc-500 uppercase">
                    <div>Time</div>
                    <div>Source</div>
                    <div className="text-right">Platform</div>
                    <div className="text-right">Bank</div>
                    <div className="text-right">Status</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-zinc-800/50">
                    <AnimatePresence>
                        {rows.map((row) => (
                            <motion.div
                                key={row.id}
                                initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(16, 185, 129, 0)' }}
                                transition={{ duration: 0.5 }}
                                className="grid grid-cols-5 gap-2 px-4 py-3 text-xs font-mono text-zinc-400 items-center"
                            >
                                <div className="text-zinc-600">{row.time}</div>
                                <div className="text-white font-sans">{row.platform}</div>
                                <div className="text-right">{row.debit}</div>
                                <div className="text-right">{row.credit}</div>
                                <div className="text-right">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] border",
                                        row.status === 'Auto' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                                        row.status === 'Review' ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                                        "border-red-500/30 text-red-400 bg-red-500/10"
                                    )}>
                                        {row.status} ({row.conf})
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {rows.length === 0 && (
                         <div className="px-4 py-8 text-center text-xs text-zinc-600 italic">Waiting for transactions...</div>
                    )}
                </div>
            </div>
             <div className="mt-auto pt-4 text-[10px] text-zinc-600 flex justify-between">
                <span>SHA-256: 8a7b...9c2d</span>
                <span>Block: #992811</span>
            </div>
        </div>
    );
};

export default MethodologyAnimations;
