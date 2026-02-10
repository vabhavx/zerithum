import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, CheckCircle2, AlertTriangle, ArrowRight,
    Youtube, DollarSign, Building2, Search
} from 'lucide-react';

export function DashboardPreview() {
  const [step, setStep] = useState(0);

  // Animation sequence loop
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 4000); // 4 second cycle per step
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full bg-[#0A0A0B] flex flex-col font-mono text-sm relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0A0B]/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold tracking-wider">ACTION REQUIRED</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-neutral-500 text-xs">RECONCILIATION QUEUE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>LIVE ENGINE</span>
        </div>
      </div>

      {/* Main Content - The Wedge Interaction */}
      <div className="relative z-10 flex-1 p-8 flex flex-col justify-center items-center">

         <div className="w-full max-w-2xl bg-neutral-900/50 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm relative">

            {/* Status Bar */}
            <div className="h-1 w-full bg-neutral-800">
                <motion.div
                    className="h-full bg-amber-500"
                    initial={{ width: "0%" }}
                    animate={{ width: step >= 1 ? "100%" : "30%" }}
                    transition={{ duration: 1 }}
                />
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                {/* Left: Platform Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-wider">
                        <Youtube className="w-4 h-4 text-red-500" />
                        Platform Report
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-lg">
                        <div className="text-neutral-500 text-xs mb-1">Estimated Payout</div>
                        <div className="text-2xl font-bold text-white">USD 1,800.00</div>
                        <div className="text-xs text-neutral-600 mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Verified via API</span>
                        </div>
                    </div>
                </div>

                {/* Center: The Wedge / Logic */}
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="scan"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <Search className="w-6 h-6 text-blue-400 animate-pulse" />
                                <span className="text-xs text-blue-400">Scanning Deposits...</span>
                            </motion.div>
                        )}
                         {step === 1 && (
                            <motion.div
                                key="match"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                                    MISMATCH DETECTED
                                </div>
                            </motion.div>
                        )}
                        {step >= 2 && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="text-red-400 font-mono font-bold text-lg">
                                    - USD 150.00
                                </div>
                                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">VARIANCE</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </div>

                {/* Right: Bank Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-wider">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        Bank Deposit
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-lg relative overflow-hidden">
                        <div className="text-neutral-500 text-xs mb-1">Chase Checking ••4291</div>
                        <div className="text-2xl font-bold text-white">USD 1,650.00</div>
                         <div className="text-xs text-neutral-600 mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Settled Oct 14</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Explainer / Audit Log */}
            <AnimatePresence>
                {step >= 2 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-white/[0.02]"
                    >
                        <div className="p-4 flex items-start gap-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium mb-1">Variance Flagged: Platform Fee?</h4>
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    System detected a <span className="text-white">8.3% deduction</span> consistent with YouTube platform fees + tax withholding.
                                </p>
                            </div>
                            <div className="px-4 py-2 bg-white text-black text-xs font-bold rounded cursor-pointer hover:bg-neutral-200">
                                ACCEPT MATCH
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

         </div>

         {/* Context Message */}
         <div className="mt-8 text-center opacity-60">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">ZERITHUM RECONCILIATION ENGINE v2.4</p>
            <div className="flex justify-center gap-4 text-[10px] text-neutral-600">
                <span>ID: wx_99281_xya</span>
                <span>•</span>
                <span>LATENCY: 24ms</span>
                <span>•</span>
                <span>CONFIDENCE: 98.2%</span>
            </div>
         </div>

      </div>
    </div>
  );
}
