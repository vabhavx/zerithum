import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
    Youtube,
    Twitch,
    CreditCard,
    ShoppingBag,
    DollarSign,
    Video,
    Users,
    Globe,
    Database,
    ArrowRight,
    Play,
    Music,
    Store
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
        id: 'custom',
        name: 'Custom API',
        icon: Database,
        color: '#10b981',
        total: 4500.00,
        type: 'External Source',
        details: [
            { label: 'Shopify Store (via API)', amount: 3000.00, date: 'Oct 02' },
            { label: 'Direct Wire (Client X)', amount: 1500.00, date: 'Oct 28' }
        ]
    }
];

export default function LandingReconciliation() {
    const [activeSource, setActiveSource] = useState(sources[0]);
    const [isHovering, setIsHovering] = useState(false);

    // Auto-rotate through sources if not hovering
    useEffect(() => {
        if (isHovering) return;

        const interval = setInterval(() => {
            setActiveSource((current) => {
                const currentIndex = sources.findIndex(s => s.id === current.id);
                return sources[(currentIndex + 1) % sources.length];
            });
        }, 4000); // 4 seconds per source

        return () => clearInterval(interval);
    }, [isHovering]);

    return (
        <div className="w-full max-w-6xl px-4 flex flex-col items-center">

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-950/80 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden shadow-2xl p-6 lg:p-10 relative min-h-[500px]">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* LEFT COLUMN: Sources */}
                <div className="lg:col-span-4 z-10 flex flex-col justify-center gap-3">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Connected Platforms
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {sources.map((source) => (
                            <button
                                key={source.id}
                                onMouseEnter={() => {
                                    setIsHovering(true);
                                    setActiveSource(source);
                                }}
                                onMouseLeave={() => setIsHovering(false)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 text-left relative overflow-hidden group",
                                    activeSource.id === source.id
                                        ? "bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                        : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-neutral-500"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-md transition-colors",
                                    activeSource.id === source.id ? "bg-black/40 text-white" : "bg-white/5 text-neutral-400 group-hover:text-neutral-200"
                                )}>
                                    <source.icon className="w-4 h-4" style={{ color: activeSource.id === source.id ? source.color : undefined }} />
                                </div>
                                <div className="flex-1">
                                    <div className={cn("text-xs font-medium font-mono transition-colors", activeSource.id === source.id ? "text-white" : "text-neutral-400")}>
                                        {source.name}
                                    </div>
                                    {activeSource.id === source.id && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[10px] text-neutral-400"
                                        >
                                            {source.type}
                                        </motion.div>
                                    )}
                                </div>
                                {activeSource.id === source.id && (
                                    <motion.div layoutId="active-indicator" className="w-1 h-full absolute left-0 top-0 bg-emerald-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CENTER COLUMN: Processing Animation */}
                <div className="lg:col-span-3 z-10 flex flex-col items-center justify-center relative py-10 lg:py-0">

                    {/* Data Flow Particles */}
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSource.id}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            {/* Particles flowing Right */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-24"
                                    initial={{ x: -150, opacity: 0, scaleX: 0.5 }}
                                    animate={{
                                        x: 150,
                                        opacity: [0, 1, 0],
                                        scaleX: [0.5, 1.5, 0.5]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "linear"
                                    }}
                                    style={{ top: `${45 + (i * 5)}%` }}
                                />
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Central Core Node */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border border-white/10 bg-black flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                             <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-[spin_10s_linear_infinite]"></div>
                             <div className="absolute inset-2 rounded-full border border-emerald-500/10 animate-[spin_7s_linear_infinite_reverse]"></div>
                             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
                        </div>
                        {/* Connecting Lines */}
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10"></div>
                        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent -z-10"></div>
                    </div>

                    <div className="mt-6 text-center">
                        <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse">Processing Stream</div>
                        <div className="text-[10px] text-neutral-600 font-mono mt-1">Structurally Consolidating...</div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Financial Story */}
                <div className="lg:col-span-5 z-10 flex flex-col justify-center">
                    <div className="h-full border border-white/10 bg-black/40 rounded-lg p-6 flex flex-col relative overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
                            <div>
                                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Source Analysis</div>
                                <motion.div
                                    key={activeSource.name}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xl font-bold text-white flex items-center gap-2"
                                >
                                    <activeSource.icon className="w-5 h-5" style={{ color: activeSource.color }} />
                                    {activeSource.name}
                                </motion.div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Total Ingested</div>
                                <motion.div
                                    key={activeSource.total}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xl font-mono text-emerald-400"
                                >
                                    ${activeSource.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </motion.div>
                            </div>
                        </div>

                        {/* Detailed "Financial Story" List */}
                        <div className="flex-1 space-y-3 relative">
                            <div className="text-[10px] font-mono text-neutral-600 uppercase mb-2">Transaction Breakdown (Layer 2)</div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSource.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-2"
                                >
                                    {activeSource.details.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-300 font-medium">{item.label}</span>
                                                <span className="text-[10px] text-neutral-600 font-mono">{item.date}</span>
                                            </div>
                                            <span className="text-xs font-mono text-white">
                                                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {/* Fictional "Verified" Stamp */}
                            <motion.div
                                key={activeSource.id + 'verified'}
                                initial={{ opacity: 0, scale: 2, rotate: -20 }}
                                animate={{ opacity: 1, scale: 1, rotate: -12 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="absolute bottom-4 right-4 border-2 border-emerald-500/30 text-emerald-500/30 text-xs font-black uppercase px-2 py-1 tracking-widest rounded rotate-[-12deg] pointer-events-none"
                            >
                                Reconciled
                            </motion.div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Unified Data Structure</h2>
                <p className="text-neutral-400 max-w-md mx-auto text-lg font-light">
                    We don't just pull numbers. We reconstruct the financial story behind every transaction, automatically categorizing by video, product, or invoice.
                </p>
            </div>
        </div>
    );
}
