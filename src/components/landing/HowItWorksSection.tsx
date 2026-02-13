import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
    Youtube,
    CreditCard,
    Globe,
    ShoppingCart,
    Music,
    Video,
    Mic,
    Users,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    DollarSign,
    TrendingUp,
    Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types ---
interface Platform {
    id: string;
    name: string;
    icon: any;
    color: string;
    x: number; // Random scatter position X (-100 to 100)
    y: number; // Random scatter position Y (-100 to 100)
    delay: number;
}

// --- Data ---
const PLATFORMS: Platform[] = [
    { id: 'yt', name: 'YouTube', icon: Youtube, color: 'text-red-500 bg-red-500/10 border-red-500/20', x: -80, y: -60, delay: 0 },
    { id: 'pat', name: 'Patreon', icon: Users, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', x: 60, y: -70, delay: 0.1 },
    { id: 'str', name: 'Stripe', icon: CreditCard, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', x: -60, y: 40, delay: 0.2 },
    { id: 'gum', name: 'Gumroad', icon: ShoppingCart, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20', x: 80, y: 50, delay: 0.3 },
    { id: 'twi', name: 'Twitch', icon: Video, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', x: -90, y: 0, delay: 0.15 },
    { id: 'spo', name: 'Spotify', icon: Music, color: 'text-green-500 bg-green-500/10 border-green-500/20', x: 40, y: -30, delay: 0.25 },
    { id: 'anc', name: 'Anchor', icon: Mic, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', x: 20, y: 80, delay: 0.35 },
    { id: 'web', name: 'Website', icon: Globe, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', x: -30, y: -90, delay: 0.05 },
];

const HowItWorksSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const prefersReducedMotion = useReducedMotion();

    return (
        <section
            ref={sectionRef}
            id="how-it-works"
            className="py-32 bg-zinc-950 relative overflow-hidden"
            aria-label="How Zerithum Works"
        >
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header Copy */}
                <div className="max-w-3xl mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight leading-[1.1] mb-6"
                    >
                        Stop wondering where the money is.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl text-zinc-400 leading-relaxed max-w-2xl"
                    >
                        Turn the noise of 20 platforms into one clear signal. Know exactly what you made, what landed, and what’s missing.
                    </motion.p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-6">
                         <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-zinc-300 font-medium">Catch every delayed payment before it hurts.</span>
                         </motion.div>

                         <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <DollarSign className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-zinc-300 font-medium">See your true cash position in seconds.</span>
                         </motion.div>
                    </div>
                </div>

                {/* Interactive Widget */}
                <FlowTimeline isInView={isInView} prefersReducedMotion={prefersReducedMotion} />

            </div>
        </section>
    );
};

const FlowTimeline = ({ isInView, prefersReducedMotion }: { isInView: boolean, prefersReducedMotion: boolean | null }) => {
    const [animationState, setAnimationState] = useState<'idle' | 'running' | 'converged' | 'bank_layer'>('idle');
    const [showBankLayer, setShowBankLayer] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-start animation when scrolled into view
    useEffect(() => {
        if (isInView && animationState === 'idle') {
            if (prefersReducedMotion) {
                setAnimationState('converged');
                return;
            }
            // Small delay before starting
            const timer = setTimeout(() => {
                setAnimationState('running');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isInView, animationState, prefersReducedMotion]);

    // Handle Animation Lifecycle
    useEffect(() => {
        if (animationState === 'running') {
            const timer = setTimeout(() => {
                setAnimationState('converged');
            }, 2500); // Duration matches CSS transitions
            return () => clearTimeout(timer);
        }

        if (animationState === 'converged' && showBankLayer) {
             const timer = setTimeout(() => {
                setAnimationState('bank_layer');
            }, 800);
            return () => clearTimeout(timer);
        }

        // If we turn off bank layer, revert state
        if (animationState === 'bank_layer' && !showBankLayer) {
            setAnimationState('converged');
        }

    }, [animationState, showBankLayer]);

    const handleReplay = () => {
        if (prefersReducedMotion) {
             // Just flash
             setAnimationState('idle');
             setTimeout(() => setAnimationState('converged'), 100);
             return;
        }
        setAnimationState('idle');
        // Force restart
        setTimeout(() => setAnimationState('running'), 100);
    };

    const toggleBankLayer = () => {
        setShowBankLayer(!showBankLayer);
    };

    return (
        <div className="relative w-full">
            {/* Controls */}
            <div className="flex justify-between items-end mb-4 px-2">
                 <div className="flex items-center gap-2">
                    <label className="text-xs font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                        <span className={`w-3 h-3 rounded-full border ${showBankLayer ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'}`}></span>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={showBankLayer}
                            onChange={toggleBankLayer}
                        />
                        View with bank layer
                    </label>
                 </div>

                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReplay}
                    disabled={prefersReducedMotion === true}
                    className={cn(
                        "text-zinc-500 hover:text-white hover:bg-zinc-800 gap-2 h-8 text-xs font-mono uppercase tracking-wider",
                        prefersReducedMotion && "opacity-50 cursor-not-allowed"
                    )}
                 >
                    <RefreshCw className={cn("w-3 h-3", animationState === 'running' && "animate-spin")} />
                    Replay
                 </Button>
            </div>

            {/* Main Stage */}
            <div
                ref={containerRef}
                className="relative bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 md:p-12 min-h-[400px] md:min-h-[500px] overflow-hidden flex items-center justify-center group"
                onClick={() => {
                    // Mobile tap to start if idle
                    if (animationState === 'idle') {
                        if (prefersReducedMotion) {
                             setAnimationState('converged');
                        } else {
                             setAnimationState('running');
                        }
                    }
                }}
            >
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="relative w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 z-10">

                    {/* LEFT SIDE: Chaos / Platforms */}
                    <div className="w-full md:w-1/3 h-[200px] md:h-[300px] relative">
                         <AnimatePresence>
                            {PLATFORMS.map((platform) => {
                                // Calculate position based on state
                                const isConverged = animationState === 'converged' || animationState === 'bank_layer';

                                return (
                                    <motion.div
                                        key={platform.id}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.8,
                                            x: platform.x,
                                            y: platform.y
                                        }}
                                        animate={
                                            isConverged
                                            ? {
                                                opacity: 0,
                                                scale: 0,
                                                x: 150, // Move towards center
                                                y: 0
                                              }
                                            : animationState === 'running'
                                            ? {
                                                opacity: 1,
                                                scale: 1,
                                                x: platform.x, // Stay scattered initially
                                                y: platform.y
                                              }
                                            : {
                                                opacity: 1,
                                                scale: 1,
                                                x: platform.x,
                                                y: platform.y
                                            }
                                        }
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{
                                            duration: prefersReducedMotion ? 0 : (isConverged ? 0.8 : 0.5),
                                            delay: prefersReducedMotion ? 0 : (isConverged ? platform.delay : 0),
                                            ease: "easeInOut"
                                        }}
                                        className={cn(
                                            "absolute left-1/2 top-1/2 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-sm z-20",
                                            platform.color
                                        )}
                                        style={{ marginLeft: '-24px', marginTop: '-24px' }}
                                    >
                                        <platform.icon className="w-6 h-6" />

                                        {/* Activity Indicator Dot */}
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-zinc-900 animate-pulse"></div>
                                    </motion.div>
                                );
                            })}
                         </AnimatePresence>

                         {/* Stream Lines (SVG) appearing during convergence - Desktop Only */}
                         {!prefersReducedMotion && (
                             <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <AnimatePresence>
                                        {(animationState === 'converged' || animationState === 'bank_layer') && PLATFORMS.map((platform, i) => (
                                            <motion.path
                                                key={`path-${platform.id}`}
                                                d="M 50 50 C 100 50 150 50 250 50"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: [0, 1, 0] }} // Flash in then out
                                                transition={{ duration: 1.2, delay: platform.delay + 0.2, ease: "easeInOut" }}
                                                stroke="white"
                                                strokeOpacity={0.3}
                                                strokeWidth="0.5" // Relative to viewBox 100x100, 0.5 is decent thickness
                                                vectorEffect="non-scaling-stroke"
                                                fill="none"
                                            />
                                        ))}
                                    </AnimatePresence>
                                </svg>
                             </div>
                         )}
                    </div>

                    {/* CENTER: Transformation Zone (Hidden visually, mostly for spacing) */}
                    <div className="hidden md:flex items-center justify-center w-1/3 z-0">
                        <ArrowRight className={cn(
                            "w-8 h-8 text-zinc-700 transition-all duration-500",
                            (animationState === 'converged' || animationState === 'bank_layer') ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                        )} />
                    </div>

                    {/* RIGHT SIDE: Unified Dashboard */}
                    <div className="w-full md:w-1/3 relative flex items-center justify-center z-30">
                        <UnifiedDashboard
                            state={animationState}
                            showBankLayer={showBankLayer}
                            prefersReducedMotion={prefersReducedMotion}
                        />
                    </div>

                </div>
            </div>

            {/* Mobile Helper Text */}
            <div className="md:hidden mt-4 text-center text-xs text-zinc-500">
                Tap widget to simulate flow
            </div>
        </div>
    );
};

const TooltipContent = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute -top-8 left-0 bg-white text-zinc-900 text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 font-medium md:hidden block"
    >
        {children}
    </motion.div>
);

