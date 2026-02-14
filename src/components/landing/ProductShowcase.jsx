import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, FileDown, ScanLine, Activity, Layers } from 'lucide-react';
import IngestionVisual from './visuals/IngestionVisual';
import AutopsyVisual from './visuals/AutopsyVisual';
import ExportVisual from './visuals/ExportVisual';
import { cn } from '@/lib/utils';

const features = [
    {
        id: 'reconcile',
        title: 'Reconciliation Engine',
        subtitle: 'Ingestion & Matching',
        description: 'Deterministic matching of platform reported earnings against bank deposits. Confidence scoring and anomaly detection included.',
        visual: IngestionVisual,
        icon: Database,
        stats: { latency: '12ms', reliability: '99.9%', throughput: 'High' }
    },
    {
        id: 'autopsy',
        title: 'Revenue Autopsy',
        subtitle: 'Deep Inspection',
        description: 'Drill down into any transaction. View full lineage from API response to bank settlement with diff-view analysis.',
        visual: AutopsyVisual,
        icon: Search,
        stats: { depth: 'L3', granular: 'Yes', mode: 'Live' }
    },
    {
        id: 'export',
        title: 'Audit & Export',
        subtitle: 'Compliance Output',
        description: 'Generate immutable audit trails and tax-ready reports. One-click export for accounting defense.',
        visual: ExportVisual,
        icon: FileDown,
        stats: { format: 'CSV/PDF', audit: 'SOC2', retention: '7yr' }
    }
];

const ProductShowcase = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section id="product" className="py-24 bg-zinc-50 border-b border-zinc-200 relative overflow-hidden">
             {/* Technical Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest shadow-sm">
                            <Layers className="w-3 h-3 text-emerald-600" />
                            Core Modules
                        </div>
                        <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight font-sans">
                            The Source of Truth.
                        </h2>
                        <p className="text-zinc-600 leading-relaxed max-w-xl font-mono text-sm">
                            Zerithum connects the dots between platform activity and bank reality.
                            Three specialized engines working in concert.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Module Selector */}
                    <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                        {features.map((feature, index) => {
                            const isActive = activeIndex === index;
                            const Icon = feature.icon;

                            return (
                                <div
                                    key={feature.id}
                                    onClick={() => setActiveIndex(index)}
                                    className={cn(
                                        "group relative p-4 rounded border transition-all duration-200 cursor-pointer overflow-hidden",
                                        isActive
                                            ? "bg-white border-zinc-900 shadow-lg scale-[1.02]"
                                            : "bg-white border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                                    )}
                                >
                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900"></div>
                                    )}

                                    <div className="flex items-start gap-4 pl-2">
                                        <div className={cn(
                                            "mt-1 w-8 h-8 rounded flex items-center justify-center border transition-colors",
                                            isActive
                                                ? "bg-zinc-900 border-zinc-900 text-white"
                                                : "bg-zinc-50 border-zinc-200 text-zinc-400 group-hover:border-zinc-300"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        <div className="space-y-1 flex-1">
                                            <div className="flex justify-between items-center">
                                                <h3 className={cn(
                                                    "font-mono text-sm font-semibold uppercase tracking-wide",
                                                    isActive ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700"
                                                )}>
                                                    {feature.title}
                                                </h3>
                                                {isActive && <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />}
                                            </div>

                                            <div className="text-xs text-zinc-400 font-mono pb-2">{feature.subtitle}</div>

                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="text-sm text-zinc-600 leading-relaxed pt-2 border-t border-zinc-100">
                                                            {feature.description}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Viewport Window */}
                    <div className="hidden lg:block lg:col-span-8 sticky top-24">
                        <div className="relative bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 overflow-hidden min-h-[600px] flex flex-col">
                             {/* Window Header */}
                             <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <ScanLine className="w-3 h-3" />
                                    {features[activeIndex].id}_VIEWPORT
                                </div>
                                <div className="w-12"></div> {/* Spacer */}
                             </div>

                             {/* Viewport Content */}
                             <div className="flex-1 bg-zinc-900 relative p-8 flex items-center justify-center overflow-hidden">
                                {/* Grid Overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                                <div className="relative z-10 w-full h-full">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeIndex}
                                            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full h-full flex items-center justify-center"
                                        >
                                            {React.createElement(features[activeIndex].visual)}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                             </div>

                             {/* Window Footer / Metadata */}
                             <div className="h-12 bg-zinc-950 border-t border-zinc-800 px-6 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                                 <div className="flex gap-8">
                                     {Object.entries(features[activeIndex].stats).map(([key, value]) => (
                                         <div key={key} className="flex flex-col">
                                             <span className="uppercase text-zinc-600 mb-0.5">{key}</span>
                                             <span className="text-zinc-300">{value}</span>
                                         </div>
                                     ))}
                                 </div>
                                 <div className="flex items-center gap-2 text-emerald-500/80">
                                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                     MODULE ACTIVE
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Mobile Visual Fallback */}
                    <div className="lg:hidden col-span-1">
                        <div className="bg-zinc-100 rounded border border-zinc-200 p-4 min-h-[300px] flex items-center justify-center overflow-hidden">
                             {React.createElement(features[activeIndex].visual)}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ProductShowcase;
