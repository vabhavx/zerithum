import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Methodology = () => {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100">
            {/* Nav */}
            <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-zinc-900 hover:text-emerald-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Product
                    </Link>
                    <div className="font-serif font-bold text-lg tracking-tight">Zerithum.</div>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <header className="mb-16 border-b border-zinc-200 pb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-6">
                        Technical Paper v1.2
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 mb-6 leading-tight">
                        Reconciliation Methodology: <br/>
                        Deterministic Matching & Audit Trails
                    </h1>
                    <p className="text-xl text-zinc-600 leading-relaxed font-serif">
                        This document outlines the inputs, matching logic, confidence scoring, and immutable audit logging architecture used by the Zerithum engine to reconcile creator revenue.
                    </p>
                </header>

                <div className="grid gap-16">
                    {/* Section A: Inputs */}
                    <section>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-sm font-mono">A</span>
                            Data Inputs
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white border border-zinc-200 p-6 rounded-lg shadow-sm">
                                <h3 className="font-bold text-lg mb-3">1. Platform Transactions</h3>
                                <p className="text-zinc-600 text-sm mb-4">Ingested via API (OAuth) or CSV.</p>
                                <ul className="space-y-2 text-sm font-mono text-zinc-500">
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>amount</span> <span>decimal(18,2)</span></li>
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>date</span> <span>timestamp_utc</span></li>
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>transaction_id</span> <span>string</span></li>
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>category</span> <span>enum</span></li>
                                </ul>
                            </div>
                            <div className="bg-white border border-zinc-200 p-6 rounded-lg shadow-sm">
                                <h3 className="font-bold text-lg mb-3">2. Bank Transactions</h3>
                                <p className="text-zinc-600 text-sm mb-4">Ingested via Plaid (Read-only) or Statement.</p>
                                <ul className="space-y-2 text-sm font-mono text-zinc-500">
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>amount</span> <span>decimal(18,2)</span></li>
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>date</span> <span>timestamp_utc</span></li>
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>description</span> <span>string</span></li>
                                    <li className="flex justify-between border-b border-zinc-100 pb-1"><span>merchant_name</span> <span>string</span></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section B: Matching Logic */}
                    <section>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-sm font-mono">B</span>
                            Matching Logic & Confidence
                        </h2>
                        <p className="text-zinc-600 mb-8 leading-relaxed">
                            The matching engine operates on a waterfall logic. We prefer one-to-one matches with the highest confidence score. In the event of a conflict (multiple possible matches), the system defaults to "Unmatched" and flags for human review to prevent false positives.
                        </p>

                        {/* Visualization 1 */}
                        <div className="bg-zinc-900 rounded-xl p-8 mb-8 text-white relative overflow-hidden">
                             <div className="absolute top-4 right-4 text-xs font-mono text-zinc-500">LOGIC_FLOW_VISUALIZATION</div>
                             <div className="flex flex-col gap-4 items-center max-w-lg mx-auto">
                                 <LogicGate score="0.99" label="Exact Match" desc="Amount == Amount AND Date == Date" />
                                 <div className="h-6 w-0.5 bg-zinc-700"></div>
                                 <LogicGate score="0.85" label="Fee Window" desc="Amount within 2% AND Date within 24h" />
                                 <div className="h-6 w-0.5 bg-zinc-700"></div>
                                 <LogicGate score="0.60" label="Hold Window" desc="Amount within 5% AND Date within 72h" />
                             </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg">
                            <h4 className="font-bold text-emerald-900 mb-2">Auto-Reconciliation Threshold</h4>
                            <p className="text-emerald-800 text-sm">
                                Only matches with a confidence score ≥ 0.95 are automatically reconciled. All others are routed to the review queue.
                            </p>
                        </div>
                    </section>

                    {/* Section C: Reason Codes */}
                    <section>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-sm font-mono">C</span>
                            Reason Codes
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <ReasonCode code="FEE_DEDUCTION" desc="Platform fees deducted from payout. Common in Stripe/PayPal." />
                            <ReasonCode code="HOLD_PERIOD" desc="Payout delayed by platform hold policy (e.g. Gumroad 7-day)." />
                            <ReasonCode code="REFUND" desc="Negative transaction representing a refund to a customer." />
                            <ReasonCode code="DUPLICATE" desc="Transaction appears twice (e.g. double click ingest)." />
                            <ReasonCode code="UNMATCHED" desc="No corresponding bank deposit found within window." />
                        </div>
                    </section>

                    {/* Section D: Review Workflow */}
                    <section>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-sm font-mono">D</span>
                            Review Workflow & Audit Trail
                        </h2>
                        <p className="text-zinc-600 mb-6 leading-relaxed">
                            When confidence is below 0.95, the transaction enters the review queue. The creator (user) must manually accept, reject, or edit the match. Every action is recorded.
                        </p>

                        {/* Visualization 2: Audit Log */}
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 text-xs font-mono text-zinc-500 uppercase">
                                Immutable_Audit_Log
                            </div>
                            <div className="divide-y divide-zinc-100">
                                <AuditRow time="10:01:22" actor="System" action="MATCH_ATTEMPT" detail="Confidence 0.85 (Fee Window)" />
                                <AuditRow time="10:01:23" actor="System" action="QUEUE_ADD" detail="Review Queue #8821" />
                                <AuditRow time="14:20:05" actor="User_Admin" action="REVIEW_ACCEPT" detail="Manual Confirmation" />
                                <AuditRow time="14:20:05" actor="System" action="RECONCILE_COMMIT" detail="Ledger ID #99281" />
                            </div>
                        </div>
                    </section>

                    {/* Section E: Limitations */}
                    <section>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-sm font-mono">E</span>
                            Known Limitations
                        </h2>
                        <ul className="list-disc pl-6 space-y-3 text-zinc-600">
                            <li><strong>Partial Payouts:</strong> If a platform splits a single period's earnings into multiple bank transfers, manual grouping is required.</li>
                            <li><strong>Multi-Currency:</strong> FX rates applied by banks may cause "Fee Window" mismatches if variance exceeds 5%.</li>
                            <li><strong>Ambiguous Descriptors:</strong> Bank feeds with generic descriptors like "WIRE TRANSFER" cannot be auto-matched without amount correlation.</li>
                        </ul>
                    </section>
                </div>

                <footer className="mt-24 pt-12 border-t border-zinc-200 text-center">
                    <p className="text-zinc-500 text-sm mb-6">
                        Start reconciling your revenue today.
                    </p>
                    <Link to="/Signup">
                        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-8">
                            Create Account
                        </Button>
                    </Link>
                </footer>
            </main>
        </div>
    );
};

// Subcomponents for visuals
const LogicGate = ({ score, label, desc }) => (
    <div className="w-full bg-zinc-800 p-4 rounded border border-zinc-700 flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
        <div>
            <div className="font-bold text-sm text-white">{label}</div>
            <div className="text-xs text-zinc-400 font-mono">{desc}</div>
        </div>
        <div className="font-mono text-emerald-400 text-lg font-bold">{score}</div>
    </div>
);

const ReasonCode = ({ code, desc }) => (
    <div className="p-4 border border-zinc-200 rounded bg-white hover:shadow-md transition-shadow">
        <div className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 inline-block px-2 py-1 rounded mb-2">
            {code}
        </div>
        <div className="text-sm text-zinc-600">{desc}</div>
    </div>
);

const AuditRow = ({ time, actor, action, detail }) => (
    <div className="px-4 py-3 flex items-center gap-4 text-sm font-mono">
        <div className="text-zinc-400 w-20 shrink-0">{time}</div>
        <div className="text-zinc-900 w-24 shrink-0 font-medium">{actor}</div>
        <div className="text-emerald-700 w-32 shrink-0">{action}</div>
        <div className="text-zinc-500">{detail}</div>
    </div>
);

export default Methodology;
