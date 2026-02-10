import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Server, CheckCircle2, Shield, AlertTriangle,
  Youtube, CreditCard, DollarSign, Store, Twitch,
  ArrowRight, FileText, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Technical Schematic Animation Component
export default function DataPipelineVisual() {
  const [activeStep, setActiveStep] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [anomalies, setAnomalies] = useState(0);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
      setProcessedCount((prev) => prev + Math.floor(Math.random() * 5));
      if (Math.random() > 0.8) setAnomalies((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sources = [
    { id: 'yt', name: 'YouTube', icon: Youtube, color: '#FF0000' },
    { id: 'stripe', name: 'Stripe', icon: CreditCard, color: '#635BFF' },
    { id: 'patreon', name: 'Patreon', icon: DollarSign, color: '#FF424D' },
    { id: 'gumroad', name: 'Gumroad', icon: Store, color: '#FF90E8' },
    { id: 'tiktok', name: 'TikTok', icon: Twitch, color: '#000000' } // Using Twitch icon as placeholder for TikTok
  ];

  return (
    <div className="w-full bg-black border border-white/10 p-8 font-mono relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center min-h-[500px]">

        {/* Stage 1: Ingestion Sources */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Ingestion Nodes</h3>
            <span className="text-[10px] text-emerald-500 animate-pulse">● LIVE</span>
          </div>

          <div className="space-y-3">
            {sources.map((source, index) => (
              <motion.div
                key={source.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] group"
              >
                <div className="flex items-center gap-3">
                  <source.icon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                  <span className="text-xs text-white/80">{source.name}</span>
                </div>
                {/* Data Packet Emission Animation */}
                <motion.div
                  animate={{
                    x: [0, 100, 200],
                    opacity: [1, 0.5, 0],
                    scale: [1, 0.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                  className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"
                />
              </motion.div>
            ))}
            <div className="mt-4 pt-4 border-t border-white/10 text-[10px] text-white/40 flex justify-between">
               <span>API STATUS: 200 OK</span>
               <span>LATENCY: 24ms</span>
            </div>
          </div>
        </div>

        {/* Stage 2: The Core / Matching Engine */}
        <div className="relative h-full flex flex-col justify-center items-center">

            {/* Connecting Lines (CSS based for simplicity in React) */}
            <div className="absolute inset-0 border-x border-white/5 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-[280px] bg-black border border-white/20 p-6 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-[10px] uppercase tracking-widest border border-white/20 text-white">
                    Core Logic
                </div>

                <div className="space-y-6">
                    {/* Step 1: Normalization */}
                    <div className={cn("flex items-center gap-3 transition-opacity duration-500", activeStep === 0 ? "opacity-100" : "opacity-40")}>
                        <Database className="w-5 h-5 text-blue-400" />
                        <div>
                            <div className="text-xs font-bold text-white">Normalize Schema</div>
                            <div className="text-[10px] text-white/50">Map to Unified Model</div>
                        </div>
                    </div>

                    {/* Step 2: Deduplication */}
                    <div className={cn("flex items-center gap-3 transition-opacity duration-500", activeStep === 1 ? "opacity-100" : "opacity-40")}>
                        <Shield className="w-5 h-5 text-purple-400" />
                        <div>
                            <div className="text-xs font-bold text-white">Deduplication</div>
                            <div className="text-[10px] text-white/50">Hash: SHA-256(tx_id)</div>
                        </div>
                    </div>

                    {/* Step 3: Bank Matching */}
                    <div className={cn("flex items-center gap-3 transition-opacity duration-500", activeStep === 2 ? "opacity-100" : "opacity-40")}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                            <div className="text-xs font-bold text-white">Reconciliation</div>
                            <div className="text-[10px] text-white/50">Match vs. Deposits</div>
                        </div>
                    </div>

                     {/* Step 4: Anomaly Detection */}
                     <div className={cn("flex items-center gap-3 transition-opacity duration-500", activeStep === 3 ? "opacity-100" : "opacity-40")}>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <div>
                            <div className="text-xs font-bold text-white">Autopsy Scan</div>
                            <div className="text-[10px] text-white/50">Detecting Variance</div>
                        </div>
                    </div>
                </div>

                {/* Simulated Terminal Output */}
                <div className="mt-6 pt-4 border-t border-white/10 font-mono text-[10px] text-emerald-500/80 h-16 overflow-hidden">
                    <div>> Ingesting batch #8921...</div>
                    <AnimatePresence mode='popLayout'>
                        {activeStep === 0 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>> Normalizing schemas...</motion.div>}
                        {activeStep === 1 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>> Hashing transaction IDs...</motion.div>}
                        {activeStep === 2 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>> Querying bank ledger...</motion.div>}
                        {activeStep === 3 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>> <span className="text-amber-500">Scanning for fee drift...</span></motion.div>}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* Stage 3: The Ledger / Output */}
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Immutable Ledger</h3>
                <Lock className="w-3 h-3 text-white/40" />
            </div>

            <div className="border border-white/10 bg-white/[0.02]">
                {/* Header */}
                <div className="grid grid-cols-3 p-2 border-b border-white/10 text-[10px] uppercase text-white/40">
                    <div>Time</div>
                    <div>Event</div>
                    <div className="text-right">Status</div>
                </div>
                {/* Simulated Rows */}
                <div className="p-2 space-y-2 text-[10px] font-mono">
                    <motion.div
                        key={processedCount}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-3 items-center text-white/80"
                    >
                        <div>{new Date().toLocaleTimeString()}</div>
                        <div>TX_MATCH</div>
                        <div className="text-right text-emerald-500">VERIFIED</div>
                    </motion.div>
                     <div className="grid grid-cols-3 items-center text-white/60">
                        <div>{new Date(Date.now() - 2000).toLocaleTimeString()}</div>
                        <div>TX_INGEST</div>
                        <div className="text-right text-blue-500">PENDING</div>
                    </div>
                     <div className="grid grid-cols-3 items-center text-white/60">
                        <div>{new Date(Date.now() - 5000).toLocaleTimeString()}</div>
                        <div>VARIANCE</div>
                        <div className="text-right text-amber-500">FLAGGED</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="p-3 border border-white/10 bg-white/[0.02]">
                    <div className="text-[10px] uppercase text-white/40 mb-1">Records Secured</div>
                    <div className="text-xl font-bold text-white">{processedCount.toLocaleString()}</div>
                 </div>
                 <div className="p-3 border border-white/10 bg-white/[0.02]">
                    <div className="text-[10px] uppercase text-white/40 mb-1">Anomalies</div>
                    <div className="text-xl font-bold text-amber-500">{anomalies}</div>
                 </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-white/40">
                <FileText className="w-3 h-3" />
                <span>EXPORT READY: CSV, JSON, PDF</span>
            </div>
        </div>

      </div>
    </div>
  );
}
