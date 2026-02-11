import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, FileCheck, ArrowRight, Database, ShieldCheck } from 'lucide-react';

const SecurityAnimation = () => {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % 4);
        }, 2500); // 2.5 seconds per frame for a 10s loop
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-[400px] bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${frame === i ? 'w-8 bg-emerald-500' : 'w-2 bg-zinc-800'}`}
                    />
                ))}
            </div>

            <div className="flex-1 relative flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                    {frame === 0 && <FrameOne key="frame1" />}
                    {frame === 1 && <FrameTwo key="frame2" />}
                    {frame === 2 && <FrameThree key="frame3" />}
                    {frame === 3 && <FrameFour key="frame4" />}
                </AnimatePresence>
            </div>

            <div className="h-12 border-t border-zinc-800 flex items-center px-4 justify-between text-xs text-zinc-500 bg-zinc-900/50">
                <span>Data Boundary Map</span>
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Monitoring
                </span>
            </div>
        </div>
    );
};

// Frame 1: Data vs Money Flow
const FrameOne = () => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col items-center justify-center gap-8"
    >
        <div className="grid grid-cols-3 w-full gap-4 items-center">
            {/* Source */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <Database className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs text-zinc-400 font-medium">Platform / Bank</span>
            </div>

            {/* Flows */}
            <div className="flex flex-col gap-6 relative">
                 {/* Money Flow */}
                <div className="flex flex-col items-center gap-1 group">
                    <div className="w-full h-0.5 border-t-2 border-dashed border-zinc-600 relative">
                        <motion.div
                            animate={{ x: [0, 100] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="absolute -top-1.5 w-3 h-3 rounded-full bg-zinc-500"
                        />
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 -mt-2.5">Funds (Direct)</span>
                </div>

                 {/* Data Flow */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-0.5 bg-zinc-700 relative overflow-hidden">
                        <motion.div
                            animate={{ x: [-100, 100] }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-1/2"
                        />
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-zinc-950 px-2 -mt-2.5">Metadata (Read-only)</span>
                </div>
            </div>

            {/* Destinations */}
            <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col gap-4">
                     <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center relative">
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50">
                             <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="font-serif font-bold text-lg text-white">Z.</span>
                    </div>
                     <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center opacity-50">
                        <span className="text-xs text-zinc-500">Your Bank</span>
                    </div>
                </div>
            </div>
        </div>
        <p className="text-sm text-zinc-400 text-center mt-4">
            <span className="text-emerald-400 font-medium">Funds bypass Zerithum.</span> Only metadata enters for reconciliation.
        </p>
    </motion.div>
);

// Frame 2: Inside Zerithum
const FrameTwo = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col items-center justify-center"
    >
        <div className="w-full max-w-sm bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 relative overflow-hidden">
             {/* Background Grid */}
            <div className="absolute inset-0 grid grid-cols-6 gap-px pointer-events-none opacity-10">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className="bg-zinc-500/20" />
                ))}
            </div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm font-medium text-white">Reconciliation Engine</span>
                    <Lock className="w-4 h-4 text-emerald-500" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Confidence Score</span>
                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "92%" }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Anomaly Detection</span>
                        <span className="text-emerald-400">Active</span>
                    </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Encryption</span>
                        <span className="text-zinc-300 font-mono">AES-256</span>
                    </div>
                </div>
            </div>
        </div>
         <p className="text-sm text-zinc-400 text-center mt-6">
            Encrypted at rest. Logic execution in isolated sandbox.
        </p>
    </motion.div>
);

// Frame 3: Audit Log
const FrameThree = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col items-center justify-center"
    >
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">audit_log.json</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 rounded">Immutable</span>
            </div>
            <div className="p-3 font-mono text-[10px] text-zinc-400 space-y-2">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 border-b border-zinc-800/50 pb-1"
                >
                    <span className="text-zinc-600">14:08:22</span>
                    <span className="text-blue-400">YouTube</span>
                    <span className="text-zinc-500">delta: 150</span>
                    <span className="text-emerald-500">reason: fee_deduction</span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-2 border-b border-zinc-800/50 pb-1"
                >
                    <span className="text-zinc-600">14:08:23</span>
                    <span className="text-blue-400">Patreon</span>
                    <span className="text-zinc-500">delta: 50</span>
                    <span className="text-emerald-500">reason: fee_deduction</span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-2"
                >
                    <span className="text-zinc-600">14:08:24</span>
                    <span className="text-blue-400">Stripe</span>
                    <span className="text-zinc-500">delta: 0</span>
                    <span className="text-emerald-500">status: auto_reconciled</span>
                </motion.div>
            </div>
        </div>
        <p className="text-sm text-zinc-400 text-center mt-6">
            Every decision logged. Append-only audit trail.
        </p>
    </motion.div>
);

// Frame 4: Exports
const FrameFour = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col items-center justify-center"
    >
        <div className="flex items-center gap-8">
            <div className="w-20 h-24 bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-2 shadow-lg">
                <FileCheck className="w-8 h-8 text-emerald-500" />
                <span className="text-[10px] font-medium text-zinc-300">Tax Pack</span>
            </div>

            <div className="flex flex-col gap-2">
                <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <ArrowRight className="w-6 h-6 text-zinc-600" />
                </motion.div>
            </div>

            <div className="flex flex-col gap-3">
                 <div className="px-4 py-2 bg-zinc-800 rounded text-xs text-zinc-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> QuickBooks
                 </div>
                 <div className="px-4 py-2 bg-zinc-800 rounded text-xs text-zinc-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" /> Xero
                 </div>
                 <div className="px-4 py-2 bg-zinc-800 rounded text-xs text-zinc-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> CSV / PDF
                 </div>
            </div>
        </div>
         <p className="text-sm text-zinc-400 text-center mt-8">
            Tax-ready exports for your accountant.
        </p>
    </motion.div>
);

export default SecurityAnimation;
