import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    Zap,
    Activity,
    Search,
    Database,
    Layers,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Youtube,
    CreditCard,
    DollarSign,
    ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Data ---
const SAMPLE_TXS = [
    { source: 'YouTube', amount: 8432.10, icon: Youtube, color: 'text-red-500' },
    { source: 'Stripe', amount: 1250.00, icon: CreditCard, color: 'text-indigo-500' },
    { source: 'Patreon', amount: 3890.55, icon: DollarSign, color: 'text-orange-500' },
    { source: 'Gumroad', amount: 420.69, icon: ShoppingCart, color: 'text-pink-500' },
    { source: 'Twitch', amount: 2100.00, icon: Zap, color: 'text-purple-500' },
];

type ParticleType = {
    id: string;
    source: string;
    icon: any;
    color: string;
    amount: number;
    status: 'match' | 'mismatch';
};

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-24 bg-zinc-950 relative overflow-hidden" aria-label="How Zerithum Works">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-6">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        Live Fusion Engine
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
                        Revenue fusion.
                    </h2>
                    <p className="text-xl text-zinc-400 font-light">
                        We collide platform data with bank truths. The result is pure, verified revenue.
                    </p>
                </div>

                {/* The Reactor Widget */}
                <FusionReactorWidget />

            </div>
        </section>
    );
};

