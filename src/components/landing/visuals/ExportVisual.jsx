import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Share2, CheckCircle2, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ExportVisual = () => {
    const [step, setStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Auto-play on mount
        setIsPlaying(true);

        let interval;
        if (isPlaying) {
            // Sequence:
            // 0: Summary View (2s)
            // 1: Generating Report (1.5s)
            // 2: Report Ready / Drawer Open (4s)
            // Reset
            const times = [2000, 1500, 4000];
            let current = 0;

            const next = () => {
                setStep((prev) => (prev + 1) % 3);
                current = (current + 1) % 3;
                interval = setTimeout(next, times[current]);
            };

            interval = setTimeout(next, times[0]);
        }
        return () => clearTimeout(interval);
    }, [isPlaying]);

    return (
        <div className="w-full bg-zinc-950 rounded-xl border border-zinc-800 p-8 h-[650px] md:h-[450px] relative overflow-hidden flex items-center justify-center">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* Summary Card */}
                <motion.div
                    animate={{
                        scale: step === 2 ? 0.9 : 1,
                        opacity: step === 2 ? 0.5 : 1,
                        y: step === 2 ? -20 : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl z-10 relative"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="font-serif text-lg text-white">October 2023</div>
                        <div className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            RECONCILED
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                            <div className="text-zinc-500 text-xs mb-1">Total Revenue</div>
                            <div className="text-white font-mono text-lg">$14,230.50</div>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                            <div className="text-zinc-500 text-xs mb-1">Bank Deposits</div>
                            <div className="text-white font-mono text-lg">$14,180.00</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-zinc-400">
                            <span>Reconciliation Rate</span>
                            <span className="text-white">100%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                            <span>0 Pending</span>
                            <span>0 Flagged</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                         <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                            <Download className="w-3 h-3 mr-2" /> Export Pack
                         </Button>
                    </div>

                    {/* Cursor Simulation for Step 1 */}
                    {step === 0 && (
                        <motion.div
                            initial={{ x: 100, y: 100, opacity: 0 }}
                            animate={{ x: 280, y: 220, opacity: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="absolute w-4 h-4 rounded-full bg-white/50 border border-white pointer-events-none z-50"
                        />
                    )}
                </motion.div>

                {/* Export Drawer (Step 2) */}
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: step === 2 ? 0 : "100%" }} // Only show fully in step 2? Actually step 1 is "loading/generating".
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 20 }}
                            className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">Export Ready</div>
                                        <div className="text-xs text-zinc-500">Generated on {new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="text-xs">
                                    <Share2 className="w-3 h-3 mr-2" /> Share Link
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex items-center gap-3 hover:border-zinc-600 transition-colors cursor-pointer group">
                                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="text-zinc-200 text-sm font-medium">Revenue.csv</div>
                                        <div className="text-[10px] text-zinc-500">14KB • Comma Separated</div>
                                    </div>
                                </div>
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex items-center gap-3 hover:border-zinc-600 transition-colors cursor-pointer group">
                                    <FileText className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="text-zinc-200 text-sm font-medium">Audit_Log.pdf</div>
                                        <div className="text-[10px] text-zinc-500">2.4MB • PDF Document</div>
                                    </div>
                                </div>
                                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex items-center gap-3 hover:border-zinc-600 transition-colors cursor-pointer group">
                                    <FileJson className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="text-zinc-200 text-sm font-medium">Raw_Data.json</div>
                                        <div className="text-[10px] text-zinc-500">840KB • JSON</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                 {/* Loading Overlay (Step 1) */}
                 <AnimatePresence>
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center flex-col gap-4"
                        >
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-emerald-500 text-xs font-mono animate-pulse">GENERATING_AUDIT_PROOF...</div>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>
    );
};

export default ExportVisual;
