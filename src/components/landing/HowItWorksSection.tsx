import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
    RefreshCw,
    TrendingUp,
    CreditCard,
    Youtube,
    DollarSign,
    CheckCircle2,
    Landmark,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types & Data ---

type Platform = {
    id: string;
    name: string;
    color: string;
    icon: React.ElementType;
    orbit: { x: number; y: number; rotate: number; delay: number };
    payout: string;
    insight: string;
};

const PLATFORMS: Platform[] = [
    {
        id: 'yt',
        name: 'YouTube',
        color: 'bg-red-600',
        icon: Youtube,
        orbit: { x: -180, y: -60, rotate: -15, delay: 0 },
        payout: '$8,432.10',
        insight: 'Delayed 18 days'
    },
    {
        id: 'pat',
        name: 'Patreon',
        color: 'bg-orange-500',
        icon: DollarSign,
        orbit: { x: 160, y: 80, rotate: 10, delay: 0.1 },
        payout: '$3,890.55',
        insight: '8% Platform Fee'
    },
    {
        id: 'str',
        name: 'Stripe',
        color: 'bg-indigo-500',
        icon: CreditCard,
        orbit: { x: -80, y: 140, rotate: -5, delay: 0.2 },
        payout: '$1,250.00',
        insight: 'Net Match'
    },
    {
        id: 'gum',
        name: 'Gumroad',
        color: 'bg-pink-500',
        icon: DollarSign,
        orbit: { x: 120, y: -100, rotate: 12, delay: 0.15 },
        payout: '$420.69',
        insight: 'Instant Settle'
    },
    {
        id: 'twt',
        name: 'Twitch',
        color: 'bg-purple-600',
        icon: Youtube,
        orbit: { x: -140, y: 50, rotate: -20, delay: 0.05 },
        payout: '$950.00',
        insight: 'Pending'
    },
    {
        id: 'sub',
        name: 'Substack',
        color: 'bg-orange-600',
        icon: FileTextIcon,
        orbit: { x: 60, y: 160, rotate: 8, delay: 0.25 },
        payout: '$2,100.00',
        insight: 'Cleared'
    }
];

function FileTextIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    )
}

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-24 bg-zinc-950 relative overflow-hidden" aria-label="How Zerithum Works">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Centered Header for Impact */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight"
                    >
                        Revenue, reality checked.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-xl text-zinc-400 font-light"
                    >
                        Stop guessing. We verify every single payout against your actual bank wire.
                    </motion.p>
                </div>

                {/* Interactive Widget - Centered & Focused */}
                <div className="max-w-4xl mx-auto">
                    <FlowTimelineWidget />
                </div>

                {/* Supporting Points - Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 max-w-4xl mx-auto">
                     <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex gap-4 items-start p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
                     >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-1 text-lg">True Cash Position</h3>
                            <p className="text-zinc-500 leading-relaxed">Know exactly what hit the bank, ignoring platform "estimated" earnings that haven't settled.</p>
                        </div>
                     </motion.div>

                     <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex gap-4 items-start p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
                     >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-1 text-lg">Audit-Grade Trace</h3>
                            <p className="text-zinc-500 leading-relaxed">Every dollar is traced from click to deposit. If the IRS asks, you have the receipts.</p>
                        </div>
                     </motion.div>
                </div>

            </div>
        </section>
    );
};

const FlowTimelineWidget = () => {
    // States: 'orbit' -> 'snap' -> 'unified' -> 'bank' -> 'reset'
    const [phase, setPhase] = useState<'orbit' | 'snap' | 'unified' | 'bank' | 'reset'>('orbit');
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.5, once: true });
    const shouldReduceMotion = useReducedMotion();

    // Auto-Loop Logic
    useEffect(() => {
        if (!isInView || isHovered) return;

        let timeout: NodeJS.Timeout;

        const runLoop = () => {
            if (phase === 'orbit') {
                timeout = setTimeout(() => setPhase('snap'), 2000);
            } else if (phase === 'snap') {
                timeout = setTimeout(() => setPhase('unified'), 400); // Fast snap
            } else if (phase === 'unified') {
                timeout = setTimeout(() => setPhase('bank'), 2000); // Hold unified
            } else if (phase === 'bank') {
                timeout = setTimeout(() => setPhase('reset'), 2500); // Show bank layer
            } else if (phase === 'reset') {
                timeout = setTimeout(() => setPhase('orbit'), 100); // Quick reset
            }
        };

        runLoop();
        return () => clearTimeout(timeout);
    }, [phase, isInView, isHovered]);

    // Reduced Motion Override
    useEffect(() => {
        if (shouldReduceMotion && isInView) {
            setPhase('bank');
        }
    }, [shouldReduceMotion, isInView]);

    const handleInteraction = () => {
        setIsHovered(true);
        if (phase === 'orbit' || phase === 'reset') {
            setPhase('snap');
            setTimeout(() => setPhase('unified'), 400);
        }
    };

    return (
        <div className="relative w-full group" ref={containerRef} onMouseEnter={handleInteraction} onTouchStart={handleInteraction} onMouseLeave={() => setIsHovered(false)}>

            {/* Status Indicator */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                 <div className={cn("text-[10px] font-mono uppercase tracking-widest transition-colors", isHovered ? "text-emerald-400" : "text-zinc-600")}>
                    {isHovered ? "Manual Control" : "Auto-Cycle"}
                 </div>
                 <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isHovered ? "bg-emerald-500 animate-pulse" : "bg-zinc-700")} />
            </div>

            {/* Stage */}
            <div
                className="relative h-[400px] w-full bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl"
                role="region"
                aria-label="Revenue Unification Simulation"
            >
                {/* Background Grid - Radial */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950 opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="absolute inset-0 flex items-center justify-center">

                    {/* --- CENTRAL DASHBOARD (Always there, but ghosted initially) --- */}
                    <motion.div
                        initial={{ opacity: 0.2, scale: 0.9, filter: "grayscale(100%)" }}
                        animate={{
                            opacity: (phase === 'unified' || phase === 'bank') ? 1 : 0.2,
                            scale: (phase === 'unified' || phase === 'bank') ? 1 : 0.9,
                            filter: (phase === 'unified' || phase === 'bank') ? "grayscale(0%)" : "grayscale(100%)"
                        }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="relative w-[340px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                             <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                             </div>
                             <div className="h-2 w-16 bg-zinc-800 rounded-full" />
                        </div>
                        {/* Content */}
                        <div className="p-4 space-y-4">
                             <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Total Balance</div>
                                    <div className="text-2xl font-bold text-white tracking-tight">$17,043.34</div>
                                </div>
                                <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded text-emerald-500 text-xs font-medium border border-emerald-500/20">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+12%</span>
                                </div>
                             </div>

                             {/* Rows */}
                             <div className="space-y-2 pt-2">
                                {PLATFORMS.slice(0, 3).map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + (i * 0.1) }} // Stagger internal items
                                        className="h-10 w-full bg-zinc-800/50 rounded border border-zinc-700/50 flex items-center px-3 justify-between group/row relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 relative z-10">
                                            <div className={cn("w-4 h-4 rounded-sm flex items-center justify-center text-[8px] text-white", p.color)}>
                                                <p.icon className="w-2.5 h-2.5" />
                                            </div>
                                            <span className="text-xs text-zinc-300 font-medium">{p.name}</span>
                                        </div>

                                        <div className="flex items-center gap-3 relative z-10">
                                            {/* Insight Badge (Visible on Unified) */}
                                            <div className="hidden sm:flex items-center px-1.5 py-0.5 rounded-sm bg-zinc-700/50 text-[9px] text-zinc-400 border border-zinc-700">
                                                {p.insight}
                                            </div>
                                            <span className="text-xs font-mono text-white">{p.payout}</span>
                                        </div>
                                    </motion.div>
                                ))}
                             </div>
                        </div>

                        {/* --- BANK OVERLAY --- */}
                        <AnimatePresence>
                            {phase === 'bank' && (
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-emerald-400"
                                >
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 ring-1 ring-emerald-500/50">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="font-bold text-lg tracking-tight">VERIFIED</div>
                                    <div className="text-xs font-mono opacity-70 mt-1">Match: 100%</div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* --- ORBITING PLATFORMS --- */}
                    <AnimatePresence>
                        {(phase === 'orbit' || phase === 'reset') && (
                            <div className="absolute inset-0 pointer-events-none">
                                {PLATFORMS.map((platform, i) => (
                                    <motion.div
                                        key={platform.id}
                                        initial={{
                                            x: platform.orbit.x * 1.5, // Start further out
                                            y: platform.orbit.y * 1.5,
                                            opacity: 0,
                                            scale: 0.5
                                        }}
                                        animate={{
                                            x: platform.orbit.x,
                                            y: platform.orbit.y,
                                            opacity: 1,
                                            scale: 1,
                                            rotate: platform.orbit.rotate
                                        }}
                                        exit={{
                                            x: 0,
                                            y: 0,
                                            scale: 0.2,
                                            opacity: 0,
                                            transition: { duration: 0.3, ease: "backIn" } // Snap in effect
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 10,
                                            delay: i * 0.05
                                        }}
                                        className="absolute top-1/2 left-1/2"
                                        style={{ marginLeft: -32, marginTop: -20 }} // Center anchor
                                    >
                                        <div className={cn(
                                            "w-16 h-10 rounded-lg shadow-lg flex items-center justify-center border border-white/10 backdrop-blur-md",
                                            "bg-zinc-900/80"
                                        )}>
                                            <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white", platform.color)}>
                                                <platform.icon className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {/* Central Gravity Pull Effect */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-dashed border-zinc-800 animate-[spin_10s_linear_infinite] opacity-20" />
                            </div>
                        )}
                    </AnimatePresence>

                    {/* --- SNAP LINES EFFECT --- */}
                    <AnimatePresence>
                        {phase === 'snap' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {PLATFORMS.map((platform, i) => (
                                    <motion.div
                                        key={`line-${platform.id}`}
                                        initial={{ opacity: 0, pathLength: 0 }}
                                        animate={{ opacity: 1, pathLength: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                                    >
                                       {/* Simulated Line via CSS/Div for simplicity and performance */}
                                       <motion.div
                                           initial={{
                                               width: 0,
                                               height: 2,
                                               x: platform.orbit.x,
                                               y: platform.orbit.y,
                                               rotate: Math.atan2(-platform.orbit.y, -platform.orbit.x) * (180 / Math.PI)
                                           }}
                                           animate={{ width: 100, opacity: 0 }} // Flash line
                                           transition={{ duration: 0.2 }}
                                           className="absolute bg-emerald-500 shadow-[0_0_10px_#10b981] origin-left"
                                       />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* Control Bar */}
            <div className="flex justify-center mt-6 gap-4">
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setPhase('reset'); setTimeout(() => setPhase('orbit'), 50); }}
                    className="border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white hover:bg-zinc-900"
                 >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                 </Button>
            </div>
        </div>
    );
};

export default HowItWorksSection;
