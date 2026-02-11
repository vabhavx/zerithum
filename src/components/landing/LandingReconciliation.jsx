import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
    Youtube,
    Twitch,
    CreditCard,
    ShoppingBag,
    Users,
    Globe,
    Music,
    Layers,
    Webhook,
    CheckCircle2,
    Activity,
    Terminal
} from 'lucide-react';

const sources = [
    {
        id: 'youtube',
        name: 'YouTube',
        icon: Youtube,
        color: '#FF0000',
        total: 16450.00,
        type: 'AdSense & Memberships',
        details: [
            { label: 'Video: "My Studio Setup 2024"', amount: 4200.50, date: 'Oct 12' },
            { label: 'Video: "Day in the Life"', amount: 7150.25, date: 'Oct 15' },
            { label: 'Channel Memberships (Silver)', amount: 5099.25, date: 'Oct 01-30' }
        ]
    },
    {
        id: 'stripe',
        name: 'Stripe',
        icon: CreditCard,
        color: '#635BFF',
        total: 12800.00,
        type: 'Direct Payments',
        details: [
            { label: 'Sponsorship Invoice #1024 (TechCorp)', amount: 8000.00, date: 'Oct 22' },
            { label: 'Digital Product: "Creator Bundle"', amount: 3500.00, date: 'Oct 18' },
            { label: 'Consulting Session (1hr)', amount: 1300.00, date: 'Oct 25' }
        ]
    },
    {
        id: 'patreon',
        name: 'Patreon',
        icon: Users,
        color: '#FF424D',
        total: 5200.00,
        type: 'Subscriptions',
        details: [
            { label: 'Tier: "Inner Circle" (52 subs)', amount: 2600.00, date: 'Oct 01' },
            { label: 'Tier: "Supporter" (260 subs)', amount: 1300.00, date: 'Oct 01' },
            { label: 'Merch Drop Revenue', amount: 1300.00, date: 'Oct 10' }
        ]
    },
    {
        id: 'gumroad',
        name: 'Gumroad',
        icon: ShoppingBag,
        color: '#36a9ae',
        total: 3100.50,
        type: 'Digital Goods',
        details: [
            { label: 'Product: "LUTS Pack v2"', amount: 1550.25, date: 'Oct 05' },
            { label: 'Product: "Notion Template"', amount: 1550.25, date: 'Oct 20' }
        ]
    },
    {
        id: 'twitch',
        name: 'Twitch',
        icon: Twitch,
        color: '#9146FF',
        total: 2800.00,
        type: 'Streaming',
        details: [
            { label: 'Sub Revenue (Tier 1)', amount: 1400.00, date: 'Oct 01-30' },
            { label: 'Bits / Cheers', amount: 800.00, date: 'Oct 15' },
            { label: 'Ad Revenue', amount: 600.00, date: 'Oct 30' }
        ]
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: Music,
        color: '#00F2EA',
        total: 1200.00,
        type: 'Creator Fund',
        details: [
            { label: 'Viral Clip: "Wait for it..."', amount: 850.00, date: 'Oct 11' },
            { label: 'Live Gift Revenue', amount: 350.00, date: 'Oct 14' }
        ]
    },
    {
        id: 'integrations',
        name: '20+ Integrations',
        icon: Layers,
        color: '#f59e0b',
        total: 15000.00,
        type: 'Ecosystem',
        details: [
            { label: 'Substack Newsletter', amount: 8000.00, date: 'Oct 01' },
            { label: 'Kofi Donations', amount: 2500.00, date: 'Oct 12' },
            { label: 'Shopify Store', amount: 4500.00, date: 'Oct 15' }
        ]
    },
     {
        id: 'custom',
        name: 'Connect Custom / API',
        icon: Webhook,
        color: '#10b981',
        total: 4500.00,
        type: 'Universal Adapter',
        details: [
            { label: 'Legacy Shop System', amount: 3000.00, date: 'Oct 02' },
            { label: 'Private Coaching Wire', amount: 1500.00, date: 'Oct 28' }
        ]
    }
];

// Generate a unified list of transactions for the "Dashboard" view
const allTransactions = sources.flatMap(source =>
    source.details.map((detail, idx) => ({
        ...detail,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
        sourceIcon: source.icon,
        id: `${source.id}-${idx}`
    }))
).sort((a, b) => {
    // Simple sort simulation based on label length to mix them up a bit visually
    return a.label.length - b.label.length;
});

