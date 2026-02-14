import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    Check,
    Search,
    AlertCircle,
    ChevronRight,
    ShieldCheck,
    FileText,
    Link,
    Clock,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types ---
type EventStatus = 'matched' | 'review' | 'flagged';

interface RevenueEvent {
    id: string;
    source: string;
    amount: string;
    status: EventStatus;
    confidence: number;
    date: string;
    trace: { step: string; time: string; hash: string }[];
    explanation: string;
    changelog: { action: string; time: string }[];
    raw_data?: string;
}

// --- Data ---
const EVENTS: RevenueEvent[] = [
    {
        id: 'evt-001',
        source: 'YouTube AdSense',
        amount: '$8,432.10',
        status: 'matched',
        confidence: 99,
        date: 'Oct 24, 2:30 PM',
        trace: [
            { step: 'API Ingest', time: '00:00:01s', hash: '8f7a2b' },
            { step: 'Normalization', time: '00:00:02s', hash: 'c4d5e6' },
            { step: 'Settlement', time: '00:00:05s', hash: 'a1b2c3' }
        ],
        explanation: 'Exact match: $8,432.10 == $8,432.10 (tolerance: $0.00)',
        changelog: [
            { action: 'Ingested', time: '2:30:05 PM' },
            { action: 'Reconciled', time: '2:30:12 PM' }
        ]
    },
    {
        id: 'evt-002',
        source: 'Stripe Payments',
        amount: '$1,250.00',
        status: 'matched',
        confidence: 98,
        date: 'Oct 24, 4:15 PM',
        trace: [
            { step: 'Webhook Rx', time: '00:00:00s', hash: 'e9f0a1' },
            { step: 'Fee Calc', time: '00:00:01s', hash: 'b2c3d4' },
            { step: 'Net Match', time: '00:00:03s', hash: '5e6f7a' }
        ],
        explanation: 'Net match: $1,287.50 - $37.50 (fees) == $1,250.00',
        changelog: [
            { action: 'Webhook Rx', time: '4:15:22 PM' },
            { action: 'Fees Applied', time: '4:15:23 PM' }
        ]
    },
    {
        id: 'evt-003',
        source: 'Patreon Payout',
        amount: '$3,890.55',
        status: 'review',
        confidence: 45,
        date: 'Oct 25, 9:00 AM',
        trace: [
            { step: 'CSV Import', time: '00:00:10s', hash: '1a2b3c' },
            { step: 'Bank Feed', time: '---', hash: 'pending' },
            { step: 'Review Req', time: 'Now', hash: 'alert_01' }
        ],
        explanation: 'Mismatch: Expected ~$3,890.55, Found $3,700.00 (Delta: 4.8%)',
        changelog: [
            { action: 'CSV Parsed', time: '9:00:01 AM' },
            { action: 'Mismatch Flag', time: '9:00:05 AM' }
        ]
    },
    {
        id: 'evt-004',
        source: 'Brand Deal (Agency)',
        amount: '$15,000.00',
        status: 'flagged',
        confidence: 12,
        date: 'Oct 26, 11:45 AM',
        trace: [
            { step: 'Manual Entry', time: '00:00:00s', hash: 'user_x' },
            { step: 'Deposit Check', time: '---', hash: 'missing' },
            { step: 'Anomaly', time: 'Now', hash: 'alert_02' }
        ],
        explanation: 'Anomaly: Large manual entry > $10k with no deposit signal.',
        changelog: [
            { action: 'User Created', time: '11:45:00 AM' },
            { action: 'System Alert', time: '11:45:02 AM' }
        ]
    },
    {
        id: 'evt-005',
        source: 'Twitch Subs',
        amount: '$420.69',
        status: 'matched',
        confidence: 96,
        date: 'Oct 26, 3:20 PM',
        trace: [
            { step: 'API Ingest', time: '00:00:01s', hash: 't_5566' },
            { step: 'Threshold', time: '00:00:02s', hash: 'sys_ok' },
            { step: 'Settlement', time: '00:00:04s', hash: 'bank_ok' }
        ],
        explanation: 'Payout schedule match. 45 day net terms satisfied.',
        changelog: [
            { action: 'Ingested', time: '3:20:10 PM' },
            { action: 'Matched', time: '3:20:15 PM' }
        ]
    }
];

// --- Animation Config ---
const SEQUENCE_STEPS = [
    { action: 'expand', target: 'evt-003', delay: 1000 },
    { action: 'tab', target: 'trace', delay: 800 },
    { action: 'tab', target: 'explain', delay: 1500 },
    { action: 'tab', target: 'resolve', delay: 1500 },
    { action: 'resolve_simulate', target: 'confirmed', delay: 1200 },
    { action: 'reset', delay: 1000 }
];

