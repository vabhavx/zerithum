import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileCheck, Server, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { GlowingEffect } from '@/components/ui/glowing-effect';

const CARDS = [
    {
        icon: Lock,
        title: 'Read-only Access',
        desc: 'Bank connections are established via Teller in read-only mode. We never store bank login credentials.',
    },
    {
        icon: Server,
        title: 'Data Minimization',
        desc: 'We only store transaction metadata needed for reconciliation. Sensitive payment data is never persisted.',
    },
    {
        icon: Shield,
        title: 'Encryption at Rest',
        desc: 'All data is encrypted at rest using AES-256 and in transit via TLS 1.3. Your financial data is secure.',
    },
    {
        icon: FileCheck,
        title: 'Immutable Audit Logs',
        desc: 'Every reconciliation decision is appended to an immutable log for compliance and audit defense.',
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
    }),
};

const SecuritySection = () => {
    return (
        <section id="security" className="py-20 md:py-32 bg-zinc-950">
             <div className="max-w-4xl mx-auto px-4 md:px-6">
                <div className="text-center mb-14 md:mb-20">
                    <ScrollReveal
                        baseOpacity={0.1}
                        enableBlur={true}
                        baseRotation={3}
                        blurStrength={4}
                        textClassName="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight"
                    >
                        Built for trust.
                    </ScrollReveal>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mt-5">
                        Zerithum is a read-only system. We observe your revenue data and bank deposits. We never hold, move, or custody funds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {CARDS.map((card, i) => (
                        <motion.div
                            key={i}
                            className="relative overflow-hidden rounded-lg"
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-60px' }}
                        >
                            <GlowingEffect
                                disabled={false}
                                spread={15}
                                blur={0}
                                proximity={200}
                                variant="white"
                                borderWidth={1}
                            />
                            <div className="relative p-6 bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors group">
                                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                                    <card.icon className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{card.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{card.desc}</p>
                            </div>
                        </motion.div>
                    ))}
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

export default SecuritySection;
