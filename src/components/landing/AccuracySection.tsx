import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    Check,
    X,
    Search,
    AlertCircle,
    ChevronRight,
    ArrowRight,
    ShieldCheck,
    FileText,
    Link,
    Clock,
    User,
    Eye
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
    trace: { step: string; time: string }[];
    explanation: string;
    changelog: { action: string; time: string }[];
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
            { step: 'API Ingest (YouTube Data API)', time: '00:00:01s' },
            { step: 'Currency Normalization (USD)', time: '00:00:02s' },
            { step: 'Bank Settlement (Chase)', time: '00:00:05s' }
        ],
        explanation: 'Exact amount match within 24h window.',
        changelog: [
            { action: 'Ingested via API', time: '2:30 PM' },
            { action: 'Auto-reconciled', time: '2:31 PM' }
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
            { step: 'Webhook Receipt (Stripe)', time: '00:00:00s' },
            { step: 'Fee Deduction (-2.9% + 30c)', time: '00:00:01s' },
            { step: 'Net Deposit Match', time: '00:00:03s' }
        ],
        explanation: 'Net amount matches after fee calculation.',
        changelog: [
            { action: 'Webhook Received', time: '4:15 PM' },
            { action: 'Fees Applied', time: '4:15 PM' }
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
            { step: 'CSV Import (Patreon)', time: '00:00:10s' },
            { step: 'Pending Bank Feed', time: '---' },
            { step: 'Manual Review Required', time: 'Now' }
        ],
        explanation: 'Amount mismatch exceeding 5% threshold.',
        changelog: [
            { action: 'CSV Uploaded', time: '9:00 AM' },
            { action: 'Mismatch Flagged', time: '9:01 AM' }
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
            { step: 'Manual Entry', time: '00:00:00s' },
            { step: 'No Corresponding Deposit', time: '---' },
            { step: 'Anomaly Detected', time: 'Now' }
        ],
        explanation: 'Large transaction with no bank record.',
        changelog: [
            { action: 'User Created', time: '11:45 AM' },
            { action: 'System Alert', time: '11:46 AM' }
        ]
    },
    {
        id: 'evt-005',
        source: 'Twitch Subscriptions',
        amount: '$420.69',
        status: 'matched',
        confidence: 96,
        date: 'Oct 26, 3:20 PM',
        trace: [
            { step: 'API Ingest (Twitch)', time: '00:00:01s' },
            { step: 'Payout Threshold Met', time: '00:00:02s' },
            { step: 'Bank Settlement', time: '00:00:04s' }
        ],
        explanation: 'Matches payout schedule logic.',
        changelog: [
            { action: 'Ingested', time: '3:20 PM' },
            { action: 'Matched', time: '3:22 PM' }
        ]
    },
    {
        id: 'evt-006',
        source: 'Shopify Store',
        amount: '$2,100.00',
        status: 'matched',
        confidence: 99,
        date: 'Oct 27, 10:10 AM',
        trace: [
            { step: 'Order Sync', time: '00:00:05s' },
            { step: 'Payout Batching', time: '00:01:00s' },
            { step: 'Deposit Confirmed', time: '00:01:05s' }
        ],
        explanation: 'Batch total matches daily deposit.',
        changelog: [
            { action: 'Orders Synced', time: '10:10 AM' },
            { action: 'Batch Closed', time: '10:15 AM' }
        ]
    }
];

// --- Components ---

const AccuracySection = () => {
    return (
        <section id="accuracy" className="py-24 relative bg-zinc-950 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Copy Side */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8 sticky top-24"
                    >
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                                Verification logic you can see.
                            </h2>
                            <p className="text-lg text-zinc-400 leading-relaxed font-light">
                                Revenue data is too important for black boxes. Inspect the lineage of every cent, from API response to bank settlement.
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

                        <div className="pt-8 border-t border-zinc-900">
                             <div className="flex items-center gap-3 text-sm text-zinc-500 font-mono">
                                <div className="flex -space-x-2">
                                     <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px]">YT</div>
                                     <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px]">S</div>
                                     <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px]">+20</div>
                                </div>
                                <span>Ingesting from 20+ platforms & custom APIs</span>
                             </div>
                        </div>
                    </motion.div>

                    {/* Interactive Widget Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full"
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
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-zinc-700 transition-colors">
            <Icon className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
            <h3 className="text-white font-medium mb-1 text-base">{title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ProofWidget = () => {
    const [filterMismatches, setFilterMismatches] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredEvents = filterMismatches
        ? EVENTS.filter(e => e.status !== 'matched')
        : EVENTS;

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Widget Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 animate-pulse"></div>
                    <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">Live Proof Mode</span>
                </div>
                <div className="flex items-center gap-3">
                    <label className="text-xs text-zinc-400 cursor-pointer select-none flex items-center gap-2 hover:text-white transition-colors">
                        Show only mismatches
                        <button
                            role="switch"
                            aria-checked={filterMismatches}
                            onClick={() => setFilterMismatches(!filterMismatches)}
                            className={`w-8 h-4 rounded-full relative transition-colors ${filterMismatches ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                        >
                            <motion.div
                                layout
                                className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5"
                                animate={{ x: filterMismatches ? 16 : 0 }}
                            />
                        </button>
                    </label>
                </div>
            </div>

            {/* Event List */}
            <div className="bg-zinc-950/30 min-h-[400px]">
                <LayoutGroup>
                    <motion.div layout className="divide-y divide-zinc-800/50">
                        <AnimatePresence mode="popLayout">
                            {filteredEvents.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    isExpanded={expandedId === event.id}
                                    onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </LayoutGroup>

                {filteredEvents.length === 0 && (
                    <div className="p-12 text-center text-zinc-500 text-sm">
                        No mismatches found. System reconciled.
                    </div>
                )}
            </div>
        </div>
    );
};

