import React from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    ShieldCheck,
    FileText
} from 'lucide-react';
import FeaturePoint from './accuracy/FeaturePoint';
import ProofWidget from './accuracy/ProofWidget';

const AccuracySection = () => {
    return (
        <section id="accuracy" className="py-24 relative bg-zinc-950 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Copy Side */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8 sticky top-24"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-[1px] w-8 bg-emerald-500"></div>
                                <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest">System Integrity</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                                Verification logic you can see.
                            </h2>
                            <p className="text-lg text-zinc-400 leading-relaxed font-light">
                                Revenue data is too important for black boxes. Inspect the lineage of every cent, from API response to bank settlement, with military-grade audit trails.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeaturePoint
                                icon={Search}
                                title="Full Lineage Tracking"
                                desc="Click to trace the origin of any transaction through every system hop."
                            />
                            <FeaturePoint
                                icon={FileText}
                                title="Human Readable Reasoning"
                                desc="Understand exactly why a match was made or missed with plain text logs."
                            />
                            <FeaturePoint
                                icon={ShieldCheck}
                                title="Dispute and Resolve"
                                desc="Flag anomalies and force resolve edge cases directly in the timeline."
                            />
                        </div>

                        <div className="pt-8 border-t border-zinc-900">
                             <div className="flex items-center gap-3 text-sm text-zinc-500 font-mono">
                                <div className="flex -space-x-2">
                                     <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px] text-zinc-300">YT</div>
                                     <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px] text-zinc-300">S</div>
                                     <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[10px] text-zinc-300">+20</div>
                                </div>
                                <span>Ingesting from 20+ platforms & custom APIs</span>
                             </div>
                        </div>
                    </motion.div>

                    {/* Interactive Widget Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full relative group"
                    >
                        {/* Decorative glow behind widget */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                        <ProofWidget />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AccuracySection;
