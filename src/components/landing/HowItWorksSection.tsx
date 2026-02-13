import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
    RefreshCw,
    Play,
    ArrowRight,
    TrendingUp,
    CreditCard,
    Youtube,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types & Data ---

type Platform = {
    id: string;
    name: string;
    color: string;
    icon: React.ElementType;
    initialPos: { x: number; y: number; rotate: number };
    payout: string;
    status: 'delayed' | 'fee_heavy' | 'ok';
    insight: string;
};

const PLATFORMS: Platform[] = [
    {
        id: 'yt',
        name: 'YouTube',
        color: 'bg-red-600',
        icon: Youtube,
        initialPos: { x: -120, y: -80, rotate: -6 },
        payout: '$8,432.10',
        status: 'delayed',
        insight: 'YouTube delayed 18 days'
    },
    {
        id: 'pat',
        name: 'Patreon',
        color: 'bg-orange-500',
        icon: DollarSign,
        initialPos: { x: -140, y: 40, rotate: 4 },
        payout: '$3,890.55',
        status: 'fee_heavy',
        insight: 'Patreon fee 8 percent'
    },
    {
        id: 'str',
        name: 'Stripe',
        color: 'bg-indigo-500',
        icon: CreditCard,
        initialPos: { x: -40, y: -100, rotate: -3 },
        payout: '$1,250.00',
        status: 'ok',
        insight: 'Net payout matched'
    },
    {
        id: 'gum',
        name: 'Gumroad',
        color: 'bg-pink-500',
        icon: DollarSign,
        initialPos: { x: -60, y: 80, rotate: 8 },
        payout: '$420.69',
        status: 'ok',
        insight: 'Settled instantly'
    },
    {
        id: 'twt',
        name: 'Twitch',
        color: 'bg-purple-600',
        icon: Youtube,
        initialPos: { x: -160, y: -20, rotate: -12 },
        payout: '$950.00',
        status: 'delayed',
        insight: 'Pending release'
    },
    {
        id: 'sub',
        name: 'Substack',
        color: 'bg-orange-600',
        icon: FileTextIcon,
        initialPos: { x: -20, y: 120, rotate: 5 },
        payout: '$2,100.00',
        status: 'ok',
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

                {/* Header */}
                <div className="max-w-3xl mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                            Revenue, reality checked.
                        </h2>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Platforms report what they owe you. Banks report what you have. We find the missing money.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="flex gap-4 items-start"
                         >
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Stop guessing your runway.</h3>
                                <p className="text-sm text-zinc-500">Know your true cash position by verifying every payout against the bank wire.</p>
                            </div>
                         </motion.div>

                         <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex gap-4 items-start"
                         >
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Audit-proof your income.</h3>
                                <p className="text-sm text-zinc-500">Defend against tax inquiries with a complete lineage from click to deposit.</p>
                            </div>
                         </motion.div>
                    </div>
                </div>

                {/* Interactive Widget */}
                <FlowTimelineWidget />

            </div>
        </section>
    );
};

