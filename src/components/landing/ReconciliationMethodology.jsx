import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, ArrowRight, Shield, FileText, Database, Activity, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// We will implement animations in the next step
import MethodologyAnimations from './methodology/MethodologyAnimations';

const ReconciliationMethodology = () => {
    const [view, setView] = useState('simple'); // 'simple' or 'full'

    return (
        <section id="how-it-works" className="py-24 bg-zinc-950 text-white relative z-10 overflow-hidden font-sans">
            <div className="max-w-5xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">How reconciliation works</h2>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                        Zerithum matches what platforms say you earned to what your bank actually received. Mismatches are flagged with reason codes. Every decision is logged for tax defense.
                    </p>
                    <p className="text-[15px] leading-[1.6] text-zinc-500 max-w-3xl mx-auto">
                        Creators earn from multiple platforms with different payout schedules, fees, and delays. Platform dashboards report earnings, but the numbers rarely match bank deposits. Zerithum connects to your platforms and bank via read-only access, compares platform earnings to actual deposits, scores matches by confidence, flags gaps with reason codes like fee deduction or hold period, and logs every decision in an immutable audit trail. Bank deposits are treated as the source of truth. Platform numbers are treated as inputs that must reconcile. The result is a clean export pack for your accountant.
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex flex-col items-center mb-20">
                    <div className="bg-zinc-900 p-1.5 rounded-lg inline-flex relative">
                        {['simple', 'full'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "relative px-8 py-2.5 text-sm font-medium transition-colors z-10 capitalize rounded-md",
                                    view === v ? "text-zinc-950" : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {v === 'simple' ? 'Simple explanation' : 'Full methodology'}
                                {view === v && (
                                    <motion.div
                                        className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                                        layoutId="toggleHighlight"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-4 font-mono tracking-wide">Switch views. The system stays the same. Only the explanation changes.</p>
                </div>

                {/* Content Area */}
                <div className="min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {view === 'simple' ? (
                            <SimpleView key="simple" />
                        ) : (
                            <FullView key="full" />
                        )}
                    </AnimatePresence>
                </div>

                {/* Disclaimer */}
                <div className="mt-32 pt-12 border-t border-zinc-900">
                    <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-6">What Zerithum does not do</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-zinc-500">
                        <li className="flex items-start gap-3">
                            <X className="w-4 h-4 mt-0.5 text-zinc-700 shrink-0" />
                            Does not move, hold, or settle your funds.
                        </li>
                        <li className="flex items-start gap-3">
                            <X className="w-4 h-4 mt-0.5 text-zinc-700 shrink-0" />
                            Does not initiate payouts, refunds, or transfers.
                        </li>
                        <li className="flex items-start gap-3">
                            <X className="w-4 h-4 mt-0.5 text-zinc-700 shrink-0" />
                            Does not see or store your bank login credentials.
                        </li>
                        <li className="flex items-start gap-3">
                            <X className="w-4 h-4 mt-0.5 text-zinc-700 shrink-0" />
                            Does not guarantee perfect matching for every platform in every country, because platform metadata quality varies.
                        </li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/methodology">
                        <Button variant="outline" className="h-12 px-8 w-full sm:w-auto border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-none">
                            View full reconciliation methodology
                        </Button>
                    </Link>
                    <Link to="/Signup">
                         <Button className="h-12 px-8 w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-200 rounded-none font-medium">
                            Create account
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

const SimpleView = () => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="grid md:grid-cols-2 gap-12 items-start"
    >
        <div className="space-y-12">
            <div className="space-y-4">
                <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-500 font-mono text-sm border border-zinc-800">1</div>
                <h3 className="text-xl font-medium text-white">Connect your platforms and bank via read only access.</h3>
                <p className="text-[15px] leading-[1.6] text-zinc-400">
                    Zerithum pulls earnings from platforms and deposits from your bank.
                </p>
            </div>
            <div className="space-y-4">
                <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-500 font-mono text-sm border border-zinc-800">2</div>
                <h3 className="text-xl font-medium text-white">Zerithum matches platform earnings to bank deposits using amount and date rules.</h3>
                <p className="text-[15px] leading-[1.6] text-zinc-400">
                    High confidence matches are auto reconciled. Uncertain matches go to review.
                </p>
            </div>
            <div className="space-y-4">
                <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-500 font-mono text-sm border border-zinc-800">3</div>
                <h3 className="text-xl font-medium text-white">Every match decision is logged with a confidence score and reason code.</h3>
                <p className="text-[15px] leading-[1.6] text-zinc-400">
                    You export a reconciled report for your accountant.
                </p>
            </div>
        </div>

        {/* Example Box */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 backdrop-blur-sm sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                <div className="p-2 bg-red-500/10 rounded text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-medium text-white">What a mismatch looks like</h4>
                    <p className="text-xs text-zinc-500">Real-world example</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-zinc-400">Platform (YouTube)</span>
                    </div>
                    <div className="font-mono text-white">$1,800.00</div>
                </div>

                <div className="flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm text-zinc-400">Bank Deposit</span>
                    </div>
                    <div className="font-mono text-white">$1,650.00</div>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                    <span className="text-sm font-medium text-red-400">Difference</span>
                    <span className="font-mono text-red-400">-$150.00</span>
                </div>

                <div className="pt-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Reason Code</div>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300">Fee deduction</span>
                        <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-600 opacity-50">Hold period</span>
                        <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-600 opacity-50">Refund</span>
                    </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded text-xs text-zinc-500 italic border border-zinc-900">
                    "Zerithum flags this, logs the confidence score, and includes the note in your export."
                </div>
            </div>
        </div>
    </motion.div>
);

const FullView = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-24"
    >
        {/* Section 1 & 2: Inputs & Matching */}
        <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-12">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">01</span>
                        Inputs we use
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-zinc-400">
                        Zerithum pulls transaction or payout records from connected platforms via OAuth or API. These include amount, date, transaction ID, category, and fee fields when available. Bank records include deposit amount, date, description, and reference IDs when available. Some platforms provide rich transaction detail. Others provide only payout summaries. Zerithum uses what exists and marks gaps explicitly.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">02</span>
                        How matching works
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-zinc-400">
                        Zerithum compares platform earnings to bank deposits using fuzzy matching on amount and date. For each bank deposit, the system searches for plausible platform candidates. Candidates are scored by how closely amount and date align. The highest confidence match is selected if the score passes a strict threshold.
                    </p>
                </div>
            </div>
            {/* Animation 1 Placement */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden min-h-[300px]">
                <MethodologyAnimations type="matching" />
            </div>
        </div>

        {/* Section 3 & 4: Confidence & Reason Codes */}
        <div className="grid md:grid-cols-2 gap-16">
            {/* Animation 2 Placement - Left side for variety */}
            <div className="order-2 md:order-1 bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden min-h-[300px]">
                 <MethodologyAnimations type="scoring" />
            </div>

            <div className="order-1 md:order-2 space-y-12">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">03</span>
                        Confidence scoring
                    </h3>
                    <div className="space-y-3">
                         <p className="text-[15px] leading-[1.6] text-zinc-400">
                            Every proposed match gets a confidence score between 0 and 1. Rules include:
                        </p>
                        <ul className="space-y-2 text-[15px] leading-[1.6] text-zinc-400 list-disc pl-4 marker:text-zinc-600">
                            <li>Exact amount and exact date produces a confidence score near 0.99, eligible for auto reconcile.</li>
                            <li>Amount within 2 percent and date within 1 day produces a confidence score around 0.85, sent for review.</li>
                            <li>Amount within 5 percent and date within 3 days produces a confidence score around 0.60, flagged for review.</li>
                        </ul>
                         <p className="text-[15px] leading-[1.6] text-zinc-400">
                            Auto reconcile happens only when confidence is 0.95 or higher. Below that threshold, the match is routed to your review queue.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">04</span>
                        Reason codes
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-zinc-400">
                        When Zerithum flags a mismatch, it assigns a reason code to explain the likely cause:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] text-zinc-500">
                         <li className="flex gap-2"><span className="text-zinc-300 font-medium">Fee deduction:</span> Platform fees reduced payout.</li>
                         <li className="flex gap-2"><span className="text-zinc-300 font-medium">Hold period:</span> Payout delayed for settlement.</li>
                         <li className="flex gap-2"><span className="text-zinc-300 font-medium">Refund:</span> Customer received money back.</li>
                         <li className="flex gap-2"><span className="text-zinc-300 font-medium">Duplicate:</span> Transaction appears twice.</li>
                         <li className="flex gap-2"><span className="text-zinc-300 font-medium">Unmatched:</span> No match found yet.</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Section 5, 6, 7: Review, Audit, Limitations */}
        <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-12">
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">05</span>
                        Review workflow
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-zinc-400">
                        When a match is flagged for review, you see platform amount, bank amount, difference, and suggested reason code. You can accept the match, reject it, manually link to a different deposit, or add a note explaining the gap. All actions are logged in the audit trail.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">06</span>
                        Audit trail
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-zinc-400">
                        Every reconciliation decision is logged in an immutable append only audit trail. Each entry includes timestamp, platform, amounts, confidence score, reason code, and any notes you added. The trail cannot be edited or deleted. This provides defensible documentation for tax filing and audit defense.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">07</span>
                        Limitations
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-zinc-400">
                        Some scenarios require manual review because data is ambiguous. Examples include batched payouts where many transactions land as one deposit, platforms with delayed reporting, currency conversion where amounts differ materially, and generic bank descriptions that hide payer identity. Zerithum exposes these cases instead of hiding them.
                    </p>
                </div>
            </div>

            {/* Animation 3 Placement */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden min-h-[300px]">
                <MethodologyAnimations type="audit" />
            </div>
        </div>
    </motion.div>
);

export default ReconciliationMethodology;