const AccuracySection = () => {
    return (
        <section id="accuracy" className="py-24 relative bg-zinc-50 border-b border-zinc-200 overflow-hidden">
             {/* Technical Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Copy Side */}
                    <div className="space-y-8 sticky top-24">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest shadow-sm">
                                <Activity className="w-3 h-3 text-emerald-600" />
                                System Integrity
                            </div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight font-sans">
                                Verification logic you can see.
                            </h2>
                            <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-mono">
                                Revenue data is too important for black boxes. Inspect the lineage of every cent, from API response to bank settlement, with military-grade audit trails.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={Search}
                                title="Full Lineage Tracking"
                                desc="Click to trace the origin of any transaction through every system hop."
                            />
                            <FeaturePoint
                                icon={FileText}
                                title="Human Readable Reasoning"
                                desc="Understand exactly why a match was made or missed with plain text logs."
                            />
                            <FeaturePoint
                                icon={ShieldCheck}
                                title="Dispute and Resolve"
                                desc="Flag anomalies and force resolve edge cases directly in the timeline."
                            />
                        </div>

                        <div className="pt-8 border-t border-zinc-200">
                             <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                                <div className="flex -space-x-2">
                                     <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-500">YT</div>
                                     <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-500">S</div>
                                     <div className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-500">+</div>
                                </div>
                                <span>Ingesting from 20+ platforms & custom APIs</span>
                             </div>
                        </div>
                    </div>

                    {/* Interactive Widget Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full relative group perspective-[1000px]"
                    >
                        <ProofWidget />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const FeaturePoint = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex gap-4 group">
        <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 group-hover:border-zinc-300 transition-all duration-300 shadow-sm">
            <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
            <h3 className="text-zinc-900 font-medium mb-1 text-sm font-sans uppercase tracking-wide">{title}</h3>
            <p className="text-zinc-600 text-xs leading-relaxed font-mono">{desc}</p>
        </div>
    </div>
);

const ProofWidget = () => {
    const [filterMismatches, setFilterMismatches] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'trace' | 'explain' | 'resolve'>('trace');
    const [resolvedState, setResolvedState] = useState<'none' | 'confirmed' | 'flagged'>('none');

    // Autoplay State
    const [isAutoplaying, setIsAutoplaying] = useState(true);
    const sequenceIndex = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative"
            onMouseEnter={handleInteractionStart}
            onTouchStart={handleInteractionStart}
        >
            {/* Widget Header */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-3 h-3">
                        {isAutoplaying ? (
                            <>
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20 animate-ping"></span>
                                <div className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></div>
                            </>
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
                        )}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                        {isAutoplaying ? 'AUTOPLAY::ACTIVE' : 'MANUAL_OVERRIDE'}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span className="text-[10px] font-mono text-zinc-500">T-00:00:00.042</span>
                    </div>
                </div>
            </div>

            {/* Event List */}
            <div className="bg-zinc-900 min-h-[420px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
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
            </div>

            {/* Footer Status Bar */}
            <div className="bg-zinc-950 border-t border-zinc-800 p-2 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                 <div>NODES: 3/3</div>
                 <div>LATENCY: 42ms</div>
                 <div className="flex items-center gap-1 text-emerald-500/50">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    AES-256
                 </div>
            </div>
        </div>
    );
};

const EventRow = ({
    event,
    isExpanded,
    onToggle,
    activeTab,
    setActiveTab,
    resolvedState,
    setResolvedState
}: {
    event: RevenueEvent,
    isExpanded: boolean,
    onToggle: () => void,
    activeTab: 'trace' | 'explain' | 'resolve',
    setActiveTab: (t: any) => void,
    resolvedState: 'none' | 'confirmed' | 'flagged',
    setResolvedState: (s: any) => void
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`group transition-all duration-300 border-l-2 ${isExpanded ? 'bg-zinc-800/30 border-l-emerald-500' : 'hover:bg-zinc-800/20 border-l-transparent'}`}
        >
            {/* Row Content */}
            <div
                onClick={onToggle}
                className="p-3 pl-4 grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1.5fr_1fr_auto] gap-4 items-center cursor-pointer relative"
            >
                 {/* Mobile/Desktop Source & Amount */}
                <div className="min-w-0">
                    <div className="font-medium text-zinc-300 text-sm truncate flex items-center gap-2 font-mono">
                        {event.source}
                        {event.status === 'review' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5 md:hidden">{event.amount}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 hidden md:block font-mono">{event.date} <span className="text-zinc-700">|</span> ID: {event.id.split('-')[1]}</div>
                </div>

                {/* Amount (Desktop) */}
                <div className="hidden md:block font-mono text-zinc-400 text-sm text-right md:text-left tracking-tight">
                    {event.amount}
                </div>

                {/* Status & Confidence */}
                <div className="flex flex-col items-end md:items-start gap-1.5">
                    <StatusChip status={event.status} />
                    <ConfidenceMeter value={event.confidence} />
                </div>

                {/* Expand Button */}
                <button
                    className={`p-1.5 rounded hover:bg-zinc-800 text-zinc-600 transition-all duration-300 ${isExpanded ? 'rotate-90 text-zinc-300 bg-zinc-800' : ''}`}
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
                        className="overflow-hidden border-t border-zinc-800 bg-black/20"
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

const StatusChip = ({ status }: { status: EventStatus }) => {
    const config = {
        matched: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'MATCH' },
        review: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'REVIEW' },
        flagged: { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', label: 'FLAG' },
    };
    const c = config[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold border uppercase tracking-wider font-mono ${c.color}`}>
            {c.label}
        </span>
    );
};

const ConfidenceMeter = ({ value }: { value: number }) => {
    // Determine color based on value
    const colorClass = value > 90 ? 'bg-emerald-500' : value > 50 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="flex items-center gap-2 w-24 group/meter cursor-help" title={`Confidence Score: ${value}%`}>
            <div className="flex-1 h-1 bg-zinc-800 rounded-sm overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${colorClass}`}
                />
            </div>
            <span className="text-[9px] text-zinc-600 font-mono w-6 text-right opacity-70 group-hover/meter:opacity-100 transition-opacity">{value}%</span>
        </div>
    );
};

const ProofDrawer = ({
    event,
    activeTab,
    setActiveTab,
    resolvedState,
    setResolvedState
}: {
    event: RevenueEvent,
    activeTab: 'trace' | 'explain' | 'resolve',
    setActiveTab: (t: any) => void,
    resolvedState: 'none' | 'confirmed' | 'flagged',
    setResolvedState: (s: any) => void
}) => {

    const tabs = [
        { id: 'trace', label: 'TRACE', icon: Link },
        { id: 'explain', label: 'EXPLAIN', icon: FileText },
        { id: 'resolve', label: 'RESOLVE', icon: ShieldCheck },
    ] as const;

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                        className={`relative flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-wider font-mono transition-all duration-300 outline-none hover:bg-zinc-800/50 ${
                            activeTab === tab.id
                                ? 'text-zinc-200'
                                : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-[1px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            />
                        )}
                        <tab.icon className="w-3 h-3" />
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
                                        <div className={`z-10 w-2 h-2 rounded-full border border-black transition-all duration-300 ${i === event.trace.length - 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' : 'bg-zinc-700'}`}></div>
                                        <div className="flex-1 flex justify-between items-center p-2 rounded border border-transparent hover:border-zinc-800 hover:bg-zinc-800/50 transition-all cursor-crosshair">
                                            <span className="text-xs text-zinc-300 font-mono">{node.step}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-zinc-600 group-hover/node:text-emerald-500/70 transition-colors">#{node.hash}</span>
                                                <span className="text-[10px] font-mono text-zinc-600">{node.time}</span>
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
                            <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
                                <h4 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> System Reasoning
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed font-mono opacity-90">{event.explanation}</p>
                            </div>
                            {event.raw_data && (
                                <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
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
                                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-500/80 leading-relaxed font-mono">
                                            This transaction is outside the 2% tolerance window. Manual reconciliation required to update the ledger.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); setResolvedState('confirmed'); }}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 h-8 text-[10px] font-mono font-bold tracking-wide shadow-sm uppercase"
                                        >
                                            <Check className="w-3 h-3 mr-2" />
                                            Confirm Match
                                        </Button>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); setResolvedState('flagged'); }}
                                            variant="outline"
                                            className="border-rose-900/50 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 flex-1 h-8 text-[10px] font-mono uppercase"
                                        >
                                            <AlertCircle className="w-3 h-3 mr-2" />
                                            Flag Issue
                                        </Button>
                                    </div>
                                </div>
                            ) : resolvedState === 'confirmed' ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-8 text-emerald-500 bg-emerald-500/5 rounded border border-emerald-500/20"
                                >
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 ring-1 ring-emerald-500/20 shadow-sm">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <p className="font-mono text-sm font-bold tracking-tight">TRANSACTION LOCKED</p>
                                    <p className="text-[10px] text-emerald-500/60 font-mono mt-1">Hash: 0x99a...f7b2 • Timestamp: {new Date().toLocaleTimeString()}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setResolvedState('none'); }}
                                        className="text-[10px] text-zinc-500 mt-4 hover:text-zinc-300 underline decoration-zinc-700 underline-offset-4 font-mono"
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
                                        <select className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 focus:ring-1 focus:ring-rose-500/50 outline-none font-mono">
                                            <option>ERR_DUPLICATE_TX</option>
                                            <option>ERR_INVALID_AMOUNT</option>
                                            <option>ERR_FRAUD_SUSPICION</option>
                                            <option>ERR_OTHER</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Analyst Notes</label>
                                        <textarea
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 h-16 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none placeholder:text-zinc-700 font-mono"
                                            placeholder="Add context for audit trail..."
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setResolvedState('none'); }} className="text-zinc-500 h-8 text-[10px] font-mono hover:text-zinc-300 hover:bg-zinc-800 uppercase">Cancel</Button>
                                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 h-8 text-[10px] font-mono shadow-sm uppercase">Submit Flag</Button>
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

export default AccuracySection;
