import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FileText,
  Search,
  CreditCard,
  Youtube,
  DollarSign,
  Database
} from 'lucide-react';

const DashboardPreview = () => {
  const [stage, setStage] = useState('ingesting'); // ingesting, scanning, anomaly, reporting

  useEffect(() => {
    let mounted = true;

    const runCycle = async () => {
      while (mounted) {
        setStage('ingesting');
        await new Promise(r => setTimeout(r, 3000));

        if (!mounted) break;
        setStage('scanning');
        await new Promise(r => setTimeout(r, 2000));

        if (!mounted) break;
        setStage('anomaly');
        await new Promise(r => setTimeout(r, 3500));

        if (!mounted) break;
        setStage('reporting');
        await new Promise(r => setTimeout(r, 2500));
      }
    };

    runCycle();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full h-[500px] md:h-[600px] bg-[#09090b] rounded-xl overflow-hidden flex flex-col font-mono text-xs md:text-sm relative border border-zinc-800 shadow-2xl">
      {/* Window Header */}
      <div className="h-10 bg-[#0c0c0e] border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-zinc-500 tracking-widest text-[10px] md:text-xs font-medium flex items-center gap-2">
          <Activity className="w-3 h-3" />
          ZERITHUM_OPS // LIVE_RECONCILIATION
        </div>
        <div className="flex items-center gap-2 text-zinc-600 text-[10px]">
             <span>v2.4.0</span>
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative bg-[#09090b] flex flex-col md:flex-row overflow-hidden">

        {/* LEFT PANEL: INPUT STREAMS */}
        <div className="w-full md:w-1/4 border-r border-zinc-800/50 p-4 flex flex-col gap-4 bg-[#0a0a0b] z-10 relative">
            <div className="text-zinc-500 uppercase text-[10px] tracking-wider font-bold mb-2">Connected Sources</div>

            {/* Source 1: YouTube */}
            <div className="relative group">
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between relative overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-red-600/20 flex items-center justify-center text-red-500">
                            <Youtube className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-zinc-200 font-medium">YouTube</div>
                            <div className="text-[10px] text-zinc-500">Syncing...</div>
                        </div>
                    </div>
                    {stage === 'ingesting' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    )}
                </div>
                {/* Particle Emitter */}
                {stage === 'ingesting' && (
                    <motion.div
                        className="absolute right-0 top-1/2 w-2 h-2 bg-red-500 rounded-full blur-[2px]"
                        initial={{ x: 0, opacity: 1 }}
                        animate={{ x: 100, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>

            {/* Source 2: Stripe */}
            <div className="relative group">
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-600/20 flex items-center justify-center text-indigo-500">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-zinc-200 font-medium">Stripe</div>
                            <div className="text-[10px] text-zinc-500">Live Feed</div>
                        </div>
                    </div>
                </div>
                 {/* Particle Emitter */}
                 {stage === 'ingesting' && (
                    <motion.div
                        className="absolute right-0 top-1/2 w-2 h-2 bg-indigo-500 rounded-full blur-[2px]"
                        initial={{ x: 0, opacity: 1 }}
                        animate={{ x: 100, opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.2 }}
                    />
                )}
            </div>
        </div>

        {/* CENTER PANEL: THE ENGINE */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 md:p-10">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>

            {/* Central Core */}
            <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center">

                {/* Orbital Rings */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-64 h-64 border border-zinc-800 rounded-full opacity-50"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-48 h-48 border border-zinc-700/50 rounded-full border-dashed opacity-50"
                />

                {/* The Lens / Scanner */}
                <div className="relative w-32 h-32 bg-black rounded-full border border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-transparent"></div>

                    {/* Status Icon in Core */}
                    <AnimatePresence mode="wait">
                        {stage === 'ingesting' && (
                            <motion.div
                                key="ingest"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="text-zinc-500"
                            >
                                <Database className="w-8 h-8 animate-pulse" />
                            </motion.div>
                        )}
                        {stage === 'scanning' && (
                            <motion.div
                                key="scan"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="text-blue-500"
                            >
                                <Search className="w-8 h-8 animate-pulse" />
                            </motion.div>
                        )}
                        {stage === 'anomaly' && (
                            <motion.div
                                key="anomaly"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="text-red-500"
                            >
                                <AlertCircle className="w-10 h-10 animate-bounce" />
                            </motion.div>
                        )}
                        {stage === 'reporting' && (
                            <motion.div
                                key="report"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="text-emerald-500"
                            >
                                <CheckCircle2 className="w-10 h-10" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Scanning Beam */}
                {stage === 'scanning' && (
                    <motion.div
                        className="absolute w-full h-1 bg-blue-500/50 blur-sm top-1/2 left-0"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>

            {/* Pop-up Anomaly Card */}
            <AnimatePresence>
                {stage === 'anomaly' && (
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.9 }}
                        className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-[#18181b] border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] rounded-lg p-5"
                    >
                        <div className="flex items-center gap-2 text-red-500 mb-3 border-b border-red-500/10 pb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-bold tracking-tight">DISCREPANCY DETECTED</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-zinc-300">
                                <span>Platform Reported:</span>
                                <span className="font-mono text-zinc-500">$1,800.00</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-300">
                                <span>Bank Received:</span>
                                <span className="font-mono text-zinc-500">$1,650.00</span>
                            </div>
                             <div className="flex justify-between items-center text-red-400 font-bold bg-red-500/10 p-2 rounded">
                                <span>Difference:</span>
                                <span className="font-mono">-$150.00</span>
                            </div>
                             <div className="text-[10px] text-zinc-500 mt-2">
                                Analysis: High probability of platform fee deduction or payout hold.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pop-up Report Card */}
            <AnimatePresence>
                {stage === 'reporting' && (
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.9 }}
                        className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-[#18181b] border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-lg p-5 flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-3">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-emerald-500 font-bold mb-1">Reconciled</h3>
                        <p className="text-zinc-500 text-[10px] mb-3">Transaction flagged and audit log updated.</p>
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* RIGHT PANEL: BANK FEED */}
        <div className="w-full md:w-1/4 border-l border-zinc-800/50 p-4 flex flex-col gap-4 bg-[#0a0a0b] z-10 relative">
             <div className="text-zinc-500 uppercase text-[10px] tracking-wider font-bold mb-2">Bank Deposits</div>

             <div className="relative group">
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-600/20 flex items-center justify-center text-blue-500">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-zinc-200 font-medium">Chase</div>
                            <div className="text-[10px] text-zinc-500">Connected</div>
                        </div>
                    </div>
                </div>
                {/* Particle Emitter */}
                 {stage === 'ingesting' && (
                    <motion.div
                        className="absolute left-0 top-1/2 w-2 h-2 bg-blue-500 rounded-full blur-[2px]"
                        initial={{ x: 0, opacity: 1 }}
                        animate={{ x: -100, opacity: 0 }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    />
                )}
            </div>
        </div>

      </div>

      {/* FOOTER: TERMINAL LOG */}
      <div className="h-24 bg-[#0c0c0e] border-t border-zinc-800 p-3 font-mono text-[10px] md:text-xs overflow-hidden flex flex-col justify-end">
        <div className="opacity-50 text-zinc-600 mb-1">root@zerithum-core:~/recon# tail -f live_logs.log</div>
        <div className="space-y-1">
            <motion.div
                animate={{ opacity: stage === 'ingesting' ? 1 : 0.4 }}
                className="flex gap-2 text-zinc-400"
            >
                <span className="text-blue-500">[INFO]</span> Ingesting batch 88291 from YouTube API...
            </motion.div>
             <motion.div
                animate={{ opacity: stage === 'scanning' ? 1 : 0.4 }}
                className="flex gap-2 text-zinc-400"
            >
                <span className="text-yellow-500">[WARN]</span> Analyzing transaction variance...
            </motion.div>
             <motion.div
                animate={{ opacity: stage === 'anomaly' ? 1 : 0.4 }}
                className="flex gap-2 text-red-400"
            >
                <span className="text-red-500">[CRITICAL]</span> Mismatch detected: ID_9921 (-150.00 USD)
            </motion.div>
             <motion.div
                animate={{ opacity: stage === 'reporting' ? 1 : 0.4 }}
                className="flex gap-2 text-emerald-400"
            >
                <span className="text-emerald-500">[SUCCESS]</span> Report generated. Audit trail locked.
            </motion.div>
        </div>
      </div>

      {/* Scanline Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none animate-scanline"></div>
    </div>
  );
};

export default DashboardPreview;
