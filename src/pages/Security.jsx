import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/landing/Footer';
import DataBoundaryMap from '@/components/security/DataBoundaryMap';

const Security = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
            {/* Nav */}
            <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Product
                    </Link>
                    <div className="font-serif font-bold text-lg tracking-tight text-white">Zerithum.</div>
                    <div className="w-24"></div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-24">
                {/* Hero Section */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-6">
                        Security & Compliance
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Security by design, not by promises</h1>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed font-serif">
                        Zerithum observes revenue and deposits after settlement, reconciles them, and logs every decision. Your money never passes through Zerithum.
                    </p>

                    <div className="max-w-3xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-[15px] leading-relaxed text-zinc-400 text-left">
                        <p>
                            Zerithum is positioned as accounting software, not a payment processor. Your earnings flow directly from platforms to your bank. Zerithum never touches funds, never stores bank passwords, and never initiates transactions. Zerithum connects via read only access, stores only the transaction metadata needed for reconciliation, encrypts data at rest and in transit, keeps an immutable audit trail, and produces tax ready exports. The design avoids custody and minimizes attack surface.
                        </p>
                    </div>
                </div>

                {/* Data Boundaries Block */}
                <div className="grid md:grid-cols-2 gap-12 mb-24">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <Check className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-white">What Zerithum can do</h3>
                        </div>
                        <ul className="space-y-4 text-[15px] text-zinc-400">
                            <li className="flex items-start gap-3">
                                <Check className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                                <span>Read only pull platform transaction metadata via OAuth or API.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                                <span>Read only pull bank transaction metadata via Plaid, or ingest manual statement uploads.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                                <span>Reconcile platform earnings to deposits and flag discrepancies with reason codes.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                                <span>Write an immutable audit trail for reconciliation decisions and exports.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                                <X className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-white">What Zerithum cannot do</h3>
                        </div>
                        <ul className="space-y-4 text-[15px] text-zinc-400">
                            <li className="flex items-start gap-3">
                                <X className="w-4 h-4 mt-1 text-red-500 shrink-0" />
                                <span>Move, hold, route, or settle your funds.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <X className="w-4 h-4 mt-1 text-red-500 shrink-0" />
                                <span>Initiate payouts, withdrawals, refunds, or transfers.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <X className="w-4 h-4 mt-1 text-red-500 shrink-0" />
                                <span>See or store your bank login credentials.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Animation Section */}
                <div className="mb-32">
                    <DataBoundaryMap />
                </div>

                {/* Trust Controls Grid */}
                <div className="mb-24">
                     <h2 className="text-2xl font-serif font-bold text-white mb-12 text-center">Trust Controls</h2>
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ControlCard
                            title="No custody of funds"
                            desc="Money flows directly from platforms to your bank. Zerithum never touches funds and never initiates transactions. This avoids Money Transmitter License requirements."
                        />
                         <ControlCard
                            title="Read only bank access"
                            desc="Bank data is pulled through Plaid read only. You can also upload bank statements if you do not want a live connection. Zerithum never stores your bank login credentials."
                        />
                         <ControlCard
                            title="Data minimization"
                            desc="Zerithum stores only transaction metadata required for reconciliation and reporting: amount, date, source, category, transaction ID. Credit card numbers, bank passwords, and payment instrument details are not stored."
                        />
                         <ControlCard
                            title="Encryption at rest and in transit"
                            desc="Data is encrypted at rest using AES 256 and encrypted in transit with TLS 1.3. Database encryption is managed via AWS KMS."
                        />
                         <ControlCard
                            title="Immutable audit trail"
                            desc="Every reconciliation decision is logged in an append only audit trail with timestamps, confidence scores, and reason codes. This supports tax prep and audit defense. Audit logs are retained for long term record keeping."
                        />
                         <ControlCard
                            title="Operational controls"
                            desc="Rate limiting, audit logging, and perimeter protections are built into the platform. Access is logged. Session tokens expire. API limits prevent abuse."
                        />
                     </div>
                </div>

                {/* What We Never Store */}
                <div className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-800 rounded-lg p-8 text-center mb-20">
                     <h3 className="text-lg font-bold text-white mb-6">What we never store</h3>
                     <div className="flex flex-col md:flex-row justify-center gap-8 text-sm text-zinc-500">
                        <div className="flex items-center justify-center gap-2">
                            <X className="w-4 h-4 text-red-500" /> Bank passwords
                        </div>
                        <div className="flex items-center justify-center gap-2">
                             <X className="w-4 h-4 text-red-500" /> Credit card numbers
                        </div>
                         <div className="flex items-center justify-center gap-2">
                             <X className="w-4 h-4 text-red-500" /> Sensitive payment data
                        </div>
                     </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
                    <Link to="/methodology">
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 min-w-[200px]">
                            View security methodology
                        </Button>
                    </Link>
                    <Link to="/privacy">
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 min-w-[200px]">
                            Read privacy policy
                        </Button>
                    </Link>
                </div>

                {/* Compliance Footnote */}
                 <div className="text-center border-t border-zinc-900 pt-12 pb-12">
                    <p className="text-xs text-zinc-600">
                        Audit logs and reconciliation history are retained for long term record keeping in support of tax compliance and audit defense.
                    </p>
                </div>

            </main>

            <Footer />
        </div>
    );
};

const ControlCard = ({ title, desc }) => (
    <div className="p-6 bg-zinc-900/20 border border-zinc-800 rounded-lg hover:bg-zinc-900/40 transition-colors">
        <h4 className="text-base font-bold text-white mb-3">{title}</h4>
        <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
);

export default Security;
