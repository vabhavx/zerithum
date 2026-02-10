import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Youtube, Landmark, ArrowRight, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function WedgeReconciliation() {
  const [step, setStep] = useState(0);

  // Animation Loop Sequence
  useEffect(() => {
    let mounted = true;
    const sequence = async () => {
      while (mounted) {
        if (!mounted) break;
        setStep(1); // Cards Fade In
        await new Promise(r => setTimeout(r, 800));
        if (!mounted) break;

        setStep(2); // Numbers Type In
        await new Promise(r => setTimeout(r, 600));
        if (!mounted) break;

        setStep(3); // Connector Draws
        await new Promise(r => setTimeout(r, 800));
        if (!mounted) break;

        setStep(4); // Confidence Badge
        await new Promise(r => setTimeout(r, 800));
        if (!mounted) break;

        setStep(5); // Red Flag
        await new Promise(r => setTimeout(r, 1000));
        if (!mounted) break;

        setStep(6); // Audit Line
        await new Promise(r => setTimeout(r, 4000)); // Hold for reading
        if (!mounted) break;

        setStep(0); // Reset
        await new Promise(r => setTimeout(r, 500));
      }
    };
    sequence();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full py-24 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="max-w-5xl w-full px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">The Truth Gap</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Platforms report what they sent. Banks report what arrived. We bridge the difference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative h-[400px]">
          {/* Left Card: Platform */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : -50 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center md:justify-end z-10"
          >
            <Card className="w-64 h-48 bg-neutral-900 border-neutral-800 p-6 flex flex-col justify-between relative shadow-2xl">
              <div className="flex items-center gap-2 text-neutral-400">
                <Youtube className="w-5 h-5 text-red-500" />
                <span className="text-sm font-mono uppercase tracking-wider">Platform</span>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Reported Earnings</div>
                <div className="text-3xl font-mono text-white font-bold tracking-tight">
                  {step >= 2 ? (
                     <motion.span
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                     >
                       $1,800.00
                     </motion.span>
                  ) : <span className="opacity-0">$0.00</span>}
                </div>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: step >= 2 ? "100%" : "0%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </Card>
          </motion.div>

          {/* Center: Connector & Logic */}
          <div className="flex flex-col items-center justify-center h-full relative z-20">
            {/* Connector Line SVG */}
            <svg className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 pointer-events-none hidden md:block" overflow="visible" viewBox="0 0 100 80" preserveAspectRatio="none">
               <motion.path
                 d="M 0 40 L 100 40" // Straight line across full width
                 fill="none"
                 stroke={step >= 5 ? "#ef4444" : "#3b82f6"} // Blue to Red on error
                 strokeWidth="2"
                 strokeDasharray="10 10" // Dashed line
                 initial={{ pathLength: 0, opacity: 0 }}
                 animate={{
                   pathLength: step >= 3 ? 1 : 0,
                   opacity: step >= 3 ? 0.5 : 0
                 }}
                 transition={{ duration: 0.8 }}
               />
            </svg>

            {/* Status Badge */}
            <AnimatePresence mode="wait">
              {step === 4 && (
                <motion.div
                  key="badge-confidence"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="bg-blue-900/50 text-blue-300 border border-blue-700/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="font-mono text-sm">Matching... (0.85)</span>
                </motion.div>
              )}

              {step >= 5 && (
                 <motion.div
                   key="badge-error"
                   initial={{ scale: 0.8, opacity: 0, y: -20 }}
                   animate={{ scale: 1, opacity: 1, y: 0 }}
                   className="bg-red-950/80 text-red-400 border border-red-800 px-6 py-4 rounded-xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.2)] backdrop-blur-md min-w-[200px]"
                 >
                   <div className="flex items-center gap-2 font-bold text-lg">
                     <AlertCircle className="w-5 h-5" />
                     <span>DISCREPANCY</span>
                   </div>
                   <div className="font-mono text-xl text-white">-$150.00</div>
                   <div className="text-xs uppercase tracking-widest bg-red-900/50 px-2 py-0.5 rounded text-red-300">
                     Reason: Fee / Hold
                   </div>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Card: Bank */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : 50 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center md:justify-start z-10"
          >
            <Card className="w-64 h-48 bg-neutral-900 border-neutral-800 p-6 flex flex-col justify-between relative shadow-2xl">
              <div className="flex items-center gap-2 text-neutral-400">
                <Landmark className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-mono uppercase tracking-wider">Bank</span>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Actual Deposit</div>
                <div className="text-3xl font-mono text-white font-bold tracking-tight">
                  {step >= 2 ? (
                     <motion.span
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                     >
                       $1,650.00
                     </motion.span>
                  ) : <span className="opacity-0">$0.00</span>}
                </div>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                 <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: step >= 2 ? "100%" : "0%" }}
                  transition={{ duration: 0.8, delay: 0.2 }} // Slight delay for bank
                />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Audit Trail - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-8 pointer-events-none">
          <AnimatePresence>
            {step >= 6 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-2xl bg-black/80 backdrop-blur border border-neutral-800 rounded-lg p-3 flex items-center justify-between gap-4 font-mono text-xs text-neutral-400"
              >
                <div className="flex items-center gap-3">
                   <FileText className="w-4 h-4 text-neutral-500" />
                   <span className="text-neutral-600">{new Date().toISOString().split('T')[0]} 14:32:01</span>
                </div>
                <div className="flex-1 font-mono text-neutral-300">
                   MATCH_ID: <span className="text-blue-400">0x8F2A...9C</span>
                </div>
                <div className="flex items-center gap-2">
                   <span>STATUS:</span>
                   <span className="text-red-400 font-bold">FLAGGED</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
