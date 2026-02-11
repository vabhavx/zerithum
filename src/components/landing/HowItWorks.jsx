import React from 'react';
import { motion } from 'framer-motion';
import { Database, ArrowRight, Server, FileCheck, Shield, Download, Cloud } from 'lucide-react';

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 relative z-10">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">How it works</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                        Automated financial operations for the modern creator economy.
                    </p>
                </div>

                {/* Pipeline Animation */}
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-8 mb-16 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>

                    <div className="flex justify-between items-center relative z-10 min-w-[800px] overflow-x-auto pb-4">
                        {/* Nodes */}
                        <PipelineNode icon={Cloud} label="Platforms" />
                        <PipelineArrow />
                        <PipelineNode icon={Server} label="Ingestion" active />
                        <PipelineArrow />
                        <PipelineNode icon={Database} label="Bank Feed" />
                        <PipelineArrow />
                        <PipelineNode icon={FileCheck} label="Matching" active />
                        <PipelineArrow />
                        <PipelineNode icon={Shield} label="Audit Log" />
                        <PipelineArrow />
                        <PipelineNode icon={Download} label="Export" />

                        {/* Animated Data Particle */}
                        <motion.div
                            animate={{
                                x: [0, 800], // Adjust based on container width
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute top-1/2 left-10 w-3 h-3 bg-emerald-500 rounded-full blur-[2px] shadow-[0_0_10px_#10b981]"
                        />
                    </div>
                </div>

                {/* 3 Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-sm">01</div>
                        <h3 className="text-xl font-medium text-white">Connect platforms</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Zerithum ingests transaction metadata from platform APIs. We support 20+ integrations including YouTube, Stripe, and Patreon.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-sm">02</div>
                        <h3 className="text-xl font-medium text-white">Connect bank feed</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Read-only access via Plaid. We never store bank credentials and cannot initiate transactions. Manual statement upload is also supported.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-sm">03</div>
                        <h3 className="text-xl font-medium text-white">Reconcile & Export</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            Zerithum reconciles payouts, flags anomalies for review, and writes an immutable audit trail. Generate tax-ready reports in one click.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const PipelineNode = ({ icon: Icon, label, active = false }) => (
    <div className="flex flex-col items-center gap-3 relative group">
        <div className={`w-16 h-16 rounded-xl border flex items-center justify-center transition-all duration-500 ${active ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700'}`}>
            <Icon className={`w-6 h-6 ${active ? 'text-emerald-500' : 'text-zinc-500'}`} />
        </div>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
    </div>
);

const PipelineArrow = () => (
    <div className="flex-1 px-2 flex justify-center opacity-30">
        <ArrowRight className="w-4 h-4 text-zinc-600" />
    </div>
);

export default HowItWorks;
