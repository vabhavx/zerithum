import React from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { ChevronDown, Sparkles } from "lucide-react";

const PLATFORM_NAMES = [
    "YouTube",
    "Patreon",
    "Gumroad",
    "Facebook",
    "TikTok",
    "Twitch",
    "Snapchat",
    "Kick",
    "DLive",
    "OnlyFans",
    "Shopify",
    "Stripe",
    "Instagram",
    "X",
    "Discord",
    "Spotify",
    "Apple Music",
    "SoundCloud",
    "Substack",
    "Kajabi",
    "Teachable",
    "Manual connection",
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function Onboarding3D() {
    const navigate = useNavigate();
    const containerRef = React.useRef(null);
    const setupRef = React.useRef(null);
    const pointerRef = React.useRef({ x: 0, y: 0 });
    const flowSpeedRef = React.useRef(0.6);
    const orbitSpreadRef = React.useRef(0.85);

    const [flowSpeed, setFlowSpeed] = React.useState(0.6);
    const [orbitSpread, setOrbitSpread] = React.useState(0.85);

    React.useEffect(() => {
        flowSpeedRef.current = flowSpeed;
    }, [flowSpeed]);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x050608, 12, 30);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0.2, 16);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x7fe7ff, 0.6);
        scene.add(ambient);

        const keyLight = new THREE.PointLight(0x7cf9ff, 1.2, 40);
        keyLight.position.set(6, 8, 10);
        scene.add(keyLight);

        const rimLight = new THREE.PointLight(0x6e9cff, 0.6, 40);
        rimLight.position.set(-8, -4, -6);
        scene.add(rimLight);

        const coreGroup = new THREE.Group();
        scene.add(coreGroup);

        const glowCanvas = document.createElement("canvas");
        glowCanvas.width = 256;
        glowCanvas.height = 256;
        const glowContext = glowCanvas.getContext("2d");
        if (glowContext) {
            const gradient = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, "rgba(120, 250, 255, 0.85)");
            gradient.addColorStop(0.4, "rgba(52, 210, 255, 0.4)");
            gradient.addColorStop(1, "rgba(10, 20, 30, 0)");
            glowContext.fillStyle = gradient;
            glowContext.fillRect(0, 0, 256, 256);
        }

        const glowTexture = new THREE.CanvasTexture(glowCanvas);
        const glowSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.9, depthWrite: false })
        );
        glowSprite.scale.set(10, 10, 1);
        coreGroup.add(glowSprite);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 48, 48),
            new THREE.MeshStandardMaterial({
                color: 0x8cf5ff,
                emissive: 0x37cbe2,
                emissiveIntensity: 0.9,
                metalness: 0.1,
                roughness: 0.05,
                transparent: true,
                opacity: 0.95,
            })
        );
        coreGroup.add(core);

        const coreInner = new THREE.Mesh(
            new THREE.SphereGeometry(1.1, 32, 32),
            new THREE.MeshPhysicalMaterial({
                color: 0x0b1220,
                transmission: 0.85,
                thickness: 0.7,
                roughness: 0.05,
                metalness: 0.1,
                transparent: true,
                opacity: 0.85,
                emissive: 0x1fa3c0,
                emissiveIntensity: 0.3,
            })
        );
        coreGroup.add(coreInner);

        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x3ed6f0,
            emissive: 0x2b9ab5,
            emissiveIntensity: 0.6,
            metalness: 0.4,
            roughness: 0.2,
            transparent: true,
            opacity: 0.65,
        });

        const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.07, 16, 220), ringMaterial);
        ringA.rotation.x = Math.PI / 2.2;
        coreGroup.add(ringA);

        const ringB = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.05, 16, 220), ringMaterial.clone());
        ringB.rotation.y = Math.PI / 2.6;
        ringB.rotation.z = Math.PI / 5;
        coreGroup.add(ringB);

        const halo = new THREE.Mesh(
            new THREE.RingGeometry(2.5, 4.8, 120),
            new THREE.MeshBasicMaterial({ color: 0x76f0ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
        );
        halo.rotation.x = Math.PI / 2;
        coreGroup.add(halo);

        const starCount = 1400;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 40;
            starPositions[i + 1] = (Math.random() - 0.5) * 30;
            starPositions[i + 2] = (Math.random() - 0.5) * 40;
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0x9deaff,
            size: 0.08,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
        });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        const nodes = PLATFORM_NAMES.map((name, index) => {
            const nodeGroup = new THREE.Group();
            const node = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: 0xcaf9ff,
                    emissive: 0x55d7f0,
                    emissiveIntensity: 0.7,
                    roughness: 0.15,
                    metalness: 0.2,
                })
            );
            const nodeRing = new THREE.Mesh(
                new THREE.TorusGeometry(0.35, 0.04, 12, 60),
                new THREE.MeshStandardMaterial({
                    color: 0x52cde8,
                    emissive: 0x2d93b3,
                    emissiveIntensity: 0.4,
                    roughness: 0.2,
                    metalness: 0.2,
                    transparent: true,
                    opacity: 0.7,
                })
            );
            nodeRing.rotation.x = Math.PI / 2;
            nodeGroup.add(node, nodeRing);
            scene.add(nodeGroup);

            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(),
                new THREE.Vector3(),
            ]);
            const lineMaterial = new THREE.LineDashedMaterial({
                color: 0x47d0ef,
                dashSize: 0.35,
                gapSize: 0.22,
                transparent: true,
                opacity: 0.55,
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.computeLineDistances();
            scene.add(line);

            const pulse = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xa9f6ff, transparent: true, opacity: 0.9 })
            );
            scene.add(pulse);

            return {
                name,
                nodeGroup,
                line,
                pulse,
                radius: 5.4 + (index % 6) * 0.55,
                speed: 0.12 + (index % 7) * 0.02,
                offset: (index / PLATFORM_NAMES.length) * Math.PI * 2,
                tilt: (index % 5 - 2) * 0.18,
                bob: 0.35 + (index % 4) * 0.12,
            };
        });

        const corePosition = new THREE.Vector3(0, 0, 0);
        const tempPosition = new THREE.Vector3();
        const tempAxisX = new THREE.Vector3(1, 0, 0);
        const tempAxisZ = new THREE.Vector3(0, 0, 1);
        const clock = new THREE.Clock();
        let frameId = 0;

        const updateSize = () => {
            const { clientWidth, clientHeight } = container;
            if (clientWidth === 0 || clientHeight === 0) return;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        };

        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);

        const handlePointerMove = (event) => {
            const rect = container.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            pointerRef.current = { x: clamp(x * 2, -1, 1), y: clamp(y * 2, -1, 1) };
        };

        container.addEventListener("pointermove", handlePointerMove);

        const animate = () => {
            const time = clock.getElapsedTime();
            const flowSpeedValue = flowSpeedRef.current;
            const orbitSpreadValue = orbitSpreadRef.current;
            const pointer = pointerRef.current;

            coreGroup.rotation.y = time * 0.08;
            ringA.rotation.z = time * 0.12;
            ringB.rotation.x = time * -0.08;
            halo.rotation.z = time * 0.05;
            stars.rotation.y = time * 0.02;

            camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.05;
            camera.position.y += (-pointer.y * 1.4 - camera.position.y) * 0.05;
            camera.lookAt(corePosition);

            nodes.forEach((node) => {
                const radius = node.radius * (0.55 + orbitSpreadValue);
                const angle = time * node.speed + node.offset;
                const height = Math.sin(time * node.speed * 2 + node.offset) * node.bob;

                tempPosition.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
                tempPosition.applyAxisAngle(tempAxisX, node.tilt);
                tempPosition.applyAxisAngle(tempAxisZ, node.tilt * 0.5);

                node.nodeGroup.position.copy(tempPosition);
                node.nodeGroup.rotation.y = angle;

                const linePositions = node.line.geometry.attributes.position;
                linePositions.setXYZ(0, tempPosition.x, tempPosition.y, tempPosition.z);
                linePositions.setXYZ(1, 0, 0, 0);
                linePositions.needsUpdate = true;
                node.line.computeLineDistances();
                node.line.material.dashOffset = -time * (0.6 + flowSpeedValue * 0.8);

                const pulseProgress = (time * (0.15 + flowSpeedValue * 0.25) + node.offset) % 1;
                node.pulse.position.copy(tempPosition).lerp(corePosition, pulseProgress);
                node.pulse.material.opacity = 0.3 + Math.sin(time * 2 + node.offset) * 0.4;
            });

            renderer.render(scene, camera);

            if (!prefersReducedMotion) {
                frameId = window.requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            container.removeEventListener("pointermove", handlePointerMove);
            container.removeChild(renderer.domElement);

            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material) => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });

            renderer.dispose();
        };
    }, []);

    const handleScrollToSetup = () => {
        setupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="relative min-h-screen bg-[#050608] text-white overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,232,255,0.18),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_rgba(60,120,255,0.12),_transparent_65%)]" />
                <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(72,245,255,0.2),_transparent_70%)] blur-3xl" />
                <div className="absolute bottom-[-220px] left-[-120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(56,140,255,0.16),_transparent_70%)] blur-3xl" />
            </div>

            <div className="relative z-10 px-6 lg:px-14 pt-10 pb-16">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/c4bbf87fd_image.png"
                            alt="Zerithum"
                            className="h-7 w-auto object-contain"
                        />
                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">Creator Convergence</span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-xs text-white/60 hover:text-white"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                    >
                        Continue without setup
                    </Button>
                </div>

                <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr,1fr] items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/60">
                            <Sparkles className="h-3 w-3 text-zteal-300" />
                            Data flows in real time
                        </div>
                        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
                            See every platform flow into a single Zerithum core.
                        </h1>
                        <p className="mt-5 text-base sm:text-lg text-white/65 max-w-xl">
                            This living model is your revenue universe in motion. Every stream, membership, and
                            payout converges into one intelligent dashboard so the full potential is clear at first glance.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                className="bg-zteal-400 text-black hover:bg-zteal-300"
                                onClick={handleScrollToSetup}
                            >
                                Scroll to setup
                            </Button>
                            <Button
                                variant="outline"
                                className="border-white/20 text-white/70 hover:text-white hover:border-white/40"
                                onClick={() => navigate(createPageUrl("ConnectedPlatforms"))}
                            >
                                Connect platforms now
                            </Button>
                        </div>

                        <div className="mt-8">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Platforms in the stream</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {PLATFORM_NAMES.map((platform) => (
                                    <span
                                        key={platform}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                                    >
                                        {platform}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Flow speed</p>
                                <input
                                    type="range"
                                    min="0.2"
                                    max="1.2"
                                    step="0.05"
                                    value={flowSpeed}
                                    onChange={(event) => setFlowSpeed(Number(event.target.value))}
                                    className="mt-4 w-full accent-zteal-400"
                                />
                                <p className="mt-2 text-xs text-white/50">Adjust the data pulse intensity.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Orbit spread</p>
                                <input
                                    type="range"
                                    min="0.6"
                                    max="1.4"
                                    step="0.05"
                                    value={orbitSpread}
                                    onChange={(event) => setOrbitSpread(Number(event.target.value))}
                                    className="mt-4 w-full accent-zteal-400"
                                />
                                <p className="mt-2 text-xs text-white/50">Widen or focus the platform halo.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(68,220,255,0.2),_transparent_70%)] blur-2xl" />
                        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent">
                            <div ref={containerRef} className="h-[420px] sm:h-[520px] w-full" />
                            <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-6 text-[11px] uppercase tracking-[0.35em] text-white/40">
                                <span>Hover to orbit</span>
                                <span>Slow motion live</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex items-center gap-2 text-xs text-white/40">
                    <ChevronDown className="h-4 w-4" />
                    Scroll to setup
                </div>
            </div>

            <section ref={setupRef} id="setup" className="relative z-10 px-6 lg:px-14 pb-20">
                <div className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8 lg:p-12">
                    <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr]">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Setup</p>
                            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">Connect the platforms that power your business.</h2>
                            <p className="mt-4 text-white/60 text-base">
                                Add the platforms you already use and watch their data lock into the Zerithum core. You can
                                connect now or continue without setup and return anytime.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    className="bg-zteal-400 text-black hover:bg-zteal-300"
                                    onClick={() => navigate(createPageUrl("ConnectedPlatforms"))}
                                >
                                    Connect platforms
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-white/70 hover:text-white"
                                    onClick={() => navigate(createPageUrl("Dashboard"))}
                                >
                                    Continue without setup
                                </Button>
                            </div>
                            <p className="mt-3 text-xs text-white/40">Don't want to connect right now? Continue without setup.</p>
                        </div>

                        <div className="grid gap-4">
                            {[
                                "Pick your revenue sources and sync in minutes.",
                                "Zerithum consolidates payouts, subscriptions, and stores.",
                                "Your dashboard stays always-on as new platforms plug in.",
                            ].map((item, index) => (
                                <div
                                    key={item}
                                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white/70">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm text-white/60">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
