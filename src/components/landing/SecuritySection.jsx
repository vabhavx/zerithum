import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileCheck, Server, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SecuritySection = () => {
    return (
        <section id="security" className="py-24 relative z-10 bg-zinc-50 border-t border-zinc-200">
             <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 mb-6">Compliance Grade Security</h2>
                    <p className="text-zinc-600 max-w-2xl mx-auto text-lg font-light">
                        Zerithum never touches funds and never initiates transactions. We are a read-only observability layer for your revenue.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SecurityCard
                        icon={Lock}
                        title="Read-only Access"
                        desc="Bank connections are established via Plaid in read-only mode. We never store bank login credentials."
                    />
                    <SecurityCard
                        icon={Server}
                        title="Data Minimization"
                        desc="We only store transaction metadata needed for reconciliation. Sensitive payment data is never persisted."
                    />
                    <SecurityCard
                        icon={Shield}
                        title="Encryption at Rest"
                        desc="All data is encrypted at rest using AES-256 and in transit via TLS 1.3. Your financial data is secure."
                    />
                    <SecurityCard
                        icon={FileCheck}
                        title="Immutable Audit Logs"
                        desc="Every reconciliation decision is appended to an immutable log for compliance and audit defense."
                    />
                </div>

                <div className="mt-12 flex flex-col items-center gap-8">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3 max-w-lg shadow-sm">
                        <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-emerald-900/80">
                            <strong>Security First:</strong> Zerithum is designed for zero-trust environments. We assume all networks are hostile and verify every request signature.
                        </div>
                    </div>

                    <Link to="/Security">
                        <Button variant="outline" className="group border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-white shadow-sm">
                            View full security details
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
             </div>
        </section>
    );
};

const SecurityCard = ({ icon: Icon, title, desc }) => (
    <div className="p-6 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg transition-colors group shadow-sm">
        <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mb-4 group-hover:bg-zinc-100 transition-colors">
            <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 mb-2">{title}</h3>
        <p className="text-zinc-600 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default SecuritySection;
