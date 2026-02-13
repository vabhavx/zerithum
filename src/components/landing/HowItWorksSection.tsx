/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, Instance, Instances, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, Zap, RefreshCw, Smartphone, Monitor, Globe, ArrowRight } from 'lucide-react';

// --- Constants ---
const PARTICLE_COUNT = 400;
const CORE_COLOR = "#10b981"; // Emerald-500
const ACCENT_COLOR = "#34d399"; // Emerald-400
const BG_COLOR = "#09090b"; // Zinc-950

const METRICS = [
    { label: "NET REVENUE", value: "$14,205", trend: "+12.4%", trendColor: "text-emerald-400" },
    { label: "PENDING", value: "$2,100", trend: "2d delay", trendColor: "text-amber-400" },
    { label: "FEES", value: "$482", trend: "3.4% avg", trendColor: "text-zinc-500" },
];

const HowItWorksSection = () => {
    const [step, setStep] = useState(0); // 0: Chaos, 1: Fusion (Order), 2: Verified (Bank Layer)
    const prefersReducedMotion = useReducedMotion();
    const containerRef = useRef(null);

    // Auto-advance logic for the demo loop
    useEffect(() => {
        let timer;
        if (step === 0) {
            // Chaos -> Order (Fast)
            timer = setTimeout(() => setStep(1), 2500);
        } else if (step === 1) {
            // Order -> Verified (Medium)
            timer = setTimeout(() => setStep(2), 2000);
        }
        return () => clearTimeout(timer);
    }, [step]);

    return (
        <section ref={containerRef} className="relative h-[900px] w-full bg-zinc-950 overflow-hidden flex flex-col items-center justify-center border-y border-zinc-900">

            {/* 3D Scene Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 18], fov: 30 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
                    <fog attach="fog" args={[BG_COLOR, 10, 30]} />
                    <group position={[0, -1, 0]}>
                        <SceneContent step={step} reducedMotion={prefersReducedMotion} />
                    </group>
                </Canvas>
            </div>

            {/* Vignette Overlay for Text Readability */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#09090b_90%)]"></div>

            {/* UI Overlay Layer */}
            <div className="relative z-20 w-full max-w-7xl px-6 h-full flex flex-col justify-between py-24 pointer-events-none">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center max-w-3xl mx-auto space-y-6 pointer-events-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Reconciliation Demo
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tighter drop-shadow-2xl">
                        Stop wondering where <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 to-emerald-500">the money is.</span>
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
                        Turn the noise of 20 platforms into one clear signal. <br/>
                        Know exactly what you made, what landed, and what’s missing.
                    </p>
                </motion.div>

                {/* Dashboard UI Overlay (Appears in Step 1 & 2) */}
                <div className="flex-1 flex items-center justify-center pt-10">
                    <AnimatePresence mode="wait">
                        {step >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-1 rounded-2xl shadow-2xl pointer-events-auto ring-1 ring-white/10"
                            >
                                <div className="bg-zinc-900/50 rounded-xl p-6 min-w-[320px] md:min-w-[420px] border border-white/5">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-600'}`}></div>
                                            <span className="text-xs font-bold text-zinc-300 tracking-widest font-mono">REVENUE OS</span>
                                        </div>
                                        <AnimatePresence>
                                            {step === 2 && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Bank Verified
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-6">
                                        {METRICS.map((m, i) => (
                                            <div key={i} className="group relative">
                                                <div className="flex items-end justify-between relative z-10">
                                                    <div>
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-semibold">{m.label}</div>
                                                        <div className="text-2xl font-mono text-white font-medium tracking-tight">{m.value}</div>
                                                    </div>
                                                    <div className={cn("text-xs font-mono px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50", m.trendColor)}>
                                                        {m.trend}
                                                    </div>
                                                </div>
                                                {/* Hover Glow Effect */}
                                                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bank Layer Visual for Step 2 */}
                                    <AnimatePresence>
                                        {step === 2 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                                className="mt-6 pt-4 border-t border-zinc-800 overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                                                    <span>CHASE BANK •• 4291</span>
                                                    <span className="text-emerald-500">MATCHED</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Controls Footer */}
                <div className="flex items-center justify-center gap-6 pointer-events-auto relative z-50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep(step === 2 ? 1 : 2)}
                        className={cn(
                            "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all font-mono text-xs uppercase tracking-wider h-12 px-8 z-50 rounded-none border-b-2 hover:border-b-white",
                            step === 2 && "border-emerald-500/50 text-emerald-400 bg-emerald-950/10 border-b-emerald-500"
                        )}
                        disabled={step === 0}
                    >
                        {step === 2 ? "Hide Bank Layer" : "View Bank Layer"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStep(0)}
                        className="rounded-full w-12 h-12 text-zinc-500 hover:text-white hover:bg-zinc-900 z-50 border border-zinc-800 hover:border-zinc-700"
                    >
                        <RefreshCw className={cn("w-4 h-4", step === 0 && "animate-spin")} />
                    </Button>
                </div>

            </div>
        </section>
    );
};

// --- 3D Scene Content ---

const SceneContent = ({ step, reducedMotion }) => {
    return (
        <>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
            <pointLight position={[-10, -5, -10]} intensity={1} color={CORE_COLOR} />

            {/* Dramatic rim light from below/back */}
            <spotLight
                position={[0, -10, 0]}
                angle={0.8}
                penumbra={1}
                intensity={4}
                color={CORE_COLOR}
                castShadow
            />

            {/* Subtle fill to reveal geometry */}
            <pointLight position={[0, 0, 5]} intensity={0.5} color="#a1a1aa" distance={10} />

            <FusionParticles step={step} reducedMotion={reducedMotion} />

            <Environment preset="city" blur={0.8} />
        </>
    );
};


const FusionParticles = ({ step, reducedMotion }) => {
    const count = PARTICLE_COUNT;
    const meshRef = useRef();
    const lightRef = useRef();

    // Generate static positions for both states
    const { chaosPos, gridPos, colors } = useMemo(() => {
        const cPos = new Float32Array(count * 3);
        const gPos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        const color1 = new THREE.Color("#3f3f46"); // Zinc-700
        const color2 = new THREE.Color("#18181b"); // Zinc-900

        const gridCols = 20; // 20x20 grid
        const spacing = 0.6;

        for (let i = 0; i < count; i++) {
            // Chaos
            cPos[i * 3] = (Math.random() - 0.5) * 25;
            cPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            cPos[i * 3 + 2] = (Math.random() - 0.5) * 10;

            // Grid
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;
            gPos[i * 3] = (col - gridCols / 2) * spacing;
            gPos[i * 3 + 1] = (row - gridCols / 2) * spacing;
            gPos[i * 3 + 2] = 0;

            // Color variation
            const c = Math.random() > 0.5 ? color1 : color2;
            cols[i * 3] = c.r;
            cols[i * 3 + 1] = c.g;
            cols[i * 3 + 2] = c.b;
        }
        return { chaosPos: cPos, gridPos: gPos, colors: cols };
    }, []);

    // Temp objects for frame loop
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempPos = useMemo(() => new THREE.Vector3(), []);
    const targetPos = useMemo(() => new THREE.Vector3(), []);
    const tempQuat = useMemo(() => new THREE.Quaternion(), []);

    // Initialize positions to chaos state to prevent "Big Bang" from 0,0,0
    React.useLayoutEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < count; i++) {
            dummy.position.set(
                chaosPos[i * 3],
                chaosPos[i * 3 + 1],
                chaosPos[i * 3 + 2]
            );
            // Random rotation
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [chaosPos, count, dummy]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const isChaos = step === 0;
        const isGrid = step >= 1;

        // Current positions are stored in the instance matrix, but for smooth transition
        // without complex state management in R3F, we recalculate lerp from "virtual" current to target.
        // Actually, best way is to maintain a separate position array or just use the logic:
        // P_new = P_old + (Target - P_old) * factor

        for (let i = 0; i < count; i++) {
            // Get current
            meshRef.current.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(tempPos, tempQuat, dummy.scale);

            // Determine Target
            if (isChaos) {
                targetPos.set(
                    chaosPos[i * 3] + Math.sin(time * 0.5 + i) * 1,
                    chaosPos[i * 3 + 1] + Math.cos(time * 0.3 + i) * 1,
                    chaosPos[i * 3 + 2] + Math.sin(time * 0.2 + i) * 0.5
                );
            } else {
                targetPos.set(
                    gridPos[i * 3],
                    gridPos[i * 3 + 1],
                    gridPos[i * 3 + 2]
                );
            }

            // Lerp Position
            // If reduced motion, snap immediately or move very slowly.
            // We'll just snap for reduced motion to avoid dizziness.
            const speed = reducedMotion ? 50.0 : (isGrid ? 6.0 : 2.0);
            tempPos.lerp(targetPos, delta * speed);

            // Rotation
            if (isChaos) {
                if (!reducedMotion) {
                    // Tumble
                    dummy.rotation.set(
                        time * 0.2 + i,
                        time * 0.1 + i,
                        0
                    );
                }
            } else {
                // Align to grid
                // We use dummy.quaternion which is already set by decompose/rotation above?
                // No, rotation set above updates quaternion.
                // We want to lerp quaternion to identity (0,0,0)
                const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0));
                tempQuat.slerp(targetQ, delta * 4.0);
                dummy.quaternion.copy(tempQuat);
            }

            dummy.position.copy(tempPos);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        // Pulse Effect when Verified
        if (step === 2) {
             meshRef.current.material.emissiveIntensity = 1 + Math.sin(time * 5) * 0.5;
             meshRef.current.material.color.setHex(0x10b981); // Turn green
        } else {
             meshRef.current.material.emissiveIntensity = 0;
             meshRef.current.material.color.setHex(0xffffff); // Revert to base
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[0.2, 0.2, 0.2]}>
                <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
            </boxGeometry>
            <meshStandardMaterial
                vertexColors
                roughness={0.4}
                metalness={0.8}
                color="#ffffff"
            />
        </instancedMesh>
    );
};

export default HowItWorksSection;
