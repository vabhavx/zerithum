import React, { useState } from 'react';
import { motion } from 'motion/react';

export default function LandingReconciliation() {
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    return (
        <div className="w-full max-w-5xl px-4 flex flex-col items-center">
            <motion.div
                className="w-full aspect-video bg-neutral-900 rounded-lg border border-white/10 overflow-hidden shadow-2xl relative"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                {/* Overlay to prevent interaction if desired, or just to add a scanline effect */}
                <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>

                <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/382OKSW2wwE?autoplay=1&mute=1&controls=0&loop=1&playlist=382OKSW2wwE&rel=0&showinfo=0&modestbranding=1"
                    title="Zerithum Reconciliation Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full object-cover"
                    onLoad={() => setIsVideoLoaded(true)}
                ></iframe>

                {!isVideoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                )}
            </motion.div>

            <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Precision Reconciliation</h2>
                <p className="text-neutral-400 max-w-md mx-auto text-lg font-light">
                    Bank-grade matching logic aligns every cent across platforms.
                    <span className="block mt-1 text-neutral-500 text-sm font-mono">ERR_RATE: 0.00% // AUTO_MATCH: ENABLED</span>
                </p>
            </div>
        </div>
    );
}
