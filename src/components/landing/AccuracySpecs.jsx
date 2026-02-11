import React from 'react';

const AccuracySpecs = () => {
    return (
        <section id="accuracy" className="py-24 relative z-10 bg-zinc-950/50 backdrop-blur-sm">
             <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">Engineered for Accuracy</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg font-light">
                        Matching is scored with confidence and reason codes. Auto reconciliation happens only above a strict threshold.
                    </p>
                </div>

                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/80">
                    <div className="grid grid-cols-4 bg-zinc-900/50 p-4 border-b border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                        <div>Match Rule</div>
                        <div>Conditions</div>
                        <div>Confidence</div>
                        <div>System Action</div>
                    </div>

                    <AccuracyRow
                        rule="Exact Match"
                        condition="Amount match, Date match"
                        confidence="0.99"
                        action="Auto-reconcile"
                        color="text-emerald-500"
                    />
                    <AccuracyRow
                        rule="Fee Window"
                        condition="Amount within 2%, Date within 1 day"
                        confidence="0.85"
                        action="Suggested Match"
                        color="text-emerald-400"
                    />
                    <AccuracyRow
                        rule="Hold Window"
                        condition="Amount within 5%, Date within 3 days"
                        confidence="0.60"
                        action="Flagged for Review"
                        color="text-amber-500"
                    />
                    <AccuracyRow
                        rule="Manual Override"
                        condition="User confirmed"
                        confidence="1.00"
                        action="Audit Log Append"
                        color="text-blue-500"
                    />
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Bank deposits are treated as the cash source of truth. Platform earnings are estimates until reconciled.
                    </div>
                </div>
             </div>
        </section>
    );
};

const AccuracyRow = ({ rule, condition, confidence, action, color }) => (
    <div className="grid grid-cols-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/30 transition-colors group">
        <div className="text-white font-medium text-sm flex items-center">{rule}</div>
        <div className="text-zinc-400 text-sm flex items-center">{condition}</div>
        <div className={`font-mono text-sm flex items-center ${color}`}>{confidence}</div>
        <div className="text-zinc-300 text-sm flex items-center group-hover:text-white transition-colors">{action}</div>
    </div>
);

export default AccuracySpecs;