export default function LandingReconciliation({ isActive = true }) {
    const [activeSource, setActiveSource] = useState(sources[0]);
    const [isHovering, setIsHovering] = useState(false);

    // We'll show a subset of "recent" transactions in the dashboard view
    // The active source's transactions will be highlighted and brought to the top
    const dashboardView = React.useMemo(() => {
        const activeTx = allTransactions.filter(tx => tx.sourceId === activeSource.id);
        const otherTx = allTransactions.filter(tx => tx.sourceId !== activeSource.id).slice(0, 3); // Show 3 others for context
        return [...activeTx, ...otherTx];
    }, [activeSource]);

    // Auto-rotate through sources if not hovering
    useEffect(() => {
        if (isHovering || !isActive) return;

        const interval = setInterval(() => {
            setActiveSource((current) => {
                const currentIndex = sources.findIndex(s => s.id === current.id);
                return sources[(currentIndex + 1) % sources.length];
            });
        }, 3500);

        return () => clearInterval(interval);
    }, [isHovering, isActive]);

    return (
        <div className="w-full max-w-7xl px-4 flex flex-col items-center">

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-neutral-950/80 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden shadow-2xl relative min-h-[700px] lg:min-h-[600px]">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* LEFT COLUMN: Sources List - Mobile: Horizontal Scroll, Desktop: Vertical List */}
                <div className="col-span-1 lg:col-span-3 z-10 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 bg-black/20 p-4 lg:p-6 order-1">
                    <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Input Sources
                    </h3>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide snap-x snap-mandatory">
                        {sources.map((source) => (
                            <button
                                key={source.id}
                                onClick={() => setActiveSource(source)} // Add explicit click handler for mobile
                                onMouseEnter={() => {
                                    setIsHovering(true);
                                    setActiveSource(source);
                                }}
                                onMouseLeave={() => setIsHovering(false)}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-md transition-all duration-300 text-left relative overflow-hidden group z-10 flex-shrink-0 w-36 lg:w-full snap-start border border-transparent",
                                    activeSource.id === source.id
                                        ? "bg-white/10 text-white border-white/10"
                                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    activeSource.id === source.id ? "bg-black/40 text-white" : "bg-white/5 text-neutral-600 group-hover:text-neutral-400"
                                )}>
                                    <source.icon className="w-3.5 h-3.5" style={{ color: activeSource.id === source.id ? source.color : undefined }} />
                                </div>
                                <span className="text-[11px] font-mono truncate">{source.name}</span>

                                {activeSource.id === source.id && (
                                    <motion.div layoutId="active-indicator" className="w-0.5 h-full absolute left-0 top-0 bg-emerald-500 shadow-[0_0_10px_#10b981] hidden lg:block" />
                                )}
                                {/* Mobile indicator at bottom */}
                                {activeSource.id === source.id && (
                                    <motion.div layoutId="active-indicator-mobile" className="h-0.5 w-full absolute bottom-0 left-0 bg-emerald-500 shadow-[0_0_10px_#10b981] lg:hidden" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CENTER COLUMN: Processing Animation - Hidden/Compressed on Mobile */}
                <div className="col-span-1 lg:col-span-4 z-10 flex flex-col items-center justify-center relative py-6 lg:py-0 overflow-hidden bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 order-2 h-24 lg:h-auto">

                    {/* Connecting Lines Context */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                         <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block"></div>
                    </div>

                    {/* Data Packets Moving Left -> Right */}
                    {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={`packet-${i}-${activeSource.id}`}
                                    className="absolute h-[2px] bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                    initial={{ x: -150, opacity: 0, width: 20 }}
                                    animate={{
                                        x: 150,
                                        opacity: [0, 1, 0],
                                        width: [20, 60, 20]
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "linear"
                                    }}
                                    style={{
                                        top: '50%',
                                        marginTop: (i % 2 === 0 ? -1 : 1) * (i * 10)
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Central Core Node - Smaller on Mobile */}
                    <div className="relative group z-20 scale-75 lg:scale-100">
                        <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border border-emerald-500/30 bg-black flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                             <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-[spin_4s_linear_infinite]"></div>
                             <div className="absolute inset-2 rounded-full border-t border-emerald-500 animate-[spin_2s_linear_infinite]"></div>

                             <Activity className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-500 animate-pulse" />
                        </div>

                        {/* Text under core - Hidden on very small screens, visible on desktop */}
                        <div className="absolute top-20 lg:top-28 left-1/2 -translate-x-1/2 text-center w-40 hidden sm:block">
                             <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse mb-1">Processing Stream</div>
                             <div className="text-[10px] text-neutral-400 font-mono">Normalization: Active</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: The Unified Dashboard - Full Width on Mobile */}
                <div className="col-span-1 lg:col-span-5 z-20 flex flex-col bg-neutral-900 lg:border-l border-white/10 relative order-3 min-h-[400px]">

                    {/* Dashboard Header Chrome */}
                    <div className="h-10 border-b border-white/5 bg-black/40 flex items-center justify-between px-4 sticky top-0 z-30 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                             <Terminal className="w-3 h-3 text-neutral-500" />
                             <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Main_View</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[9px] font-mono text-emerald-500 uppercase">Live Connection</span>
                        </div>
                    </div>

                    {/* Dashboard Content Area */}
                    <div className="flex-1 p-4 lg:p-6 relative overflow-hidden flex flex-col">

                        {/* Total Balance / Key Metric Area */}
                         <div className="mb-6 p-4 border border-white/5 bg-white/5 rounded-lg flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Total Balance (Unified)</div>
                                <div className="text-xl lg:text-2xl font-mono text-white tracking-tight">$45,200.00</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-mono text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded">+12% vs last month</div>
                            </div>
                         </div>

                        <div className="flex-1 space-y-2 relative">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-mono text-neutral-600 uppercase">Recent Transactions</span>
                                <span className="text-[10px] font-mono text-neutral-600 uppercase">Filter: All Sources</span>
                            </div>

                            <div className="relative">
                                <AnimatePresence mode="popLayout">
                                    {dashboardView.map((tx) => {
                                        const isActive = tx.sourceId === activeSource.id;
                                        return (
                                            <motion.div
                                                // Removed 'layout' prop for better scroll performance during source switching
                                                key={tx.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{
                                                    opacity: isActive ? 1 : 0.4,
                                                    x: 0,
                                                    scale: isActive ? 1 : 0.98,
                                                    backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0)"
                                                }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.2 }}
                                                className={cn(
                                                    "flex justify-between items-center p-2.5 rounded border mb-2",
                                                    isActive ? "border-white/10 shadow-lg" : "border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={cn(
                                                        "p-1.5 rounded flex-shrink-0",
                                                        isActive ? "bg-black text-white" : "bg-white/5 text-neutral-500"
                                                    )}>
                                                        <tx.sourceIcon className="w-3 h-3" style={{ color: isActive ? tx.sourceColor : undefined }} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn("text-[11px] font-medium truncate block", isActive ? "text-white" : "text-neutral-500")}>
                                                            {tx.label}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-neutral-600 truncate">{tx.date} • {tx.sourceName}</span>
                                                    </div>
                                                </div>
                                                <span className={cn("text-[11px] font-mono ml-2 flex-shrink-0", isActive ? "text-white" : "text-neutral-600")}>
                                                    ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                         {/* Bottom status bar in dashboard */}
                         <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                            <div className="text-[9px] font-mono text-neutral-600 uppercase truncate mr-2">
                                Syncing: <span className="text-white">{activeSource.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Reconciled</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Metadata - Outside the main container */}
            <div className="w-full max-w-7xl mt-4 px-4 flex flex-col sm:flex-row justify-between text-[9px] font-mono text-neutral-600 uppercase tracking-wider opacity-60 gap-2 sm:gap-0 text-center sm:text-left">
                <div className="flex gap-4 sm:gap-6 justify-center sm:justify-start">
                    <span>System Status: <span className="text-emerald-500">Operational</span></span>
                    <span>Uptime: <span className="text-neutral-400">99.99%</span></span>
                </div>
                <div>
                    Zerithum V2.4.0 // Secure Connection
                </div>
            </div>

            <div className="mt-12 text-center px-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Unified Data Structure</h2>
                <p className="text-neutral-400 max-w-md mx-auto text-base sm:text-lg font-light">
                    One dashboard for everything. We normalize, categorize, and verify every transaction from every source in real-time.
                </p>
            </div>
        </div>
    );
}
