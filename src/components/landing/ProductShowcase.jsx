import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import IngestionVisual from './visuals/IngestionVisual';
import AutopsyVisual from './visuals/AutopsyVisual';
import ExportVisual from './visuals/ExportVisual';
import { cn } from '@/lib/utils';
import ScrollReveal from '@/components/ui/ScrollReveal';

const features = [
    {
        id: 'reconcile',
        title: 'Reconcile to bank deposits',
        description: 'Match platform reported earnings against bank deposits, flag discrepancies, confidence scoring.',
        visual: IngestionVisual
    },
    {
        id: 'autopsy',
        title: 'Revenue Autopsy',
        description: 'Drilldown: transaction to payout to deposit, plus the reconciliation decision and notes.',
        visual: AutopsyVisual
    },
    {
        id: 'export',
        title: 'Export for accountant',
        description: 'Tax ready reporting and reconciliation notes for audit defense, plus standard export formats.',
        visual: ExportVisual
    }
];

const ProductShowcase = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section id="product" className="py-24 bg-zinc-950 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left Column: Navigation / Toggles */}
                    <div className="col-span-1 lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <ScrollReveal
                                baseOpacity={0}
                                enableBlur={true}
                                baseRotation={5}
                                blurStrength={10}
                                textClassName="text-3xl md:text-4xl font-serif font-semibold text-white leading-tight"
                                containerClassName="mb-4"
                            >
                                The Source of Truth.
                            </ScrollReveal>
                            <p className="text-zinc-400">
                                Zerithum connects the dots between platform activity and bank reality.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {features.map((feature, index) => {
                                const VisualComponent = feature.visual;
                                const isActive = activeIndex === index;

                                return (
                                    <div
                                        key={feature.id}
                                        className={cn(
                                            "group rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
                                            isActive
                                                ? "bg-zinc-900 border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                                                : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
                                        )}
                                        onClick={() => setActiveIndex(index)}
                                    >
                                        {/* Header / Toggle */}
                                        <div className="p-6 flex items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <h3 className={cn(
                                                    "font-medium text-lg transition-colors",
                                                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                                )}>
                                                    {feature.title}
                                                </h3>

                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.p
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="text-sm text-zinc-400 leading-relaxed block"
                                                        >
                                                            {feature.description}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Icon */}
                                            <div className={cn(
                                                "mt-1 w-6 h-6 flex items-center justify-center rounded-full border transition-all shrink-0",
                                                isActive
                                                    ? "bg-emerald-500 border-emerald-500 text-black"
                                                    : "border-zinc-700 text-zinc-600"
                                            )}>
                                               {isActive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </div>
                                        </div>

                                        {/* Mobile Visual Inline */}
                                        <div className="lg:hidden">
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t border-zinc-800 bg-zinc-950/50"
                                                    >
                                                        <div className="p-4">
                                                            <VisualComponent />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Desktop Visual */}
                    <div className="hidden lg:block lg:col-span-8 sticky top-24">
                        <div className="relative min-h-[600px] w-full bg-zinc-900/20 rounded-2xl border border-zinc-800 p-2 backdrop-blur-sm">
                             {/* Decoration */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 rounded-2xl pointer-events-none"></div>

                             <div className="relative z-10 h-full p-6 flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full"
                                    >
                                        {React.createElement(features[activeIndex].visual)}
                                    </motion.div>
                                </AnimatePresence>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ProductShowcase;
