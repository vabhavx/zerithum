import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, AlertCircle, ArrowRight, Video, CreditCard, Globe, ShoppingBag, Database, Shield } from 'lucide-react';
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
            setStep((prev) => (prev + 1) % 5);
        }, 1500); // Faster speed (was 2500)
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    const items = [
        { id: 1, platform: 'YouTube', pAmount: '$1,800', bAmount: '$1,650', score: 0.85, status: 'review', reason: 'Fee deduction', icon: Video, color: 'text-red-500', badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        { id: 2, platform: 'Patreon', pAmount: '$1,200', bAmount: '$1,200', score: 0.99, status: 'auto', reason: 'Exact match', icon: Globe, color: 'text-orange-500', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        { id: 3, platform: 'Stripe', pAmount: '$500', bAmount: '$480', score: 0.60, status: 'flagged', reason: 'Hold period', icon: CreditCard, color: 'text-indigo-500', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' },
        { id: 4, platform: 'Gumroad', pAmount: '$230', bAmount: '$230', score: 0.99, status: 'auto', reason: 'Exact match', icon: ShoppingBag, color: 'text-pink-500', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    ];

    return (
        <div className="w-full h-full p-6 flex flex-col justify-center bg-zinc-950/50 relative overflow-hidden border border-zinc-800 rounded-xl">
            <div className="absolute top-4 left-6 text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Live Feed
            </div>

            <div className="grid grid-cols-12 gap-3 items-center relative z-10 mt-6">
                {/* Platform Column (Width: 5) */}
                <div className="col-span-5 space-y-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 pl-2">Platform</div>
                    {items.map((item, idx) => (
                        <motion.div
                            key={`p-${item.id}`}
                            animate={{
                                opacity: step >= idx ? 1 : 0.4,
                                scale: step === idx ? 1.02 : 1,
                                borderColor: step === idx ? '#10b981' : '#27272a'
                            }}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-zinc-900 shadow-sm transition-all border-zinc-800"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <item.icon className={cn("w-4 h-4 shrink-0", item.color)} />
                                <span className="text-sm font-medium text-zinc-300 truncate">{item.platform}</span>
                            </div>
                            <span className="font-mono text-sm text-zinc-500 ml-1 shrink-0">{item.pAmount}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Connection Lines (Width: 2) */}
                <div className="col-span-2 flex flex-col items-center justify-center space-y-4 pt-6">
                     {items.map((item, idx) => (
                        <div key={`c-${item.id}`} className="h-[50px] sm:h-[54px] w-full flex items-center justify-center relative">
                            {step >= idx && (
                                <div className="w-full flex items-center relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="h-[1px] bg-zinc-700 absolute left-0 top-1/2 -translate-y-1/2 z-0"
                                    />
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className={cn(
                                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold border whitespace-nowrap z-10 shadow-sm",
                                            item.badgeColor
                                        )}
                                    >
                                        {item.score.toFixed(2)}
                                    </motion.div>
                                </div>
                            )}
                        </div>
                     ))}
                </div>

                {/* Bank Column (Width: 5) - FIXED OVERLAP */}
                <div className="col-span-5 space-y-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 text-right pr-2">Bank</div>
                    {items.map((item, idx) => (
                        <motion.div
                            key={`b-${item.id}`}
                            animate={{
                                opacity: step >= idx ? 1 : 0.4,
                                scale: step === idx ? 1.02 : 1,
                                borderColor: step === idx ? '#10b981' : '#27272a'
                            }}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-zinc-900 shadow-sm transition-all border-zinc-800"
                        >
                            <span className="font-mono text-sm text-zinc-500">{item.bAmount}</span>
                            <div className="flex items-center gap-2 justify-end min-w-0">
                                {/* Truncate or hide text on collision */}
                                <span className="text-sm font-medium text-zinc-300 hidden xl:inline truncate">Deposit</span>
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
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
    const [sequence, setSequence] = useState(0);
    const [exampleIndex, setExampleIndex] = useState(0);
    const shouldReduceMotion = useReducedMotion();

    const examples = [
        { platform: 'YouTube', pAmount: '$1,200', pDate: 'Jan 15', bAmount: '$1,200', bDate: 'Jan 15', score: 0.99, decision: 'Auto Reconciled', color: 'emerald', checks: { amount: true, date: true } },
        { platform: 'Patreon', pAmount: '$1,200', pDate: 'Jan 15', bAmount: '$1,150', bDate: 'Jan 16', score: 0.85, decision: 'Needs Review', color: 'amber', checks: { amount: false, date: true } }
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
                    return 0; // Reset sequence
                }
                return prev + 1;
            });
        }, 1200); // Faster speed
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    useEffect(() => {
        if (sequence === 0) {
            setExampleIndex(prev => (prev + 1) % examples.length);
        }
    }, [sequence]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/50 border border-zinc-800 rounded-xl">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg relative">
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                    <span className="text-xs font-mono text-zinc-500">CONFIDENCE_ENGINE</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Platform</div>
                            <div className="bg-zinc-800 px-3 py-2 rounded text-sm font-mono text-zinc-300 border border-zinc-700">{current.pAmount}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{current.pDate}</div>
                        </div>
                        <div className="text-zinc-700 pb-4"><ArrowRight className="w-4 h-4" /></div>
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Bank</div>
                            <div className="bg-zinc-800 px-3 py-2 rounded text-sm font-mono text-zinc-300 border border-zinc-700">{current.bAmount}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{current.bDate}</div>
                        </div>
                    </div>

                    <div className="space-y-2 min-h-[60px]">
                        <AnimatePresence mode='popLayout'>
                            {sequence >= 1 && (
                                <motion.div
                                    key={`amt-${exampleIndex}`}
                                    initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}}
                                    className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900/50"
                                >
                                    <span className="text-zinc-500 font-medium">Amount Check</span>
                                    {current.checks.amount ?
                                        <span className="text-emerald-400 flex items-center gap-1 font-medium"><Check className="w-3 h-3" /> Exact</span> :
                                        <span className="text-yellow-400 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> ~2% Var</span>
                                    }
                                </motion.div>
                            )}
                            {sequence >= 2 && (
                                <motion.div
                                    key={`date-${exampleIndex}`}
                                    initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}}
                                    className="flex justify-between items-center text-xs p-2 rounded bg-zinc-900/50"
                                >
                                    <span className="text-zinc-500 font-medium">Date Check</span>
                                    {current.checks.date ?
                                        <span className="text-emerald-400 flex items-center gap-1 font-medium"><Check className="w-3 h-3" /> Match</span> :
                                        <span className="text-yellow-400 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> +1 Day</span>
                                    }
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-zinc-500">SCORE</span>
                            {sequence >= 3 && (
                                <motion.span
                                    key={`score-${exampleIndex}`}
                                    initial={{scale:0}} animate={{scale:1}}
                                    className={cn("text-xl font-mono font-bold", current.color === 'emerald' ? 'text-emerald-400' : 'text-yellow-400')}
                                >
                                    {current.score}
                                </motion.span>
                            )}
                        </div>
                        {sequence >= 4 && (
                            <motion.div
                                key={`decision-${exampleIndex}`}
                                initial={{y:10, opacity:0}} animate={{y:0, opacity:1}}
                                className={cn(
                                    "w-full py-2 rounded text-center text-xs font-bold uppercase tracking-wider border",
                                    current.color === 'emerald' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                )}
                            >
                                {current.decision}
                            </motion.div>
                        )}
                    </div>

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

    // Constant data stream
    const dataStream = [
        { id: 1, time: '14:08:22', platform: 'YouTube', debit: '1,800.00', credit: '1,650.00', conf: '0.85', status: 'Review' },
        { id: 2, time: '14:09:05', platform: 'Patreon', debit: '1,200.00', credit: '1,200.00', conf: '0.99', status: 'Auto' },
        { id: 3, time: '14:10:11', platform: 'Stripe', debit: '500.00', credit: '480.00', conf: '0.60', status: 'Flagged' },
        { id: 4, time: '14:11:45', platform: 'Gumroad', debit: '230.00', credit: '230.00', conf: '0.99', status: 'Auto' },
        { id: 5, time: '14:12:30', platform: 'Twitch', debit: '850.00', credit: '850.00', conf: '0.99', status: 'Auto' },
        { id: 6, time: '14:13:12', platform: 'Shopify', debit: '3,400.00', credit: '3,400.00', conf: '0.99', status: 'Auto' },
        { id: 7, time: '14:14:05', platform: 'Ko-fi', debit: '45.00', credit: '45.00', conf: '0.99', status: 'Auto' },
    ];

    useEffect(() => {
        if (shouldReduceMotion) {
            setRows(dataStream.slice(0, 4));
            return;
        }

        let currentIndex = 0;
        const interval = setInterval(() => {
            const nextRow = dataStream[currentIndex];
            if (!nextRow) {
                currentIndex = 0;
                setRows([]);
                return;
            }

            setRows(prev => {
                const newRows = [...prev, nextRow];
                if (newRows.length > 5) return newRows.slice(1);
                return newRows;
            });

            currentIndex++;
        }, 1200); // Faster speed

        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    return (
        <div className="w-full h-full p-6 bg-zinc-950/50 flex flex-col border border-zinc-800 rounded-xl">
             <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3 h-3" /> Immutable Ledger
                </div>
                <div className="flex gap-2 items-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] text-zinc-500 font-mono">LIVE_WRITES</span>
                </div>
            </div>

            <div className="w-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 shadow-sm flex-1 flex flex-col">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                    <div>Time</div>
                    <div>Source</div>
                    <div className="text-right">Platform</div>
                    <div className="text-right">Bank</div>
                    <div className="text-right">Status</div>
                </div>

                <div className="divide-y divide-zinc-800 bg-zinc-900 relative">
                    <AnimatePresence initial={false}>
                        {rows.map((row) => (
                            <motion.div
                                key={row.id}
                                initial={{ opacity: 0, x: -10, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255, 255, 255, 0)' }}
                                transition={{ duration: 0.4 }}
                                className="grid grid-cols-5 gap-2 px-4 py-3 text-[11px] font-mono text-zinc-400 items-center"
                            >
                                <div className="text-zinc-600">{row.time}</div>
                                <div className="text-zinc-300 font-sans font-medium">{row.platform}</div>
                                <div className="text-right">{row.debit}</div>
                                <div className="text-right">{row.credit}</div>
                                <div className="text-right flex justify-end">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-[2px] border text-[9px] font-bold uppercase",
                                        row.status === 'Auto' ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" :
                                        row.status === 'Review' ? "border-yellow-500/20 text-yellow-400 bg-yellow-500/10" :
                                        "border-red-500/20 text-red-400 bg-red-500/10"
                                    )}>
                                        {row.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {rows.length === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600 italic mt-8">
                             Syncing ledger...
                         </div>
                    )}
                </div>
            </div>
             <div className="mt-auto pt-3 text-[9px] text-zinc-600 font-mono flex justify-between border-t border-zinc-800">
                <span>SHA-256: 8a7b...9c2d</span>
                <span>Block: #992811</span>
            </div>
        </div>
    );
};

export default MethodologyAnimations;