const FlowTimelineWidget = () => {
    const [animationState, setAnimationState] = useState<'chaos' | 'converging' | 'unified' | 'bank_overlay'>('chaos');
    const [showBankLayer, setShowBankLayer] = useState(false);
    const [mobileTooltipIndex, setMobileTooltipIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.5, once: true });
    const shouldReduceMotion = useReducedMotion();

    // Ref to track latest state for timeouts
    const showBankLayerRef = useRef(showBankLayer);
    useEffect(() => { showBankLayerRef.current = showBankLayer; }, [showBankLayer]);

    useEffect(() => {
        if (isInView && animationState === 'chaos') {
            triggerAnimation();
        }
    }, [isInView]);

    const triggerAnimation = () => {
        if (shouldReduceMotion) {
            setAnimationState(showBankLayerRef.current ? 'bank_overlay' : 'unified');
            return;
        }

        setAnimationState('converging');
        setMobileTooltipIndex(null); // Reset tooltips

        // Timeline
        setTimeout(() => {
            setAnimationState('unified');

            if (showBankLayerRef.current) {
                setTimeout(() => {
                    setAnimationState('bank_overlay');
                }, 1000);
            }
        }, 1500);
    };

    const handleReplay = () => {
        setAnimationState('chaos');
        setMobileTooltipIndex(null);
        setTimeout(() => triggerAnimation(), 100);
    };

    const handleMobileTap = () => {
        // Mobile only check
        if (window.innerWidth >= 768) return;

        if (animationState === 'chaos') {
            triggerAnimation();
        } else if (animationState === 'unified' || animationState === 'bank_overlay') {
            // Cycle tooltips
            if (mobileTooltipIndex === null) {
                setMobileTooltipIndex(0);
                const interval = setInterval(() => {
                    setMobileTooltipIndex(prev => {
                        if (prev === null) return 0;
                        const next = prev + 1;
                        if (next >= 3) { // Show first 3 platforms
                            clearInterval(interval);
                            return null;
                        }
                        return next;
                    });
                }, 1500);
            }
        }
    };

    const handleToggleBank = () => {
        const newState = !showBankLayer;
        setShowBankLayer(newState);
        // If already unified, animate the bank layer in/out immediately
        if (animationState === 'unified' && newState) {
             setAnimationState('bank_overlay');
        } else if (animationState === 'bank_overlay' && !newState) {
             setAnimationState('unified');
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Controls */}
            <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none group">
                        <div
                            className={cn(
                                "w-10 h-6 rounded-full relative transition-colors duration-300 border",
                                showBankLayer ? "bg-emerald-900/50 border-emerald-500/50" : "bg-zinc-900 border-zinc-700 group-hover:border-zinc-600"
                            )}
                            onClick={handleToggleBank}
                        >
                            <motion.div
                                className="w-4 h-4 rounded-full bg-white absolute top-1 left-1 shadow-sm"
                                animate={{ x: showBankLayer ? 16 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </div>
                        <span className={cn("font-medium transition-colors", showBankLayer ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")}>
                            View with bank layer
                        </span>
                    </label>
                 </div>

                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReplay}
                    className="text-zinc-500 hover:text-white hover:bg-zinc-800 gap-2"
                    aria-label="Replay animation"
                 >
                    <RefreshCw className={cn("w-4 h-4", animationState === 'converging' && "animate-spin")} />
                    Replay
                 </Button>
            </div>

            {/* Stage */}
            <div
                className="relative h-[500px] w-full bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden"
                role="region"
                aria-label="Interactive simulation of revenue unification"
                onClick={handleMobileTap}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center">

                    {/* --- LEFT: CHAOS STATE --- */}
                    <AnimatePresence>
                        {animationState === 'chaos' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0"
                            >
                                {/* Scatter the cards */}
                                {PLATFORMS.map((platform, i) => (
                                    <motion.div
                                        key={platform.id}
                                        initial={{
                                            x: platform.initialPos.x,
                                            y: platform.initialPos.y,
                                            rotate: platform.initialPos.rotate,
                                            scale: 0.9
                                        }}
                                        animate={{
                                            y: platform.initialPos.y + (i % 2 === 0 ? 10 : -10),
                                            scale: 1
                                        }}
                                        transition={{
                                            y: { duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                                            scale: { duration: 0.2 }
                                        }}
                                        className="absolute top-1/2 left-1/2 w-32 h-20 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl flex flex-col items-center justify-center gap-2 z-10"
                                        style={{ marginLeft: -64, marginTop: -40 }} // Center anchor
                                    >
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", platform.color)}>
                                            <platform.icon className="w-4 h-4" />
                                        </div>
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute top-2 right-2 opacity-50" />
                                    </motion.div>
                                ))}
                                <div className="absolute bottom-8 left-0 right-0 text-center text-zinc-500 text-sm animate-pulse md:hidden">
                                    Tap to unify
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- TRANSITION: STREAMS --- */}
                    <AnimatePresence>
                        {animationState === 'converging' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {PLATFORMS.map((platform, i) => (
                                    <motion.div
                                        key={`stream-${platform.id}`}
                                        initial={{
                                            x: platform.initialPos.x,
                                            y: platform.initialPos.y,
                                            opacity: 1,
                                            scale: 0.5
                                        }}
                                        animate={{
                                            x: 0,
                                            y: 0,
                                            opacity: 0,
                                            scale: 0.1
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            ease: "backIn",
                                            delay: i * 0.1
                                        }}
                                        className={cn("absolute top-1/2 left-1/2 w-4 h-4 rounded-full blur-sm", platform.color)}
                                        style={{ marginLeft: -8, marginTop: -8 }}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>


                    {/* --- RIGHT: UNIFIED DASHBOARD --- */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                        animate={
                            animationState === 'unified' || animationState === 'bank_overlay'
                            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                            : { opacity: 0, scale: 0.8, filter: 'blur(10px)' }
                        }
                        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-20 group"
                    >
                        {/* Dashboard Header */}
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                            <div className="text-xs font-mono text-zinc-500">DASHBOARD_V2</div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-sm text-zinc-500 mb-1">Total Revenue</div>
                                    <div className="text-3xl font-bold text-white tracking-tight">$17,043.34</div>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+12%</span>
                                </div>
                            </div>

                            {/* Mini Chart */}
                            <div className="h-24 flex items-end gap-1">
                                {[40, 65, 50, 80, 55, 90, 70, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.5 + (i * 0.05), duration: 0.5 }}
                                        className="flex-1 bg-zinc-800 hover:bg-emerald-500/50 transition-colors rounded-t-sm"
                                    />
                                ))}
                            </div>

                            {/* Platform Breakdown (Interactive Tooltips) */}
                            <div className="space-y-3">
                                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Payouts</div>
                                {PLATFORMS.slice(0, 3).map((platform, i) => (
                                    <div
                                        key={platform.id}
                                        className="relative group/row flex items-center justify-between p-2 rounded hover:bg-zinc-900 transition-colors cursor-help"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white text-[10px]", platform.color)}>
                                                <platform.icon className="w-3 h-3" />
                                            </div>
                                            <span className="text-sm text-zinc-300">{platform.name}</span>
                                        </div>
                                        <span className="text-sm font-mono text-zinc-400">{platform.payout}</span>

                                        {/* Tooltip */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={
                                                mobileTooltipIndex === i
                                                ? { opacity: 1, y: 0, scale: 1 }
                                                : { opacity: 0, y: 10, scale: 0.9 }
                                            }
                                            whileHover={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-zinc-800 text-white text-xs rounded shadow-xl border border-zinc-700 pointer-events-none z-30"
                                        >
                                            {platform.insight}
                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45 border-r border-b border-zinc-700"></div>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* --- BANK LAYER OVERLAY --- */}
                        <AnimatePresence>
                            {animationState === 'bank_overlay' && (
                                <motion.div
                                    initial={{ y: "100%", opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: "100%", opacity: 0 }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                                    className="absolute inset-0 bg-white/5 backdrop-blur-md z-30 flex flex-col justify-end border-t border-emerald-500/30"
                                >
                                    <div className="bg-zinc-950 p-6 border-t border-zinc-800 h-2/3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-3 mb-6 text-emerald-500">
                                            <Landmark className="w-5 h-5" />
                                            <span className="font-mono text-sm font-bold tracking-wider uppercase">Bank Verification Layer</span>
                                        </div>

                                        <div className="space-y-4">
                                            {PLATFORMS.slice(0, 3).map((platform, i) => (
                                                <motion.div
                                                    key={`bank-${platform.id}`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + (i * 0.1) }}
                                                    className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                        <span className="text-xs text-zinc-300">Deposit Matched</span>
                                                    </div>
                                                    <span className="text-xs font-mono text-emerald-400">{platform.payout}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default HowItWorksSection;
