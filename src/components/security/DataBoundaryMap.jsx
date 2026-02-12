import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Youtube, CreditCard, DollarSign, Lock
} from 'lucide-react';

const DataBoundaryMap = () => {
    const [activeFrame, setActiveFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const containerRef = useRef(null);

    // Auto-advance frames
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setActiveFrame((prev) => (prev + 1) % 5);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsPlaying(entry.isIntersecting);
            },
            { threshold: 0.3 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, []);

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div ref={containerRef} className="w-full max-w-5xl mx-auto bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col">
            {/* Header / Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    <span className="text-xs font-mono text-zinc-500 ml-2 uppercase tracking-wider">Data Boundary Map</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <button
                                key={i}
                                onClick={() => setActiveFrame(i)}
                                className={`w-8 h-1 rounded-full transition-all duration-300 ${activeFrame === i ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                            />
                        ))}
                    </div>
                    <button onClick={togglePlay} className="text-zinc-500 hover:text-white transition-colors text-xs font-mono uppercase">
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                </div>
            </div>

            {/* Visualization Area */}
            <div className="flex-1 relative bg-zinc-950 p-8 flex items-center justify-center overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-10"
                     style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                <div className="relative z-10 w-full h-full flex items-center justify-between gap-8 max-w-4xl">

                    {/* Left Side: Sources */}
                    <div className="flex flex-col gap-6 items-center w-24 shrink-0 z-20">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2 text-center">Sources</div>
                        <PlatformIcon icon={Youtube} label="YouTube" />
                        <PlatformIcon icon={DollarSign} label="Patreon" />
                        <PlatformIcon icon={CreditCard} label="Stripe" />
                    </div>

                    {/* Middle: The Flow & The Box */}
                    <div className="flex-1 relative h-64 flex items-center justify-center">

                        {/* ZERITHUM BOX */}
                        <div className="relative z-20 w-48 h-48 bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col items-center justify-center shadow-2xl">
                            <div className="absolute -top-3 bg-zinc-950 px-2 text-xs font-mono text-zinc-400 border border-zinc-800 rounded">ZERITHUM</div>

                            {/* Internal Components Animation */}
                            <AnimatePresence mode="wait">
                                {activeFrame === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center space-y-2"
                                    >
                                        <div className="text-[10px] text-emerald-400 font-mono border border-emerald-900/50 bg-emerald-900/10 px-2 py-1 rounded">Reconciliation Engine</div>
                                        <div className="text-[10px] text-emerald-400 font-mono border border-emerald-900/50 bg-emerald-900/10 px-2 py-1 rounded">Confidence Scoring</div>
                                        <Lock className="w-4 h-4 text-zinc-500 mx-auto mt-2" />
                                        <div className="text-[9px] text-zinc-600">AES-256 Encrypted</div>
                                    </motion.div>
                                )}
                                {activeFrame !== 2 && (
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* FLOW 1: MONEY BYPASS (Dashed Line) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <AnimatePresence>
                                {activeFrame === 0 && (
                                    <motion.path
                                        d="M 0,50 Q 50,-20 100,50"
                                        fill="none"
                                        stroke="#52525b"
                                        strokeWidth="0.5"
                                        strokeDasharray="2 2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                    />
                                )}
                            </AnimatePresence>
                        </svg>
                         {activeFrame === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded border border-zinc-700 whitespace-nowrap z-30"
                            >
                                Money Flow (Bypasses Zerithum)
                            </motion.div>
                        )}

                        {/* FLOW 2: DATA INGEST (Solid Line) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <AnimatePresence>
                                {activeFrame === 1 && (
                                    <>
                                        <motion.path
                                            d="M 0,20 L 35,50"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="0.5"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8 }}
                                        />
                                         <motion.path
                                            d="M 0,80 L 35,50"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="0.5"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                        />
                                    </>
                                )}
                            </AnimatePresence>
                        </svg>
                         {activeFrame === 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-1/2 left-4 -translate-y-1/2 bg-zinc-900/90 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-900/30 whitespace-nowrap z-30"
                            >
                                Read-Only Metadata
                            </motion.div>
                        )}

                        {/* FLOW 3: AUDIT LOGS (Drawer) */}
                         <AnimatePresence>
                            {activeFrame === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute -bottom-32 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl z-40"
                                >
                                    <div className="text-[10px] text-zinc-500 mb-2 font-mono uppercase border-b border-zinc-800 pb-1">Immutable Audit Trail (Demo Data)</div>
                                    <div className="space-y-1 font-mono text-[9px] text-zinc-400">
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex justify-between">
                                            <span>2024-02-12 17:51 UTC</span> <span className="text-emerald-500">CONFIRMED</span> <span>YouTube</span>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex justify-between">
                                            <span>2024-02-12 17:51 UTC</span> <span className="text-emerald-500">CONFIRMED</span> <span>Stripe</span>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex justify-between">
                                            <span>2024-02-12 17:51 UTC</span> <span className="text-amber-500">FLAGGED</span> <span>Patreon</span>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* FLOW 4: EXPORTS (Right Arrow) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <AnimatePresence>
                                {activeFrame === 4 && (
                                    <motion.path
                                        d="M 65,50 L 100,50"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="0.5"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8 }}
                                    />
                                )}
                            </AnimatePresence>
                        </svg>
                        {activeFrame === 4 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-1/2 right-4 -translate-y-1/2 bg-zinc-900/90 text-blue-400 text-xs px-2 py-1 rounded border border-blue-900/30 whitespace-nowrap z-30"
                            >
                                Tax Ready Exports
                            </motion.div>
                        )}

                    </div>

                    {/* Right Side: Destinations */}
                    <div className="flex flex-col gap-6 items-center w-24 shrink-0 z-20">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2 text-center">Destinations</div>
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded flex flex-col items-center justify-center relative">
                            <span className="text-[10px] font-bold text-zinc-300">BANK</span>
                            {activeFrame === 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"
                                />
                            )}
                        </div>
                        <div className="h-8 border-l border-zinc-800 border-dashed"></div>
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded flex flex-col items-center justify-center relative">
                            <span className="text-[10px] font-bold text-zinc-300">CPA</span>
                             {activeFrame === 4 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer / Status */}
            <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-3 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                <div>
                    STATUS: <span className="text-emerald-500">OPERATIONAL</span>
                </div>
                <div>
                    ENCRYPTION: <span className="text-zinc-400">TLS 1.3 / AES-256</span>
                </div>
            </div>
        </div>
    );
};

const PlatformIcon = ({ icon: Icon, label }) => (
    <div className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center">
            <Icon className="w-4 h-4 text-zinc-400" />
        </div>
        <span className="text-[9px] text-zinc-500">{label}</span>
    </div>
);

export default DataBoundaryMap;
