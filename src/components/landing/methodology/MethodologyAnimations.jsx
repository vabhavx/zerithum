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
        }, 2500);
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    const items = [
        { id: 1, platform: 'YouTube', pAmount: '$1,800', bAmount: '$1,650', score: 0.85, status: 'review', reason: 'Fee deduction', icon: Video, color: 'text-red-600', badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        { id: 2, platform: 'Patreon', pAmount: '$1,200', bAmount: '$1,200', score: 0.99, status: 'auto', reason: 'Exact match', icon: Globe, color: 'text-orange-600', badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        { id: 3, platform: 'Stripe', pAmount: '$500', bAmount: '$480', score: 0.60, status: 'flagged', reason: 'Hold period', icon: CreditCard, color: 'text-indigo-600', badgeColor: 'bg-red-100 text-red-700 border-red-200' },
        { id: 4, platform: 'Gumroad', pAmount: '$230', bAmount: '$230', score: 0.99, status: 'auto', reason: 'Exact match', icon: ShoppingBag, color: 'text-pink-600', badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ];

    return (
        <div className="w-full h-full p-6 flex flex-col justify-center bg-zinc-50 relative overflow-hidden border border-zinc-200 rounded-xl">
            <div className="absolute top-4 left-6 text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Live Feed
            </div>

            <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center relative z-10 mt-6">
                {/* Platform Column (Wider: 5 cols) */}
                <div className="col-span-5 space-y-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 pl-2">Platform</div>
                    {items.map((item, idx) => (
                        <motion.div
                            key={`p-${item.id}`}
                            animate={{
                                opacity: step >= idx ? 1 : 0.4,
                                scale: step === idx ? 1.02 : 1,
                                borderColor: step === idx ? '#10b981' : '#e4e4e7'
                            }}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-white shadow-sm transition-all"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <item.icon className={cn("w-4 h-4 shrink-0", item.color)} />
                                <span className="text-sm font-medium text-zinc-900 truncate">{item.platform}</span>
                            </div>
                            <span className="font-mono text-sm text-zinc-500 ml-2 shrink-0">{item.pAmount}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Connection Lines (Narrower: 2 cols) */}
                <div className="col-span-2 flex flex-col items-center justify-center space-y-4 pt-6">
                     {items.map((item, idx) => (
                        <div key={`c-${item.id}`} className="h-[50px] sm:h-[54px] w-full flex items-center justify-center relative">
                            {step >= idx && (
                                <div className="w-full flex items-center relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="h-[2px] bg-zinc-300 absolute left-0 top-1/2 -translate-y-1/2 z-0"
                                    />
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className={cn(
                                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold border whitespace-nowrap z-10 shadow-sm bg-white",
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

                {/* Bank Column (Wider: 5 cols) */}
                <div className="col-span-5 space-y-4">
                    <div className="text-xs font-medium text-zinc-500 mb-2 text-right pr-2">Bank</div>
                    {items.map((item, idx) => (
                        <motion.div
                            key={`b-${item.id}`}
                            animate={{
                                opacity: step >= idx ? 1 : 0.4,
                                scale: step === idx ? 1.02 : 1,
                                borderColor: step === idx ? '#10b981' : '#e4e4e7'
                            }}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-white shadow-sm transition-all"
                        >
                            <span className="font-mono text-sm text-zinc-500">{item.bAmount}</span>
                            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden justify-end">
                                {/* Hide label on small screens to prevent collision */}
                                <span className="text-sm font-medium text-zinc-900 hidden lg:inline">Deposit</span>
                                <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
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
        }, 1500);
        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    // Update example index when sequence resets to 0
    useEffect(() => {
        if (sequence === 0) {
            setExampleIndex(prev => (prev + 1) % examples.length);
        }
    }, [sequence]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-lg relative">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                    <span className="text-xs font-mono text-zinc-400">CONFIDENCE_ENGINE</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400/30"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-400/30"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400/30"></div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-400 uppercase mb-1">Platform</div>
                            <div className="bg-zinc-100 px-3 py-2 rounded text-sm font-mono text-zinc-900 border border-zinc-200">{current.pAmount}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{current.pDate}</div>
                        </div>
                        <div className="text-zinc-300 pb-4"><ArrowRight className="w-4 h-4" /></div>
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-400 uppercase mb-1">Bank</div>
                            <div className="bg-zinc-100 px-3 py-2 rounded text-sm font-mono text-zinc-900 border border-zinc-200">{current.bAmount}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{current.bDate}</div>
                        </div>
                    </div>

                    <div className="space-y-2 min-h-[60px]">
                        <AnimatePresence mode='popLayout'>
                            {sequence >= 1 && (
                                <motion.div
                                    key={`amt-${exampleIndex}`}
                                    initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}}
                                    className="flex justify-between items-center text-xs p-2 rounded bg-zinc-50"
                                >
                                    <span className="text-zinc-500 font-medium">Amount Check</span>
                                    {current.checks.amount ?
                                        <span className="text-emerald-600 flex items-center gap-1 font-medium"><Check className="w-3 h-3" /> Exact</span> :
                                        <span className="text-amber-600 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> ~2% Var</span>
                                    }
                                </motion.div>
                            )}
                            {sequence >= 2 && (
                                <motion.div
                                    key={`date-${exampleIndex}`}
                                    initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}}
                                    className="flex justify-between items-center text-xs p-2 rounded bg-zinc-50"
                                >
                                    <span className="text-zinc-500 font-medium">Date Check</span>
                                    {current.checks.date ?
                                        <span className="text-emerald-600 flex items-center gap-1 font-medium"><Check className="w-3 h-3" /> Match</span> :
                                        <span className="text-amber-600 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> +1 Day</span>
                                    }
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-4 border-t border-zinc-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-zinc-400">SCORE</span>
                            {sequence >= 3 && (
                                <motion.span
                                    key={`score-${exampleIndex}`}
                                    initial={{scale:0}} animate={{scale:1}}
                                    className={cn("text-xl font-mono font-bold", current.color === 'emerald' ? 'text-emerald-600' : 'text-amber-500')}
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
                                    current.color === 'emerald' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                )}
                            >
                                {current.decision}
                            </motion.div>
                        )}
                    </div>

                     {sequence >= 5 && (
                        <motion.div
                             initial={{opacity:0}} animate={{opacity:1}}
                             className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-zinc-400"
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
        }, 1500);

        return () => clearInterval(interval);
    }, [shouldReduceMotion]);

    return (
        <div className="w-full h-full p-6 bg-zinc-50 flex flex-col border border-zinc-200 rounded-xl">
             <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3 h-3" /> Immutable Ledger
                </div>
                <div className="flex gap-2 items-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] text-zinc-400 font-mono">LIVE_WRITES</span>
                </div>
            </div>

            <div className="w-full border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm flex-1 flex flex-col">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-zinc-100 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                    <div>Time</div>
                    <div>Source</div>
                    <div className="text-right">Platform</div>
                    <div className="text-right">Bank</div>
                    <div className="text-right">Status</div>
                </div>

                <div className="divide-y divide-zinc-100 bg-white relative">
                    <AnimatePresence initial={false}>
                        {rows.map((row) => (
                            <motion.div
                                key={row.id}
                                initial={{ opacity: 0, x: -10, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255, 255, 255, 0)' }}
                                transition={{ duration: 0.4 }}
                                className="grid grid-cols-5 gap-2 px-4 py-3 text-[11px] font-mono text-zinc-600 items-center"
                            >
                                <div className="text-zinc-400">{row.time}</div>
                                <div className="text-zinc-900 font-sans font-medium">{row.platform}</div>
                                <div className="text-right">{row.debit}</div>
                                <div className="text-right">{row.credit}</div>
                                <div className="text-right flex justify-end">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-[2px] border text-[9px] font-bold uppercase",
                                        row.status === 'Auto' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                        row.status === 'Review' ? "border-amber-200 text-amber-700 bg-amber-50" :
                                        "border-red-200 text-red-700 bg-red-50"
                                    )}>
                                        {row.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {rows.length === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 italic mt-8">
                             Syncing ledger...
                         </div>
                    )}
                </div>
            </div>
             <div className="mt-auto pt-3 text-[9px] text-zinc-400 font-mono flex justify-between border-t border-zinc-100">
                <span>SHA-256: 8a7b...9c2d</span>
                <span>Block: #992811</span>
            </div>
        </div>
    );
};

export default MethodologyAnimations;