const EventRow = ({ event, isExpanded, onToggle }: { event: RevenueEvent, isExpanded: boolean, onToggle: () => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`group transition-colors ${isExpanded ? 'bg-zinc-900/80' : 'hover:bg-zinc-900/40'}`}
        >
            {/* Row Content */}
            <div
                onClick={onToggle}
                className="p-4 grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1.5fr_1fr_auto] gap-4 items-center cursor-pointer relative"
            >
                 {/* Mobile/Desktop Source & Amount */}
                <div className="min-w-0">
                    <div className="font-medium text-white truncate">{event.source}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5 md:hidden">{event.amount}</div>
                    <div className="text-xs text-zinc-500 mt-1 hidden md:block">{event.date}</div>
                </div>

                {/* Amount (Desktop) */}
                <div className="hidden md:block font-mono text-zinc-300 text-right md:text-left">
                    {event.amount}
                </div>

                {/* Status & Confidence */}
                <div className="flex flex-col items-end md:items-start gap-1">
                    <StatusChip status={event.status} />
                    <ConfidenceMeter value={event.confidence} />
                </div>

                {/* Expand Button */}
                <button
                    className={`p-2 rounded-full hover:bg-zinc-800 text-zinc-500 transition-all ${isExpanded ? 'rotate-90 text-white bg-zinc-800' : ''}`}
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
                        className="overflow-hidden border-t border-zinc-800/50 bg-zinc-950/50"
                    >
                        <div className="p-4 md:p-6">
                            <ProofDrawer event={event} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const StatusChip = ({ status }: { status: EventStatus }) => {
    const config = {
        matched: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Match' },
        review: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Review' },
        flagged: { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', label: 'Flagged' },
    };
    const c = config[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wide ${c.color}`}>
            {c.label}
        </span>
    );
};

const ConfidenceMeter = ({ value }: { value: number }) => {
    // Determine color based on value
    const colorClass = value > 90 ? 'bg-emerald-500' : value > 50 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="flex items-center gap-2 w-24">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${colorClass}`}
                />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono w-6 text-right">{value}%</span>
        </div>
    );
};

const ProofDrawer = ({ event }: { event: RevenueEvent }) => {
    const [activeTab, setActiveTab] = useState<'trace' | 'explain' | 'resolve'>('trace');
    const [resolvedState, setResolvedState] = useState<'none' | 'confirmed' | 'flagged'>('none');

    const tabs = [
        { id: 'trace', label: 'Trace', icon: Link },
        { id: 'explain', label: 'Explain', icon: FileText },
        { id: 'resolve', label: 'Resolve', icon: ShieldCheck },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-emerald-500 text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[120px]">
                {activeTab === 'trace' && (
                    <div className="space-y-4">
                        {event.trace.map((node, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 relative"
                            >
                                <div className="z-10 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                {i < event.trace.length - 1 && (
                                    <div className="absolute left-[3.5px] top-2 bottom-[-18px] w-[1px] bg-zinc-800"></div>
                                )}
                                <div className="flex-1 flex justify-between items-center p-2 rounded hover:bg-zinc-900/50 transition-colors">
                                    <span className="text-sm text-zinc-300">{node.step}</span>
                                    <span className="text-xs font-mono text-zinc-600">{node.time}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === 'explain' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <div className="p-3 rounded bg-zinc-900/50 border border-zinc-800">
                            <h4 className="text-xs font-mono text-zinc-500 uppercase mb-2">System Reasoning</h4>
                            <p className="text-sm text-zinc-300 leading-relaxed">{event.explanation}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-mono text-zinc-500 uppercase mb-2">Change Log</h4>
                            <ul className="space-y-2">
                                {event.changelog.map((log, i) => (
                                    <li key={i} className="flex justify-between text-xs text-zinc-400 border-b border-zinc-800/50 pb-1 last:border-0">
                                        <span>{log.action}</span>
                                        <span className="font-mono">{log.time}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'resolve' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-4"
                    >
                        {resolvedState === 'none' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-zinc-400">
                                    Action required. Select a resolution path to update the ledger.
                                </p>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => setResolvedState('confirmed')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Confirm Match
                                    </Button>
                                    <Button
                                        onClick={() => setResolvedState('flagged')}
                                        variant="outline"
                                        className="border-rose-900/50 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 flex-1"
                                    >
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Flag Issue
                                    </Button>
                                </div>
                            </div>
                        ) : resolvedState === 'confirmed' ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center justify-center py-6 text-emerald-500"
                            >
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                    <Check className="w-6 h-6" />
                                </div>
                                <p className="font-medium">Transaction Locked</p>
                                <button onClick={() => setResolvedState('none')} className="text-xs text-zinc-500 mt-2 hover:text-white underline">Undo</button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ x: 5, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="space-y-3"
                            >
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400">Reason for flag</label>
                                    <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-rose-500 outline-none">
                                        <option>Duplicate Transaction</option>
                                        <option>Incorrect Amount</option>
                                        <option>Fraud Suspicion</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400">Notes</label>
                                    <textarea
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white h-20 focus:ring-1 focus:ring-rose-500 outline-none resize-none"
                                        placeholder="Add context..."
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setResolvedState('none')} className="text-zinc-400">Cancel</Button>
                                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700">Submit Flag</Button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AccuracySection;
