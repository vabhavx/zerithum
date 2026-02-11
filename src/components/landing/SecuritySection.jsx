import React from 'react';
import { Link } from 'react-router-dom';
import { Ban, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityAnimation from './SecurityAnimation';

const SecuritySection = () => {
    return (
        <section id="security" className="py-24 relative z-10 bg-zinc-950 border-t border-zinc-800">
             <div className="max-w-6xl mx-auto px-6">

                {/* 1. Headline & Subheadline */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
                        Data minimized. Read only. Auditable.
                    </h2>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Zerithum observes revenue and deposits after settlement, reconciles them, and logs every decision. Your money never passes through Zerithum.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-start">
                    {/* 4. Primary Animation (Data Boundary Map) */}
                    <div className="order-2 lg:order-1">
                        <SecurityAnimation />
                    </div>

                    {/* 2. Data Boundaries Block */}
                    <div className="order-1 lg:order-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Can Do */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                    <Check className="w-4 h-4" /> What Zerithum Can Do
                                </h3>
                                <ul className="space-y-3">
                                    <BoundaryItem allowed>Read only pull platform transaction metadata via OAuth or API.</BoundaryItem>
                                    <BoundaryItem allowed>Read only pull bank transaction metadata via Plaid, or ingest statement uploads.</BoundaryItem>
                                    <BoundaryItem allowed>Reconcile platform earnings to deposits and flag discrepancies with reason codes.</BoundaryItem>
                                    <BoundaryItem allowed>Write an immutable audit trail for reconciliation decisions and exports.</BoundaryItem>
                                </ul>
                            </div>

                            {/* Cannot Do */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                    <Ban className="w-4 h-4" /> What Zerithum Cannot Do
                                </h3>
                                <ul className="space-y-3">
                                    <BoundaryItem>Move, hold, route, or settle your funds.</BoundaryItem>
                                    <BoundaryItem>Initiate payouts, withdrawals, refunds, or transfers.</BoundaryItem>
                                    <BoundaryItem>See or store your bank login credentials.</BoundaryItem>
                                </ul>
                            </div>
                        </div>

                         {/* 5. What We Never Store */}
                         <div className="pt-8 border-t border-zinc-800">
                            <h4 className="text-sm font-medium text-zinc-300 mb-4">What we never store:</h4>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400">Bank passwords or login credentials</span>
                                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400">Credit card numbers</span>
                                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400">Sensitive payment instrument data</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Trust Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    <TrustControlCard
                        title="No custody of funds"
                        desc="Money flows directly from platforms to your bank. Zerithum never touches funds and never initiates transactions."
                    />
                    <TrustControlCard
                        title="Read only bank access"
                        desc="Bank data is pulled through Plaid read only. You can also upload statements if you do not want a live connection."
                    />
                    <TrustControlCard
                        title="Data minimization"
                        desc="We store only the transaction metadata required for reconciliation and reporting. We avoid sensitive payment data."
                    />
                    <TrustControlCard
                        title="Encryption"
                        desc="Data is encrypted at rest using AES 256 and encrypted in transit with TLS 1.3. Database encryption is managed via AWS KMS."
                    />
                    <TrustControlCard
                        title="Immutable audit trail"
                        desc="Every reconciliation decision is logged in an append only audit trail with timestamps, confidence, and reason codes. This supports tax prep and audit defense."
                    />
                    <TrustControlCard
                        title="Access controls and abuse protection"
                        desc="Rate limiting, detailed audit logging, and perimeter protections are part of the core platform design."
                    />
                </div>

                {/* 6. CTA & Footnote */}
                <div className="flex flex-col items-center gap-8 border-t border-zinc-800 pt-16">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/methodology">
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600">
                                View reconciliation methodology
                            </Button>
                        </Link>
                        <Link to="/privacy">
                            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900">
                                Read privacy policy <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                    <p className="text-xs text-zinc-600 text-center max-w-xl">
                        Audit logs and reconciliation history are retained for long term record keeping, with a target of 7 years.
                    </p>
                </div>

             </div>
        </section>
    );
};

const BoundaryItem = ({ children, allowed }) => (
    <li className={`text-sm leading-relaxed flex items-start gap-2 ${allowed ? 'text-zinc-300' : 'text-zinc-400'}`}>
        <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${allowed ? 'bg-emerald-500' : 'bg-rose-500/50'}`} />
        {children}
    </li>
);

const TrustControlCard = ({ title, desc }) => (
    <div className="p-6 bg-zinc-900/20 border border-zinc-800 rounded-lg hover:bg-zinc-900/40 transition-colors">
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
);

export default SecuritySection;
