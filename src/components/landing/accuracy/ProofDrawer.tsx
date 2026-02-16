import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, FileText, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RevenueEvent } from './types';

interface ProofDrawerProps {
    event: RevenueEvent;
    activeTab: 'trace' | 'explain' | 'resolve';
    setActiveTab: (t: 'trace' | 'explain' | 'resolve') => void;
    resolvedState: 'none' | 'confirmed' | 'flagged';
    setResolvedState: (s: 'none' | 'confirmed' | 'flagged') => void;
}

const ProofDrawer: React.FC<ProofDrawerProps> = ({
    event,
    activeTab,
    setActiveTab,
    resolvedState,
    setResolvedState
}) => {

    const tabs = [
        { id: 'trace', label: 'Trace', icon: Link },
        { id: 'explain', label: 'Explain', icon: FileText },
        { id: 'resolve', label: 'Resolve', icon: ShieldCheck },
    ] as const;

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                        className={`relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-300 outline-none focus:bg-zinc-900 ${
                            activeTab === tab.id
                                ? 'text-white'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-[1px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                        )}
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[140px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'trace' && (
                        <motion.div
                            key="trace"
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            <div className="relative pl-2">
                                {/* Vertical Line */}
                                <div className="absolute left-[5.5px] top-2 bottom-2 w-[1px] bg-zinc-800"></div>

                                {event.trace.map((node, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-4 relative py-2 group/node"
                                    >
                                        <div className={`z-10 w-2 h-2 rounded-full border border-zinc-950 transition-all duration-300 ${i === event.trace.length - 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' : 'bg-zinc-700'}`}></div>
                                        <div className="flex-1 flex justify-between items-center p-2 rounded border border-transparent hover:border-zinc-800 hover:bg-zinc-900/30 transition-all cursor-crosshair">
                                            <span className="text-xs text-zinc-300 font-medium">{node.step}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-zinc-600 group-hover/node:text-emerald-500/70 transition-colors">#{node.hash}</span>
                                                <span className="text-[10px] font-mono text-zinc-500">{node.time}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'explain' && (
                        <motion.div
                            key="explain"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="p-3 rounded bg-zinc-900/50 border border-zinc-800/60">
                                <h4 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> System Reasoning
                                </h4>
                                <p className="text-xs text-zinc-300 leading-relaxed font-mono opacity-90">{event.explanation}</p>
                            </div>
                            {event.raw_data && (
                                <div className="p-3 rounded bg-black/40 border border-zinc-800/60">
                                    <h4 className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Raw Payload</h4>
                                    <pre className="text-[10px] text-zinc-500 font-mono overflow-x-auto">{event.raw_data}</pre>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'resolve' && (
                        <motion.div
                            key="resolve"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-4"
                        >
                            {resolvedState === 'none' ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-200/70 leading-relaxed">
                                            This transaction is outside the 2% tolerance window. Manual reconciliation required to update the ledger.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); setResolvedState('confirmed'); }}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 h-9 text-xs font-semibold tracking-wide"
                                        >
                                            <Check className="w-3.5 h-3.5 mr-2" />
                                            CONFIRM MATCH
                                        </Button>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); setResolvedState('flagged'); }}
                                            variant="outline"
                                            className="border-rose-900/30 text-rose-400 bg-rose-950/10 hover:bg-rose-950/20 hover:text-rose-300 flex-1 h-9 text-xs"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5 mr-2" />
                                            FLAG ISSUE
                                        </Button>
                                    </div>
                                </div>
                            ) : resolvedState === 'confirmed' ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-8 text-emerald-500 bg-emerald-500/5 rounded border border-emerald-500/10"
                                >
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <p className="font-mono text-sm font-bold tracking-tight">TRANSACTION LOCKED</p>
                                    <p className="text-[10px] text-emerald-500/60 font-mono mt-1">Hash: 0x99a...f7b2 • Timestamp: {new Date().toLocaleTimeString()}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setResolvedState('none'); }}
                                        className="text-[10px] text-zinc-500 mt-4 hover:text-white underline decoration-zinc-700 underline-offset-4"
                                    >
                                        Undo Action
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ x: 5, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="space-y-3"
                                >
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Reason Code</label>
                                        <select className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:ring-1 focus:ring-rose-500/50 outline-none">
                                            <option>ERR_DUPLICATE_TX</option>
                                            <option>ERR_INVALID_AMOUNT</option>
                                            <option>ERR_FRAUD_SUSPICION</option>
                                            <option>ERR_OTHER</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Analyst Notes</label>
                                        <textarea
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white h-16 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none placeholder:text-zinc-700"
                                            placeholder="Add context for audit trail..."
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setResolvedState('none'); }} className="text-zinc-400 h-8 text-xs hover:text-white hover:bg-zinc-900">Cancel</Button>
                                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 h-8 text-xs">Submit Flag</Button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProofDrawer;
