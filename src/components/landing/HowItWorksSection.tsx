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
    RefreshCw,
    TrendingUp,
    Zap,
    CheckCircle2,
    Building2,
    DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types ---
interface Platform {
    id: string;
    icon: any;
    color: string;
    orbit: number; // Orbit radius
    angle: number; // Starting angle (rad)
    speed: number; // Orbit speed
}

// --- Data ---
const PLATFORMS: Platform[] = [
    { id: 'yt', icon: Youtube, color: 'text-red-500 bg-red-500/10 border-red-500/20', orbit: 140, angle: 0, speed: 0.005 },
    { id: 'pat', icon: Users, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', orbit: 180, angle: 2.1, speed: 0.003 },
    { id: 'str', icon: CreditCard, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', orbit: 120, angle: 4.2, speed: -0.006 },
    { id: 'gum', icon: ShoppingCart, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20', orbit: 160, angle: 1.5, speed: -0.004 },
    { id: 'twi', icon: Video, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', orbit: 150, angle: 3.5, speed: 0.007 },
    { id: 'spo', icon: Music, color: 'text-green-500 bg-green-500/10 border-green-500/20', orbit: 130, angle: 5.5, speed: -0.005 },
    { id: 'anc', icon: Mic, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', orbit: 170, angle: 0.8, speed: 0.004 },
    { id: 'web', icon: Globe, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', orbit: 110, angle: 2.8, speed: -0.008 },
];

const HowItWorksSection = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
        <section
            ref={sectionRef}
            id="how-it-works"
            className="py-24 md:py-32 bg-zinc-950 relative overflow-hidden flex flex-col items-center"
            aria-label="How Zerithum Works"
        >
            {/* Background Gradient Spot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-6 relative z-10 w-full flex flex-col items-center text-center">
                {/* Header Copy - Centered & Tight */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-16 max-w-2xl"
                >
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-2xl">
                        Stop wondering where the money is.
                    </h2>
                    <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-light">
                        Turn the noise of 20 platforms into one clear signal. <br className="hidden md:block"/>
                        Know exactly what you made, what landed, and what’s missing.
                    </p>
                </motion.div>

                {/* Interactive Collider Widget */}
                <RevenueCollider isInView={isInView} />
            </div>
        </section>
    );
};

const RevenueCollider = ({ isInView }: { isInView: boolean }) => {
    const [state, setState] = useState<'orbit' | 'implode' | 'fused'>('orbit');
    const [showBankLayer, setShowBankLayer] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    // Animation Logic
    useEffect(() => {
        if (isInView && state === 'orbit') {
            // If reduced motion, skip straight to fused
            if (prefersReducedMotion) {
                setState('fused');
                return;
            }

            const timer = setTimeout(() => {
                setState('implode');
            }, 800); // Wait a bit for user to see the chaos
            return () => clearTimeout(timer);
        }
    }, [isInView, state, prefersReducedMotion]);

    useEffect(() => {
        if (state === 'implode') {
            const timer = setTimeout(() => {
                setState('fused');
            }, 600); // Fast implosion!
            return () => clearTimeout(timer);
        }
    }, [state]);

    const handleReplay = () => {
        if (prefersReducedMotion) {
            // Just flash
            setState('orbit');
            setTimeout(() => setState('fused'), 100);
            return;
        }

        setState('orbit');
        setShowBankLayer(false);
        // Force restart
        setTimeout(() => setState('implode'), 100);
    };

    return (
        <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">

            {/* Controls (Absolute positioned to not break layout flow) */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
                 {/* Verify with Bank Button - Using AnimatePresence to ensure it's removed from DOM when not needed, or better managing its visibility state */}
                 <button
                    onClick={() => setShowBankLayer(!showBankLayer)}
                    disabled={state !== 'fused'} // Explicitly disable until fused
                    className={cn(
                        "text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all duration-300 pointer-events-auto z-50 outline-none",
                        state === 'fused' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 cursor-default",
                        showBankLayer ? "text-emerald-400" : "text-zinc-500 hover:text-white"
                    )}
                >
                    <div className={cn("w-3 h-3 rounded-full border transition-colors", showBankLayer ? "bg-emerald-500 border-emerald-500" : "border-zinc-700")}></div>
                    Verify with Bank
                 </button>

                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReplay}
                    className="rounded-full w-8 h-8 text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Replay Simulation"
                 >
                    <RefreshCw className={cn("w-4 h-4", state === 'orbit' && "animate-spin")} />
                 </Button>
            </div>

            {/* Core Stage */}
            <div className="relative w-full h-full">

                {/* Implosion Particles (Orbiting Platforms) */}
                <AnimatePresence>
                    {state !== 'fused' && PLATFORMS.map((p, i) => (
                        <OrbitingPlatform
                            key={p.id}
                            platform={p}
                            isImploding={state === 'implode'}
                            prefersReducedMotion={prefersReducedMotion}
                        />
                    ))}
                </AnimatePresence>

                {/* Central Fused Core (Dashboard) */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <AnimatePresence>
                        {state === 'fused' && (
                            <FusedDashboard
                                showBankLayer={showBankLayer}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Background Rings (Decorative) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className={cn("absolute w-[60%] h-[60%] border border-zinc-800 rounded-full transition-all duration-1000", state === 'fused' ? "opacity-0 scale-50" : "opacity-100 scale-100")}></div>
                     <div className={cn("absolute w-[90%] h-[90%] border border-zinc-900 rounded-full transition-all duration-1000 delay-100", state === 'fused' ? "opacity-0 scale-50" : "opacity-100 scale-100")}></div>
                </div>

            </div>
        </div>
    );
};

const OrbitingPlatform = ({ platform, isImploding, prefersReducedMotion }: { platform: Platform, isImploding: boolean, prefersReducedMotion: boolean | null }) => {
    // We simulate orbit with CSS animation on a wrapper, or simplified framer motion
    // For simplicity and performance, we'll position them absolutely based on angle
    // If imploding, they move to center (0,0) and scale down

    // Calculate initial position
    const x = Math.cos(platform.angle) * platform.orbit;
    const y = Math.sin(platform.angle) * platform.orbit;

    return (
        <motion.div
            initial={{ x, y, opacity: 0, scale: 0 }}
            animate={
                isImploding
                ? { x: 0, y: 0, opacity: 0, scale: 0 }
                : { x, y, opacity: 1, scale: 1 }
            }
            exit={{ opacity: 0, scale: 0 }}
            transition={
                isImploding
                ? { duration: 0.6, ease: "backIn" } // Fast implosion
                : { duration: 0.8, delay: Math.random() * 0.3 } // Gentle entry
            }
            className={cn(
                "absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full border bg-zinc-950 flex items-center justify-center shadow-lg backdrop-blur-sm z-0",
                platform.color
            )}
        >
            <platform.icon className="w-5 h-5" />

            {/* Orbit Animation Wrapper if not reduced motion */}
            {!prefersReducedMotion && !isImploding && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10 + Math.random() * 10, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t border-white/20"
                />
            )}
        </motion.div>
    );
};

const FusedDashboard = ({ showBankLayer, prefersReducedMotion }: { showBankLayer: boolean, prefersReducedMotion: boolean | null }) => {
    return (
        <motion.div
            initial={{ scale: 0.2, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-[300px] md:w-[340px] bg-zinc-900/90 border border-zinc-700/50 rounded-2xl shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)] overflow-hidden backdrop-blur-xl group/card"
        >
            {/* Glossy Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                    <span className="text-xs font-bold text-white tracking-widest font-mono">REVENUE OS</span>
                </div>
                <Zap className="w-3 h-3 text-emerald-400" />
            </div>

            {/* Body */}
            <div className="p-5 space-y-6">
                {/* Big Number */}
                <div className="text-center space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Net Revenue</div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-mono text-white font-medium tracking-tight flex items-center justify-center gap-2"
                    >
                        $14,205
                    </motion.div>
                    <div className="flex justify-center items-center gap-2 text-xs text-emerald-500">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12.4% vs last month</span>
                    </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 text-center">
                        <div className="text-[9px] text-zinc-500 uppercase">Pending</div>
                        <div className="text-sm font-mono text-zinc-300 mt-1">$2,100</div>
                    </div>
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 text-center">
                        <div className="text-[9px] text-zinc-500 uppercase">Fees</div>
                        <div className="text-sm font-mono text-zinc-300 mt-1">$482</div>
                    </div>
                </div>
            </div>

            {/* Bank Layer Overlay - Laser Scan Effect */}
            <AnimatePresence>
                {showBankLayer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-emerald-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center"
                    >
                        {/* Scanning Line */}
                        <motion.div
                            initial={{ top: 0 }}
                            animate={{ top: "100%" }}
                            transition={{ duration: 1.5, ease: "linear", repeat: Infinity, repeatDelay: 0.5 }}
                            className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-30"
                        />

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-zinc-950 border border-emerald-500/30 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold text-white">Bank Verified</div>
                                <div className="text-[10px] text-emerald-400/80 font-mono mt-1">
                                    MATCH: #TRX-8892 • 100%
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default HowItWorksSection;
