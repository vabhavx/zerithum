import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Server, FileCheck, Cloud, Cpu, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);

    // Auto-cycle steps for demo
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="how-it-works" className="py-24 bg-white border-b border-zinc-200 relative">
             <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* Left Column: Logic Steps */}
                    <div className="flex-1 space-y-12">
                         <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                <Cpu className="w-3 h-3 text-zinc-600" />
                                Processing Pipeline
                            </div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight font-sans">
                                Operational Logic.
                            </h2>
                            <p className="text-zinc-600 leading-relaxed font-mono text-sm">
                                A deterministic state machine for revenue verification.
                            </p>
                        </div>

                        <div className="space-y-6 relative">
                            {/* Connecting Line */}
                            <div className="absolute left-6 top-6 bottom-6 w-px bg-zinc-200"></div>

                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "relative pl-16 py-4 transition-opacity duration-500",
                                        activeStep === index ? "opacity-100" : "opacity-40"
                                    )}
                                >
                                    {/* Step Number/Indicator */}
                                    <div className={cn(
                                        "absolute left-0 top-6 w-12 h-12 rounded-lg border flex items-center justify-center font-mono text-sm font-bold bg-white z-10 transition-colors duration-300",
                                        activeStep === index
                                            ? "border-emerald-600 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                            : "border-zinc-200 text-zinc-400"
                                    )}>
                                        0{index + 1}
                                    </div>

                                    <h3 className="text-lg font-medium text-zinc-900 mb-2 font-sans">{step.title}</h3>
                                    <p className="text-sm text-zinc-600 leading-relaxed font-mono">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Live Schematic */}
                    <div className="flex-1 w-full sticky top-24">
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
                             {/* Schematic Header */}
                             <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
                                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-emerald-500" />
                                    LIVE_EXECUTION_FLOW
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600">
                                    T-STATE: {activeStep}
                                </div>
                             </div>

                             {/* Diagram Area */}
                             <div className="flex-1 p-8 relative flex items-center justify-center">
                                 {/* Grid Background */}
                                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                                 <div className="relative z-10 w-full max-w-sm flex flex-col gap-8">

                                     {/* Node 1: Ingest */}
                                     <SchematicNode
                                        active={activeStep === 0}
                                        icon={Cloud}
                                        label="INGEST_LAYER"
                                        sub="API / Webhooks"
                                        status={activeStep === 0 ? "PULLING" : "IDLE"}
                                     />

                                     <SchematicConnection active={activeStep >= 0} />

                                     {/* Node 2: Logic */}
                                     <div className="flex gap-4">
                                         <SchematicNode
                                            active={activeStep === 1}
                                            icon={Server}
                                            label="NORMALIZE"
                                            status={activeStep === 1 ? "PROCESSING" : "WAITING"}
                                            className="flex-1"
                                         />
                                         <SchematicNode
                                            active={activeStep === 1}
                                            icon={Database}
                                            label="LEDGER"
                                            status="SYNC"
                                            className="flex-1"
                                         />
                                     </div>

                                     <SchematicConnection active={activeStep >= 1} />

                                     {/* Node 3: Output */}
                                     <SchematicNode
                                        active={activeStep === 2}
                                        icon={FileCheck}
                                        label="RECONCILIATION"
                                        sub="Audit & Tax"
                                        status={activeStep === 2 ? "FINALIZING" : "PENDING"}
                                     />

                                     {/* Data Packet Animation */}
                                     <AnimatePresence>
                                         <motion.div
                                            className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] z-20"
                                            animate={{
                                                top: ["10%", "50%", "90%"],
                                                opacity: [0, 1, 1, 0]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "linear",
                                                times: [0, 0.5, 1]
                                            }}
                                         />
                                     </AnimatePresence>

                                 </div>
                             </div>

                             {/* Terminal Log */}
                             <div className="h-32 bg-black border-t border-zinc-800 p-4 font-mono text-[10px] text-zinc-400 overflow-hidden relative">
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/80"></div>
                                <div className="space-y-1 opacity-70">
                                    <div>[14:20:01] INGEST: Starting batch process id=9928</div>
                                    <div className={activeStep === 0 ? "text-emerald-500" : ""}>[14:20:02] API: Fetched 450 transactions from Stripe</div>
                                    <div className={activeStep === 1 ? "text-emerald-500" : ""}>[14:20:03] NORM: Transforming schema to standard model... OK</div>
                                    <div className={activeStep === 1 ? "text-emerald-500" : ""}>[14:20:03] LEDGER: Bank feed sync complete. 452 deposits found.</div>
                                    <div className={activeStep === 2 ? "text-emerald-500" : ""}>[14:20:04] MATCH: 448 exact matches. 2 discrepancies flagged.</div>
                                    <div>[14:20:04] AUDIT: Write-ahead log committed. hash=0x77a8b...</div>
                                    <div>[14:20:05] EXPORT: Generated PDF report for Q3.</div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const steps = [
    {
        title: "Platform Integration",
        description: "Zerithum establishes secure, read-only OAuth connections to your revenue platforms. We ingest transaction metadata, fees, and currency details in real-time."
    },
    {
        title: "Bank Feed Synchronization",
        description: "We pull deposit data via Plaid to create a shadow ledger. This acts as the source of truth, preventing platform dashboard errors from propagating to your books."
    },
    {
        title: "Reconciliation & Audit",
        description: "Our engine matches every payout to a deposit. Discrepancies are flagged with reason codes. The result is an immutable audit trail ready for tax season."
    }
];

const SchematicNode = ({ active, icon: Icon, label, sub, status, className }) => (
    <div className={cn(
        "bg-zinc-950 border rounded-lg p-3 flex items-center gap-3 transition-all duration-300",
        active ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "border-zinc-800",
        className
    )}>
        <div className={cn(
            "w-8 h-8 rounded flex items-center justify-center border transition-colors",
            active ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-600"
        )}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <div className={cn("text-[10px] font-bold tracking-wider", active ? "text-emerald-400" : "text-zinc-500")}>
                {label}
            </div>
            {sub && <div className="text-[9px] text-zinc-600 font-mono truncate">{sub}</div>}
        </div>
        <div className={cn(
            "text-[9px] font-mono px-1.5 py-0.5 rounded",
            active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-900 text-zinc-700"
        )}>
            {status}
        </div>
    </div>
);

const SchematicConnection = ({ active }) => (
    <div className="h-8 w-px bg-zinc-800 mx-auto relative overflow-hidden">
        {active && (
            <motion.div
                className="absolute top-0 left-0 right-0 h-1/2 bg-emerald-500/50 blur-[1px]"
                animate={{ top: ["-50%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
        )}
    </div>
);

export default HowItWorks;