const UnifiedDashboard = ({ state, showBankLayer, prefersReducedMotion }: { state: string, showBankLayer: boolean, prefersReducedMotion: boolean | null }) => {
    const isVisible = state === 'converged' || state === 'bank_layer';
    const showBank = state === 'bank_layer';

    // Mobile cycling logic
    const [activeTooltip, setActiveTooltip] = useState(-1);
    const [cycling, setCycling] = useState(false);

    useEffect(() => {
        // Start cycling when converged
        if (isVisible) {
            setCycling(true);
        } else {
            setCycling(false);
            setActiveTooltip(-1);
        }
    }, [isVisible]);

    useEffect(() => {
        if (!cycling) return;

        const interval = setInterval(() => {
            setActiveTooltip(prev => (prev + 1) % 3); // 3 tooltips
        }, 1500);

        return () => clearInterval(interval);
    }, [cycling]);

    // Manual tap restarts cycling or just lets it run
    const handleTap = () => {
        if (isVisible) {
             // Maybe reset cycle?
             setActiveTooltip(0);
             setCycling(true);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={isVisible ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.9, x: 50 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.5, type: "spring" }}
            className="relative w-full max-w-[320px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl group/dash cursor-pointer" // Removed overflow-hidden for tooltips
            onClick={handleTap}
        >
            {/* Dashboard Header */}
            <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-white tracking-wide">REVENUE OS</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">LIVE</div>
            </div>

            {/* Dashboard Body */}
            <div className="p-4 space-y-4">
                {/* Metric 1 */}
                <div className="space-y-1 relative group/tooltip-1">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Revenue</div>
                    <div className="text-2xl font-mono text-white font-medium flex items-center gap-2">
                        $14,205.00
                        <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> +12%
                        </span>
                    </div>
                    {/* Tooltip */}
                    <AnimatePresence>
                        {(activeTooltip === 0 || (!cycling && false)) && ( // Simple fallback for hover handled by CSS mostly, but for cycling we use React
                           <TooltipContent>Last 30 days vs previous</TooltipContent>
                        )}
                    </AnimatePresence>
                    {/* Hover only via CSS to avoid conflict? Or render both?
                        Let's use React for both if possible, but hover state is hard to track without listeners.
                        Stick to CSS for hover, React for cycling.
                    */}
                     <div className="absolute -top-8 left-0 bg-white text-zinc-900 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover/tooltip-1:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-medium md:block hidden">
                        Last 30 days vs previous
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 relative group/tooltip-2">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pending</div>
                        <div className="text-lg font-mono text-zinc-300">$2,100.00</div>
                         {/* Tooltip */}
                        <AnimatePresence>
                            {(activeTooltip === 1) && (
                                <TooltipContent>YouTube AdSense (Delayed 2d)</TooltipContent>
                            )}
                        </AnimatePresence>
                         <div className="absolute -top-8 left-0 bg-white text-zinc-900 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover/tooltip-2:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-medium md:block hidden">
                            YouTube AdSense (Delayed 2d)
                        </div>
                    </div>
                    <div className="space-y-1 relative group/tooltip-3">
                         <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Fees</div>
                         <div className="text-lg font-mono text-zinc-300">$482.50</div>
                          {/* Tooltip */}
                        <AnimatePresence>
                            {(activeTooltip === 2) && (
                                <TooltipContent>Avg platform fee: 3.4%</TooltipContent>
                            )}
                        </AnimatePresence>
                         <div className="absolute -top-8 left-0 bg-white text-zinc-900 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover/tooltip-3:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-medium md:block hidden">
                            Avg platform fee: 3.4%
                        </div>
                    </div>
                </div>

                {/* Graph Area (Fake) */}
                <div className="h-16 w-full flex items-end gap-1 pt-4 border-t border-zinc-800/50">
                    {[40, 60, 45, 70, 50, 80, 65, 90].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.5, delay: 1 + (i * 0.1) }}
                            className="flex-1 bg-zinc-800 hover:bg-emerald-500/50 transition-colors rounded-t-sm"
                        ></motion.div>
                    ))}
                </div>
            </div>

            {/* BANK LAYER OVERLAY */}
            <AnimatePresence>
                {showBank && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-0 bg-emerald-900/90 backdrop-blur-md z-10 flex flex-col"
                    >
                         <div className="bg-emerald-950/50 p-3 border-b border-emerald-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-white tracking-wide">BANK FEED</span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>

                        <div className="p-4 space-y-3">
                             <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-emerald-500/30">
                                <div className="text-xs text-emerald-100">Deposit #8892</div>
                                <div className="text-xs font-mono text-white">$4,200.00</div>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                             </div>
                             <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-emerald-500/30">
                                <div className="text-xs text-emerald-100">Deposit #8893</div>
                                <div className="text-xs font-mono text-white">$1,150.00</div>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                             </div>
                             <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-emerald-500/30">
                                <div className="text-xs text-emerald-100">Stripe Batch</div>
                                <div className="text-xs font-mono text-white">$890.50</div>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                             </div>

                             <div className="mt-4 pt-4 border-t border-emerald-800 text-center">
                                <div className="text-emerald-300 text-xs font-medium">100% Reconciled</div>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default HowItWorksSection;
