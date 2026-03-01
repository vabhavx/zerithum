import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Clock, ShieldCheck } from 'lucide-react';
import { EVENTS, SEQUENCE_STEPS } from './data';
import EventRow from './EventRow';

const ProofWidget = () => {
    const [filterMismatches, setFilterMismatches] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'trace' | 'explain' | 'resolve'>('trace');
    const [resolvedState, setResolvedState] = useState<'none' | 'confirmed' | 'flagged'>('none');

    // Autoplay State
    const [isAutoplaying, setIsAutoplaying] = useState(true);
    const sequenceIndex = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Filter Logic
    const filteredEvents = filterMismatches
        ? EVENTS.filter(e => e.status !== 'matched')
        : EVENTS;

    // Autoplay Loop Engine
    useEffect(() => {
        if (!isAutoplaying) return;

        const runStep = () => {
            const step = SEQUENCE_STEPS[sequenceIndex.current];

            // Execute Step
            switch (step.action) {
                case 'expand':
                    setExpandedId(step.target);
                    setActiveTab('trace'); // Reset tab on expand
                    setResolvedState('none'); // Reset resolution on expand
                    break;
                case 'tab':
                    setActiveTab(step.target as any);
                    break;
                case 'resolve_simulate':
                    setResolvedState(step.target as any);
                    break;
                case 'reset':
                    setExpandedId(null);
                    setResolvedState('none');
                    setActiveTab('trace');
                    break;
            }

            // Schedule Next Step
            timeoutRef.current = setTimeout(() => {
                sequenceIndex.current = (sequenceIndex.current + 1) % SEQUENCE_STEPS.length;
                runStep();
            }, step.delay);
        };

        // Start Loop
        runStep();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isAutoplaying]);

    // Manual Interaction Handlers
    const handleInteractionStart = () => {
        setIsAutoplaying(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return (
        <div
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md ring-1 ring-white/5"
            onMouseEnter={handleInteractionStart}
            onTouchStart={handleInteractionStart}
        >
            {/* Widget Header */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-4 h-4">
                        {isAutoplaying ? (
                            <>
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-ping"></span>
                                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                            </>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                        )}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        {isAutoplaying ? 'Live Simulation' : 'Manual Inspection'}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800/50">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] font-mono text-zinc-400">T-00:00:00.042</span>
                    </div>

                    <label className="text-[10px] font-medium text-zinc-400 cursor-pointer select-none flex items-center gap-2 hover:text-white transition-colors">
                        Show mismatches
                        <button
                            role="switch"
                            aria-checked={filterMismatches}
                            onClick={(e) => {
                                e.stopPropagation();
                                setFilterMismatches(!filterMismatches);
                                handleInteractionStart();
                            }}
                            className={`w-7 h-4 rounded-full relative transition-colors ${filterMismatches ? 'bg-emerald-600' : 'bg-zinc-800 border border-zinc-700'}`}
                        >
                            <motion.div
                                layout
                                className="w-2.5 h-2.5 bg-white rounded-full absolute top-[2px] left-[3px]"
                                animate={{ x: filterMismatches ? 14 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </label>
                </div>
            </div>

            {/* Event List */}
            <div className="bg-zinc-950/30 min-h-[420px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <LayoutGroup>
                    <motion.div layout className="divide-y divide-zinc-800/50">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {filteredEvents.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    isExpanded={expandedId === event.id}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    resolvedState={resolvedState}
                                    setResolvedState={setResolvedState}
                                    onToggle={() => {
                                        handleInteractionStart();
                                        setExpandedId(expandedId === event.id ? null : event.id);
                                        // Reset tab state on manual toggle
                                        if (expandedId !== event.id) {
                                            setActiveTab('trace');
                                            setResolvedState('none');
                                        }
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </LayoutGroup>

                {filteredEvents.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-12 text-center"
                    >
                        <ShieldCheck className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-xs font-mono">System reconciled. No anomalies found.</p>
                    </motion.div>
                )}
            </div>

            {/* Footer Status Bar */}
            <div className="bg-zinc-950 border-t border-zinc-900 p-2 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                <div>Connected: 3 Nodes</div>
                <div>Latency: 42ms</div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-900 rounded-full"></div>
                    Encrypted (AES-256)
                </div>
            </div>
        </div>
    );
};

export default ProofWidget;
