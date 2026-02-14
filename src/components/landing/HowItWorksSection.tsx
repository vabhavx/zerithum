import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import {
    CheckCircle2,
    Terminal,
    Code2,
    ShieldCheck,
    CreditCard,
    DollarSign,
    Zap,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Helper Hook ---
function useInView(options: IntersectionObserverInit) {
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setInView(entry.isIntersecting);
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [options.root, options.rootMargin, options.threshold]);

    return { ref, inView };
}

// --- Real Data Simulation ---
const RAW_PAYLOADS = [
    { id: 'evt_1', type: 'stripe.charge', raw: '{"id":"ch_1Nx","amt":12500,"cur":"usd","st":"succeeded"}', clean: { source: 'Stripe', amount: '$125.00', status: 'Verified', fee: '2.9% + 30¢' }, color: 'text-indigo-400', icon: CreditCard },
    { id: 'evt_2', type: 'yt.payout', raw: '{"uid":"U_88x","val":8432.1,"curr":"USD","src":"ads"}', clean: { source: 'YouTube', amount: '$8,432.10', status: 'Verified', fee: '0%' }, color: 'text-red-400', icon: Zap },
    { id: 'evt_3', type: 'patreon.pledge', raw: '{"m_id":"p_99z","pledge":389055,"iso":"USD"}', clean: { source: 'Patreon', amount: '$3,890.55', status: 'Verified', fee: '5.0%' }, color: 'text-orange-400', icon: DollarSign },
    { id: 'evt_4', type: 'gumroad.sale', raw: '{"sale_id":"g_77q","price":42069,"currency":"usd"}', clean: { source: 'Gumroad', amount: '$420.69', status: 'Verified', fee: '9.0%' }, color: 'text-pink-400', icon: Code2 },
    { id: 'evt_5', type: 'bank.deposit', raw: '{"desc":"STRIPE TRANSFER","val":125.00,"d_dt":"2024-03-01"}', clean: { source: 'Chase Bank', amount: '$125.00', status: 'Matched', fee: '0%' }, color: 'text-emerald-400', icon: ShieldCheck },
];

// Duplicate for infinite scroll
const ITEMS = [...RAW_PAYLOADS, ...RAW_PAYLOADS, ...RAW_PAYLOADS, ...RAW_PAYLOADS];

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-24 bg-black relative overflow-hidden" aria-label="How Zerithum Works">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-6">
                        <Terminal className="w-3 h-3 text-emerald-500" />
                        The Reality Scanner
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
                        We decode the noise.
                    </h2>
                    <p className="text-xl text-zinc-400 font-light">
                        Raw platform data enters. Verified, tax-ready revenue exits. See the transformation live.
                    </p>
                </div>

                {/* The Scanner Widget */}
                <ScannerWidget />
            </div>
        </section>
    );
};

const ScannerWidget = () => {
    const [hovered, setHovered] = useState(false);

    // Vertical scroll animation
    const y = useMotionValue(0);

    useAnimationFrame((t) => {
        if (!hovered) {
            const speed = 0.8; // Pixels per frame
            const currentY = y.get();
            const resetY = -1200; // Reset point based on content height

            if (currentY <= resetY) {
                y.set(0);
            } else {
                y.set(currentY - speed);
            }
        }
    });

    return (
        <div
            className="max-w-2xl mx-auto h-[600px] bg-[#050505] border border-zinc-800 rounded-3xl overflow-hidden relative shadow-2xl group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* The Scanner Beam (Fixed Center) */}
            <div className="absolute top-1/2 left-0 right-0 h-32 -translate-y-1/2 z-20 pointer-events-none">
                {/* Glass Effect */}
                <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[2px] border-y border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]" />

                {/* Laser Lines */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

                {/* Label */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#050505] px-3 py-0.5 text-[9px] font-mono text-emerald-500 border border-emerald-900/50 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-xl">
                    <ShieldCheck className="w-3 h-3" /> Verification Zone
                </div>
            </div>

            {/* Scrolling Content */}
            <motion.div
                className="relative z-10 w-full px-8 py-32 flex flex-col items-center gap-4"
                style={{ y }}
            >
                {ITEMS.map((item, index) => (
                    <ScannerItem key={`${item.id}-${index}`} item={item} />
                ))}
            </motion.div>

            {/* Overlay Gradients to hide start/end */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050505] to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-20 pointer-events-none" />
        </div>
    );
};

const ScannerItem = ({ item }: { item: typeof RAW_PAYLOADS[0] }) => {
    // Custom useInView hook using native IntersectionObserver
    const { ref, inView } = useInView({
        threshold: 0.5,
        rootMargin: '-40% 0px -40% 0px',
    });

    return (
        <div
            ref={ref}
            className={cn(
                "w-full transition-all duration-500 ease-out flex items-center justify-center min-h-[64px]",
                inView ? "scale-100 opacity-100" : "scale-95 opacity-40 grayscale blur-[1px]"
            )}
        >
            {!inView ? (
                <div className="font-mono text-xs text-zinc-500 break-all w-full max-w-md bg-zinc-900/50 p-3 rounded border border-zinc-800 border-dashed relative overflow-hidden">
                    <div className="absolute top-1 right-2 text-[9px] text-zinc-600 uppercase">Raw Payload</div>
                    {item.raw}
                </div>
            ) : (
                <div className="w-full max-w-md bg-zinc-900 border border-emerald-500/30 p-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.1)] flex items-center justify-between group relative overflow-hidden cursor-default">
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />

                    {/* Tooltip Overlay on Hover */}
                    <div className="absolute inset-0 bg-zinc-900/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-500 uppercase">Platform Fee</div>
                            <div className="font-mono text-white text-xs">{item.clean.fee}</div>
                        </div>
                        <div className="h-6 w-[1px] bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-[10px] text-zinc-500 uppercase">Tax Category</div>
                            <div className="font-mono text-white text-xs">Income_1099K</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className={cn("w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800", item.color)}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium">{item.clean.source}</div>
                            <div className="text-sm text-white font-bold font-mono">{item.clean.amount}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                        <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">{item.clean.status}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HowItWorksSection;
