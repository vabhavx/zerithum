import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileCheck, Server, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SecuritySection = () => {
    return (
        <section id="security" className="py-20 md:py-32 bg-zinc-950">
             <div className="max-w-4xl mx-auto px-4 md:px-6">
                <div className="text-center mb-14 md:mb-20">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-5">Built for trust.</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                        Zerithum is a read-only system. We observe your revenue data and bank deposits. We never hold, move, or custody funds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SecurityCard
                        icon={Lock}
                        title="Read-only Access"
                        desc="Bank connections are established via Teller in read-only mode. We never store bank login credentials."
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

                <div className="mt-12 flex justify-center">
                    <Link to="/Security">
                        <Button variant="outline" className="group border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
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
    <div className="p-6 bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors group">
        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
            <Icon className="w-5 h-5 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default SecuritySection;
