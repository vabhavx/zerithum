import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, CornerDownRight, Database, Banknote, ShieldCheck } from 'lucide-react';

const examples = [
    {
        id: 'yt',
        platform: 'YouTube',
        color: 'text-red-500',
        borderColor: 'border-red-500/50',
        bg: 'bg-red-500/10',
        source: {
            label: 'SOURCE_EVENT',
            data: {
                platform: 'YouTube Earnings',
                period: 'Oct 01 - Oct 31',
                gross: '$1,800.00',
                fees: '-$0.00',
                net: '$1,800.00'
            }
        },
        payout: {
            label: 'PAYOUT_EVENT',
            data: {
                processor: 'Google Ireland',
                date: 'Nov 21, 2023',
                id: 'PAY-8829100'
            }
        },
        bank: {
            label: 'BANK_DEPOSIT',
            data: {
                bank: 'Chase Checking',
                amount: '$1,650.00',
                delta: '-$150.00',
                desc: 'GOOGLE *SERVICES'
            }
        },
        decision: {
            label: 'RECONCILIATION_DECISION',
            status: 'FLAGGED',
            reason: 'Fee Deduction > 5%',
            confidence: '0.85'
        }
    },
    {
        id: 'stripe',
        platform: 'Stripe',
        color: 'text-indigo-500',
        borderColor: 'border-indigo-500/50',
        bg: 'bg-indigo-500/10',
        source: {
            label: 'SOURCE_EVENT',
            data: {
                platform: 'Stripe Payments',
                period: 'Chg_99281',
                gross: '$99.00',
                fees: '-$2.90',
                net: '$96.10'
            }
        },
        payout: {
            label: 'PAYOUT_EVENT',
            data: {
                processor: 'Stripe Connect',
                date: 'Nov 22, 2023',
                id: 'po_19928'
            }
        },
        bank: {
            label: 'BANK_DEPOSIT',
            data: {
                bank: 'Mercury',
                amount: '$96.10',
                delta: '$0.00',
                desc: 'STRIPE TRANSFER'
            }
        },
        decision: {
            label: 'RECONCILIATION_DECISION',
            status: 'MATCHED',
            reason: 'Exact Match',
            confidence: '0.99'
        }
    }
];

const ProductAutopsy = () => {
    const [currentExample, setCurrentExample] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentExample((prev) => (prev + 1) % examples.length);
            }, 6000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const example = examples[currentExample];

    return (
        <motion.div
            className="w-full max-w-6xl mx-auto py-20 px-4 flex flex-col md:flex-row-reverse items-center gap-12"
            onViewportEnter={() => setIsPlaying(true)}
            onViewportLeave={() => setIsPlaying(false)}
        >
            {/* Text Content */}
            <div className="md:w-1/3 space-y-6 text-right md:text-left">
                <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white">
                    Revenue autopsy <br/> for every payout.
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                    Trace every dollar from source to bank. Zerithum ingests metadata when provided by the platform, giving you a complete lineage for tax defense.
                </p>
                <div className="flex flex-col gap-2 items-end md:items-start text-xs font-mono text-zinc-500">
                     <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" /> Source Metadata
                     </div>
                     <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" /> Bank Truth
                     </div>
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Audit Defense
                     </div>
                </div>
            </div>

            {/* Animation Container */}
            <div className="md:w-2/3 w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 min-h-[500px] relative">
                 <div className="absolute top-4 right-4 text-xs font-mono text-zinc-600">
                    TRANSACTION_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                 </div>

                 <AnimatePresence mode="wait">
                    <motion.div
                        key={example.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6 relative"
                    >
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-8 bottom-8 w-[1px] bg-zinc-800 -z-10"></div>

                        {/* Step 1: Source */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex gap-4"
                        >
                            <div className={`w-10 h-10 rounded-full bg-zinc-950 border ${example.borderColor} flex items-center justify-center shrink-0 z-10`}>
                                <div className={`w-3 h-3 rounded-full ${example.bg.replace('/10', '')}`}></div>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex-1">
                                <div className="text-[10px] font-mono text-zinc-500 mb-2 flex justify-between">
                                    <span>{example.source.label}</span>
                                    <span className={example.color}>{example.platform} API</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-zinc-500 text-xs">Gross</div>
                                        <div className="text-zinc-200 font-mono">{example.source.data.gross}</div>
                                    </div>
                                    <div>
                                        <div className="text-zinc-500 text-xs">Net (Est)</div>
                                        <div className="text-zinc-200 font-mono">{example.source.data.net}</div>
                                    </div>
                                    <div className="col-span-2 text-xs text-zinc-600 font-mono truncate">
                                        ID: {example.source.data.period}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Payout */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 z-10">
                                <ArrowRight className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex-1 opacity-80">
                                <div className="text-[10px] font-mono text-zinc-500 mb-2">{example.payout.label}</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-zinc-300">{example.payout.data.processor}</div>
                                    <div className="text-xs text-zinc-500">{example.payout.data.date}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: Bank */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="flex gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-950 border border-blue-900 flex items-center justify-center shrink-0 z-10">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex-1">
                                <div className="text-[10px] font-mono text-zinc-500 mb-2 flex justify-between">
                                    <span>{example.bank.label}</span>
                                    <span className="text-blue-500">PLAID FEED</span>
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-zinc-200 font-medium">{example.bank.data.bank}</div>
                                        <div className="text-xs text-zinc-500">{example.bank.data.desc}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-zinc-200 font-mono text-lg">{example.bank.data.amount}</div>
                                        <div className="text-xs text-zinc-500">Settled</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 4: Decision */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.5, type: "spring" }}
                            className={`ml-14 p-4 rounded-lg border border-l-4 ${example.decision.status === 'MATCHED' ? 'border-emerald-500/30 border-l-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 border-l-amber-500 bg-amber-500/5'}`}
                        >
                             <div className="flex justify-between items-center mb-1">
                                <div className={`font-mono text-xs font-bold ${example.decision.status === 'MATCHED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {example.decision.status}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">Confidence: {example.decision.confidence}</div>
                             </div>
                             <div className="text-sm text-zinc-300">
                                Reason: {example.decision.reason}
                             </div>
                        </motion.div>

                    </motion.div>
                 </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default ProductAutopsy;
