import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, FileSpreadsheet, FileJson, Check, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formats = [
    { id: 'pdf', label: 'PDF Report', icon: FileText },
    { id: 'csv', label: 'CSV Data', icon: FileSpreadsheet },
    { id: 'json', label: 'Raw JSON', icon: FileJson },
];

export default function LandingExport() {
    const [selectedFormat, setSelectedFormat] = useState('pdf');
    const [status, setStatus] = useState('idle'); // idle, processing, complete

    const handleExport = () => {
        setStatus('processing');
        setTimeout(() => {
            setStatus('complete');
        }, 2000);
    };

    return (
        <div className="w-full max-w-5xl px-4 flex flex-col items-center">
            <motion.div
                className="w-full max-w-2xl bg-neutral-950/90 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden shadow-2xl relative"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <div className="p-1 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 h-10">
                    <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Export Wizard // v2.1</div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                        <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-8">
                        <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3 block">Select Output Format</label>
                        <div className="grid grid-cols-3 gap-4">
                            {formats.map((format) => (
                                <button
                                    key={format.id}
                                    onClick={() => setSelectedFormat(format.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 group relative overflow-hidden",
                                        selectedFormat === format.id
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                            : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <format.icon className={cn(
                                        "w-6 h-6 mb-2 transition-colors",
                                        selectedFormat === format.id ? "text-emerald-400" : "text-neutral-500 group-hover:text-neutral-300"
                                    )} />
                                    <span className="text-xs font-mono font-medium">{format.label}</span>

                                    {selectedFormat === format.id && (
                                        <motion.div
                                            layoutId="check"
                                            className="absolute top-2 right-2 text-emerald-500"
                                        >
                                            <Check className="w-3 h-3" />
                                        </motion.div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-neutral-900/50 rounded border border-white/5 p-4 mb-8">
                         <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-2">
                            <span>Period</span>
                            <span className="text-white">Current Fiscal Year (YTD)</span>
                         </div>
                         <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-neutral-600 w-3/4"></div>
                         </div>
                         <div className="flex justify-between mt-2 text-[10px] text-neutral-600 font-mono">
                            <span>JAN 01</span>
                            <span>DEC 31</span>
                         </div>
                    </div>

                    <div className="flex justify-end">
                        <AnimatePresence mode="wait">
                            {status === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Button
                                        onClick={handleExport}
                                        className="bg-white text-black hover:bg-neutral-200 font-mono text-xs h-10 px-6 tracking-wide"
                                    >
                                        INITIATE EXPORT sequence
                                    </Button>
                                </motion.div>
                            )}
                            {status === 'processing' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 text-emerald-400 font-mono text-xs px-4 h-10 bg-emerald-500/10 rounded border border-emerald-500/20"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>GENERATING REPORT...</span>
                                </motion.div>
                            )}
                            {status === 'complete' && (
                                <motion.div
                                    key="complete"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-neutral-500 font-mono uppercase">File Ready</span>
                                        <span className="text-white text-xs font-mono">Q3_Financials_Final.{selectedFormat}</span>
                                    </div>
                                    <Button
                                        onClick={() => setStatus('idle')} // Reset for demo
                                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs h-10 px-6 tracking-wide gap-2"
                                    >
                                        <Download className="w-3 h-3" />
                                        DOWNLOAD
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

             <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Audit-Ready Exports</h2>
                <p className="text-neutral-400 max-w-md mx-auto text-lg font-light">
                    Generate comprehensive tax reports and audit logs with a single click.
                    Formatted for your accountant or IRS.
                </p>
            </div>
        </div>
    );
}
