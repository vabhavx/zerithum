import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { RevenueEvent } from './types';
import StatusChip from './StatusChip';
import ConfidenceMeter from './ConfidenceMeter';
import ProofDrawer from './ProofDrawer';

interface EventRowProps {
    event: RevenueEvent;
    isExpanded: boolean;
    onToggle: () => void;
    activeTab: 'trace' | 'explain' | 'resolve';
    setActiveTab: (t: 'trace' | 'explain' | 'resolve') => void;
    resolvedState: 'none' | 'confirmed' | 'flagged';
    setResolvedState: (s: 'none' | 'confirmed' | 'flagged') => void;
}

const EventRow: React.FC<EventRowProps> = ({
    event,
    isExpanded,
    onToggle,
    activeTab,
    setActiveTab,
    resolvedState,
    setResolvedState
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`group transition-all duration-300 border-l-2 ${isExpanded ? 'bg-zinc-900/80 border-l-emerald-500' : 'hover:bg-zinc-900/40 border-l-transparent'}`}
        >
            {/* Row Content */}
            <div
                onClick={onToggle}
                className="p-3 pl-4 grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1.5fr_1fr_auto] gap-4 items-center cursor-pointer relative"
            >
                 {/* Mobile/Desktop Source & Amount */}
                <div className="min-w-0">
                    <div className="font-medium text-white text-sm truncate flex items-center gap-2">
                        {event.source}
                        {event.status === 'review' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 md:hidden">{event.amount}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 hidden md:block font-mono opacity-60">{event.date} • ID: {event.id.split('-')[1]}</div>
                </div>

                {/* Amount (Desktop) */}
                <div className="hidden md:block font-mono text-zinc-300 text-sm text-right md:text-left tracking-tight">
                    {event.amount}
                </div>

                {/* Status & Confidence */}
                <div className="flex flex-col items-end md:items-start gap-1.5">
                    <StatusChip status={event.status} />
                    <ConfidenceMeter value={event.confidence} />
                </div>

                {/* Expand Button */}
                <button
                    className={`p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-all duration-300 ${isExpanded ? 'rotate-90 text-white bg-zinc-800' : ''}`}
                    aria-label={isExpanded ? "Collapse proof" : "See proof"}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Expanded Drawer */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-zinc-800/50 bg-zinc-950/30"
                    >
                        <div className="p-4">
                            <ProofDrawer
                                event={event}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                resolvedState={resolvedState}
                                setResolvedState={setResolvedState}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default EventRow;
