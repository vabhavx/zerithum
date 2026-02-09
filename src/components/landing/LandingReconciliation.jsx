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
    Store,
    Layers,
    Webhook,
    CheckCircle2
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

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-950/80 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden shadow-2xl p-6 lg:p-10 relative min-h-[600px]">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* LEFT COLUMN: Sources */}
                <div className="lg:col-span-4 z-10 flex flex-col justify-center gap-3 relative">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                        <Globe className="w-3 h-3" /> Input Sources
                    </h3>
                    <div className="grid grid-cols-1 gap-2 relative">
                        {/* Connecting Line from active source to center */}
                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/5 hidden lg:block" />

                        {sources.map((source) => (
                            <button
                                key={source.id}
                                onMouseEnter={() => {
                                    setIsHovering(true);
                                    setActiveSource(source);
                                }}
                                onMouseLeave={() => setIsHovering(false)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 text-left relative overflow-hidden group z-10",
                                    activeSource.id === source.id
                                        ? "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] translate-x-2"
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
                                    <motion.div layoutId="active-indicator" className="w-1 h-full absolute left-0 top-0 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CENTER COLUMN: Processing Animation */}
                <div className="lg:col-span-3 z-10 flex flex-col items-center justify-center relative py-10 lg:py-0 overflow-hidden">

                    {/* Data Flow Particles */}
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSource.id}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            {/* Particles flowing from Left to Center */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-32"
                                    initial={{ x: -200, opacity: 0, scaleX: 0.2 }}
                                    animate={{
                                        x: 0,
                                        opacity: [0, 1, 0],
                                        scaleX: [0.2, 1, 0.2]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        top: `${40 + (i * 3) + (Math.random() * 10 - 5)}%`,
                                        filter: 'blur(0.5px)'
                                    }}
                                />
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Central Core Node */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border border-white/10 bg-black flex items-center justify-center relative z-10 shadow-[0_0_60px_rgba(16,185,129,0.15)] transition-shadow duration-500 group-hover:shadow-[0_0_80px_rgba(16,185,129,0.25)]">
                             <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-[spin_12s_linear_infinite]"></div>
                             <div className="absolute inset-4 rounded-full border border-emerald-500/10 animate-[spin_8s_linear_infinite_reverse]"></div>

                             {/* Core Pulse */}
                             <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_#10b981]"></div>

                             {/* Consolidation Rings */}
                             <div className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                        </div>

                        {/* Connecting Lines */}
                        <div className="absolute top-1/2 left-[-100px] w-[100px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10"></div>
                        <div className="absolute top-1/2 right-[-100px] w-[100px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10"></div>
                    </div>

                    <div className="mt-8 text-center relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-gradient-to-b from-white/10 to-transparent"></div>
                        <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse">Consolidating</div>
                        <div className="text-xs text-white font-medium mt-1">Zerithum Core</div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Financial Story */}
                <div className="lg:col-span-5 z-10 flex flex-col justify-center pl-0 lg:pl-6 relative">
                    {/* Connecting Line from Center */}
                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/5 hidden lg:block" />

                    <div className="h-full border border-white/10 bg-black/40 rounded-lg p-6 flex flex-col relative overflow-hidden backdrop-blur-sm">
                        {/* Dashboard Header UI */}
                        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Live Dashboard</span>
                            </div>
                            <div className="text-[10px] font-mono text-neutral-600">ID: {activeSource.id.toUpperCase()}-882</div>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Source Stream</div>
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
                                    className="text-xl font-mono text-emerald-400 tabular-nums"
                                >
                                    ${activeSource.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </motion.div>
                            </div>
                        </div>

                        {/* Detailed "Financial Story" List */}
                        <div className="flex-1 space-y-3 relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-mono text-neutral-600 uppercase">Transaction Layer</span>
                                <span className="text-[10px] font-mono text-neutral-700 uppercase">Auto-Tagging Active</span>
                            </div>

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
                                            className="flex justify-between items-center p-3 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/item"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover/item:bg-white transition-colors"></span>
                                                    <span className="text-xs text-neutral-300 font-medium">{item.label}</span>
                                                </div>
                                                <span className="text-[10px] text-neutral-600 font-mono pl-3">{item.date}</span>
                                            </div>
                                            <span className="text-xs font-mono text-white tabular-nums">
                                                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {/* Enhanced Verified Badge */}
                            <motion.div
                                key={activeSource.id + 'verified'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Footer Status Bar */}
                <div className="col-span-12 mt-6 pt-6 border-t border-white/5 flex justify-between text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
                    <div className="flex gap-6">
                        <span>Status: <span className="text-emerald-500">Online</span></span>
                        <span>Latency: <span className="text-neutral-400">24ms</span></span>
                        <span>Sync Rate: <span className="text-neutral-400">99.9%</span></span>
                    </div>
                    <div>
                        System Version 2.4.0
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
