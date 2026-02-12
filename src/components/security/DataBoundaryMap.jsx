import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Youtube, CreditCard, DollarSign, Lock, Database
} from 'lucide-react';

const DataBoundaryMap = () => {
    const [activeFrame, setActiveFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const containerRef = useRef(null);

    // Auto-advance frames with faster transitions (2s)
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setActiveFrame((prev) => (prev + 1) % 5);
            }, 2000);
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
        <div ref={containerRef} className="w-full max-w-5xl mx-auto bg-zinc-950 border border-zinc-800 rounded-xl overflow-visible shadow-2xl relative min-h-[600px] flex flex-col">
            {/* Header / Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-50 rounded-t-xl">
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
            <div className="flex-1 relative bg-zinc-950 p-8 flex items-center justify-center overflow-hidden rounded-b-xl">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-10"
                     style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                <div className="relative z-10 w-full h-full flex items-center justify-between gap-8 max-w-4xl py-12">

                    {/* Left Side: Sources */}
                    <div className="flex flex-col gap-6 items-center w-24 shrink-0 z-20">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2 text-center">Sources</div>
                        <PlatformIcon icon={Youtube} label="YouTube" active={activeFrame <= 1} />
                        <PlatformIcon icon={DollarSign} label="Patreon" active={activeFrame <= 1} />
                        <PlatformIcon icon={CreditCard} label="Stripe" active={activeFrame <= 1} />
                    </div>

                    {/* Middle: The Flow & The Box */}
                    <div className="flex-1 relative h-80 flex items-center justify-center">

                        {/* ZERITHUM BOX */}
                        <div className="relative z-20 w-56 h-56 bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col items-center justify-center shadow-2xl group transition-all duration-500">
                            <div className="absolute -top-3 bg-zinc-950 px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-800 rounded shadow-sm z-30">ZERITHUM</div>

                            {/* Internal Components Animation */}
                            <AnimatePresence mode="wait">
                                {activeFrame === 2 ? (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center space-y-3 w-full px-4"
                                    >
                                        <div className="text-[10px] text-emerald-400 font-mono border border-emerald-900/50 bg-emerald-900/10 px-2 py-1.5 rounded flex items-center justify-between">
                                            <span>Reconciliation</span>
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="text-[10px] text-emerald-400 font-mono border border-emerald-900/50 bg-emerald-900/10 px-2 py-1.5 rounded flex items-center justify-between">
                                            <span>Scoring</span>
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-zinc-800">
                                            <Lock className="w-3 h-3 text-zinc-500" />
                                            <span className="text-[9px] text-zinc-600 font-mono">AES-256</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center text-zinc-700"
                                    >
                                        <Database className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-[10px] font-mono">Secure Core</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* FLOW 1: MONEY BYPASS (Dashed Line) - Upper Arch */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <AnimatePresence>
                                {activeFrame === 0 && (
                                    <motion.path
                                        d="M 0,20 Q 50,-40 100,20"
                                        fill="none"
                                        stroke="#52525b"
                                        strokeWidth="0.8"
                                        strokeDasharray="3 3"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.2, ease: "easeInOut" }}
                                    />
                                )}
                            </AnimatePresence>
                        </svg>
                         {activeFrame === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded border border-zinc-700 whitespace-nowrap z-30 shadow-lg flex items-center gap-2"
                            >
                                <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
                                Money Flow (Bypasses Zerithum)
                            </motion.div>
                        )}

                        {/* FLOW 2: DATA INGEST (Solid Line) - Lower Ingest */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <AnimatePresence>
                                {activeFrame === 1 && (
                                    <>
                                        <motion.path
                                            d="M 0,30 L 35,50"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="0.8"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                         <motion.path
                                            d="M 0,70 L 35,50"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="0.8"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                        />
                                    </>
                                )}
                            </AnimatePresence>
                        </svg>
                         {activeFrame === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-1/2 left-0 -translate-y-1/2 -ml-4 bg-zinc-900/90 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-900/30 whitespace-nowrap z-30 shadow-lg backdrop-blur-sm"
                            >
                                Read-Only Metadata
                            </motion.div>
                        )}

                        {/* FLOW 3: AUDIT LOGS (Drawer) - Bottom Slide Up */}
                         <AnimatePresence>
                            {activeFrame === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 40 }}
                                    className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-2xl z-40 overflow-hidden"
                                >
                                    <div className="text-[10px] text-zinc-500 mb-2 font-mono uppercase border-b border-zinc-800 pb-1 flex justify-between items-center">
                                        <span>Immutable Audit Trail</span>
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="space-y-1.5 font-mono text-[9px] text-zinc-400">
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex justify-between items-center p-1 bg-zinc-950/50 rounded">
                                            <span>17:51 UTC</span> <span className="text-emerald-500 font-bold">CONFIRMED</span> <span>YouTube</span>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex justify-between items-center p-1 bg-zinc-950/50 rounded">
                                            <span>17:51 UTC</span> <span className="text-emerald-500 font-bold">CONFIRMED</span> <span>Stripe</span>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex justify-between items-center p-1 bg-zinc-950/50 rounded">
                                            <span>17:51 UTC</span> <span className="text-amber-500 font-bold">FLAGGED</span> <span>Patreon</span>
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
                                        strokeWidth="0.8"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                )}
                            </AnimatePresence>
                        </svg>
                        {activeFrame === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-1/2 right-0 -translate-y-1/2 -mr-4 bg-zinc-900/90 text-blue-400 text-xs px-2 py-1 rounded border border-blue-900/30 whitespace-nowrap z-30 shadow-lg backdrop-blur-sm"
                            >
                                Tax Ready Exports
                            </motion.div>
                        )}

                    </div>

                    {/* Right Side: Destinations */}
                    <div className="flex flex-col gap-6 items-center w-24 shrink-0 z-20">
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2 text-center">Destinations</div>
                        <div className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded flex flex-col items-center justify-center relative transition-all duration-300 hover:border-zinc-500">
                            <span className="text-[10px] font-bold text-zinc-300">BANK</span>
                            <AnimatePresence>
                                {activeFrame === 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-zinc-950"
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="h-12 border-l border-zinc-800 border-dashed"></div>
                        <div className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded flex flex-col items-center justify-center relative transition-all duration-300 hover:border-zinc-500">
                            <span className="text-[10px] font-bold text-zinc-300">CPA</span>
                             <AnimatePresence>
                                {activeFrame === 4 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-zinc-950"
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer / Status */}
            <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-3 flex justify-between items-center text-[10px] text-zinc-600 font-mono rounded-b-xl">
                <div className="flex items-center gap-2">
                    STATUS: <span className="text-emerald-500 flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> OPERATIONAL</span>
                </div>
                <div>
                    ENCRYPTION: <span className="text-zinc-400">TLS 1.3 / AES-256</span>
                </div>
            </div>
        </div>
    );
};

const PlatformIcon = ({ icon: Icon, label, active }) => (
    <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-40'}`}>
        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center shadow-sm">
            <Icon className={`w-4 h-4 transition-colors duration-300 ${active ? 'text-zinc-200' : 'text-zinc-600'}`} />
        </div>
        <span className="text-[9px] text-zinc-500">{label}</span>
    </div>
);

export default DataBoundaryMap;