const FusionReactorWidget = () => {
    const [revenue, setRevenue] = useState(142050.00);
    const [particles, setParticles] = useState<ParticleType[]>([]);
    const [isHovering, setIsHovering] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    // Particle Spawner Loop
    useEffect(() => {
        if (isHovering || shouldReduceMotion) return; // Pause on hover or reduced motion

        let txIndex = 0;
        const interval = setInterval(() => {
            const id = Math.random().toString(36).substr(2, 9);
            const isMatch = Math.random() > 0.2; // 80% matches

            const tx = SAMPLE_TXS[txIndex % SAMPLE_TXS.length];
            txIndex++;

            const newParticle: ParticleType = {
                id,
                source: tx.source,
                icon: tx.icon,
                color: tx.color,
                amount: tx.amount, // Use consistent amount for demo
                status: isMatch ? 'match' : 'mismatch',
            };

            setParticles(prev => [...prev.slice(-8), newParticle]); // Keep last 8 to avoid clutter

            // Update revenue if match
            if (isMatch) {
                setTimeout(() => {
                    setRevenue(prev => prev + newParticle.amount);
                }, 1000); // Wait for "collision"
            }

        }, 1200); // Spawn every 1.2s for clarity

        return () => clearInterval(interval);
    }, [isHovering, shouldReduceMotion]);

    // Static View for Reduced Motion
    if (shouldReduceMotion) {
        return (
             <div className="max-w-5xl mx-auto bg-[#050505] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px] flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-600 flex items-center justify-center mx-auto shadow-2xl">
                         <div className="text-center">
                            <div className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Total Revenue</div>
                            <div className="text-lg font-bold text-white tabular-nums tracking-tight">
                                ${revenue.toLocaleString()}
                            </div>
                         </div>
                    </div>
                    <p className="text-zinc-500 text-sm">Live reconciliation active.</p>
                </div>
             </div>
        );
    }

    return (
        <div
            className="max-w-5xl mx-auto bg-[#050505] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col md:flex-row"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* --- LEFT / TOP: PLATFORM INPUT --- */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-zinc-800/50 z-10">
                <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Input: Platforms
                </div>

                {/* Emitter Visual */}
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                    <Zap className="w-6 h-6 text-blue-400" />
                </div>

                {/* Particles moving towards center */}
                <div className="w-full h-20 relative flex items-center justify-center">
                    <AnimatePresence>
                        {particles.map((p) => (
                            <motion.div
                                key={`p-${p.id}`}
                                initial={{ x: -100, opacity: 0, scale: 0.5 }}
                                animate={{ x: "100%", opacity: [0, 1, 1, 0], scale: 1 }}
                                transition={{ duration: 1.5, ease: "easeIn" }}
                                className="absolute left-0 flex items-center gap-2"
                            >
                                <div className={cn("w-3 h-3 rounded-full shadow-lg", p.color.replace('text-', 'bg-'))} />
                                <div className={cn("text-[10px] font-mono opacity-50 hidden md:block", p.color)}>{p.source}</div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- CENTER: FUSION CORE --- */}
            <div className="w-full md:w-[400px] bg-zinc-900/30 flex flex-col items-center justify-center relative z-20 py-12 md:py-0 overflow-hidden">
                {/* Core Ring */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border border-zinc-700 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-4 border border-zinc-600 rounded-full animate-[spin_7s_linear_infinite_reverse] border-dashed" />
                    <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" />

                    {/* The Core Orb */}
                    <div className="w-24 h-24 rounded-full bg-zinc-950 border border-zinc-600 flex items-center justify-center relative z-10 shadow-2xl">
                         <div className="text-center">
                            <div className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Total Revenue</div>
                            <div className="text-lg font-bold text-white tabular-nums tracking-tight">
                                ${revenue.toLocaleString()}
                            </div>
                         </div>
                    </div>

                    {/* Collision Flash Effects */}
                    <AnimatePresence>
                        {particles.map((p) => (
                            <motion.div
                                key={`flash-${p.id}`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1.5, 2],
                                    borderColor: p.status === 'match' ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                                }}
                                transition={{ duration: 0.6, delay: 1.4 }} // Sync with particle arrival
                                className={cn(
                                    "absolute inset-0 rounded-full border-2",
                                    p.status === 'match' ? "border-emerald-500" : "border-red-500"
                                )}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Output Streams */}
                <div className="absolute top-8 right-8 md:top-auto md:bottom-12 md:right-auto flex flex-col items-center gap-2">
                     <AnimatePresence>
                        {particles.filter(p => p.status === 'match').map((p) => (
                            <motion.div
                                key={`out-${p.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: -40 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, delay: 1.5 }}
                                className="absolute text-xs font-bold text-emerald-400 flex items-center gap-1"
                            >
                                +${p.amount.toLocaleString()} <ArrowUpRight className="w-3 h-3" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- RIGHT / BOTTOM: BANK INPUT --- */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center relative border-t md:border-t-0 md:border-l border-zinc-800/50 z-10">
                <div className="absolute top-4 right-4 text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    Input: Bank <Database className="w-3 h-3" />
                </div>

                 {/* Emitter Visual */}
                 <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-20" />
                    <Database className="w-6 h-6 text-emerald-400" />
                </div>

                {/* Particles moving towards center (Reversed direction visually) */}
                <div className="w-full h-20 relative flex items-center justify-center">
                    <AnimatePresence>
                        {particles.map((p) => (
                            <motion.div
                                key={`b-${p.id}`}
                                initial={{ x: 100, opacity: 0, scale: 0.5 }}
                                animate={{ x: "-100%", opacity: [0, 1, 1, 0], scale: 1 }}
                                transition={{ duration: 1.5, ease: "easeIn" }}
                                className="absolute right-0 flex items-center gap-2 flex-row-reverse"
                            >
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <div className="text-[10px] font-mono text-emerald-300 opacity-50 hidden md:block">DEPOSIT</div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Manual Control Overlay (Visible on Hover) */}
            <AnimatePresence>
                {isHovering && !shouldReduceMotion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center"
                    >
                        <div className="text-center p-6 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-sm mx-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Deep Inspection Mode</h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                In the app, you can pause any transaction to see the exact lineage from platform API to bank settlement.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <div className="px-3 py-1 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-500 font-mono">
                                    ID: {particles[particles.length-1]?.id || 'tx_init'}
                                </div>
                                <div className="px-3 py-1 bg-emerald-950/30 rounded border border-emerald-900/50 text-xs text-emerald-400 font-mono flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default HowItWorksSection;
