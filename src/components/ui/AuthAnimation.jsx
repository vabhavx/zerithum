import React, { useEffect, useRef } from 'react';

// Utility for smooth color interpolation (for state transitions)
const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

const lerpColor = (a, b, amount) => {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);
    const rr = Math.round(ar + amount * (br - ar));
    const rg = Math.round(ag + amount * (bg - ag));
    const rb = Math.round(ab + amount * (bb - ab));
    return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
};

export default function AuthAnimation({ isSignIn = true }) {
    const canvasRef = useRef(null);
    const isSignInRef = useRef(isSignIn);
    const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, isActive: false });

    useEffect(() => {
        isSignInRef.current = isSignIn;
    }, [isSignIn]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Colors
        const SIGN_IN_COLOR = '#00f2fe'; // Bright Teal
        const SIGN_UP_COLOR = '#6366f1'; // Indigo
        const DATA_NODE_BG = '#121214'; // Dark background for nodes
        const TEXT_COLOR = '#a1a1aa'; // Zinc-400
        const ACCENT_COLOR = '#e2e8f0'; // Slate-200

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        window.addEventListener('resize', resize);
        // Delay to ensure parent is sized
        setTimeout(resize, 0);

        // Define the Anatomy / Data Flow graph
        const coreNode = { id: 'CORE', label: 'ZERITHUM CORE', role: 'center' };

        const sourceNodes = [
            { id: 'SRC1', label: 'BANK FEED', role: 'source', subtext: 'Plaid / Teller API' },
            { id: 'SRC2', label: 'STRIPE', role: 'source', subtext: 'Events / Webhooks' },
            { id: 'SRC3', label: 'YOUTUBE', role: 'source', subtext: 'AdSense API' },
        ];

        const featureNodes = [
            { id: 'FEAT1', label: 'RECONCILIATION', role: 'feature', subtext: 'Ledger Engine' },
            { id: 'FEAT2', label: 'TAX PIPELINE', role: 'feature', subtext: 'Categorization' },
            { id: 'FEAT3', label: 'ANOMALY DETECT', role: 'feature', subtext: 'Fraud / Alerts' },
        ];

        const allNodes = [...sourceNodes, coreNode, ...featureNodes];

        // Store positions calculated during layout
        const nodePositions = new Map();

        // Data Packets moving along paths
        class Packet {
            constructor(fromNode, toNode, offset = 0) {
                this.from = fromNode;
                this.to = toNode;
                this.progress = offset; // 0.0 to 1.0
                this.speed = 0.002 + Math.random() * 0.003;
                this.size = Math.random() * 2 + 1.5;
                this.trail = [];
                this.maxTrail = 10;
            }

            update() {
                this.progress += this.speed;
                if (this.progress >= 1.0) {
                    this.progress = 0;
                    this.trail = [];
                }

                const p1 = nodePositions.get(this.from.id);
                const p2 = nodePositions.get(this.to.id);

                if (!p1 || !p2) return;

                // Bezier curve control points
                const cp1x = p1.x + (p2.x - p1.x) * 0.5;
                const cp1y = p1.y;
                const cp2x = p1.x + (p2.x - p1.x) * 0.5;
                const cp2y = p2.y;

                const t = this.progress;
                const u = 1 - t;
                const tt = t * t;
                const uu = u * u;
                const uuu = uu * u;
                const ttt = tt * t;

                this.x = uuu * p1.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * p2.x;
                this.y = uuu * p1.y + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * p2.y;

                this.trail.unshift({ x: this.x, y: this.y });
                if (this.trail.length > this.maxTrail) {
                    this.trail.pop();
                }
            }

            draw(ctx, colorAmount) {
                if (this.trail.length === 0) return;

                const currentColor = lerpColor(SIGN_IN_COLOR, SIGN_UP_COLOR, colorAmount);
                const rgb = hexToRgb(currentColor);

                // Draw trail
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                }
                ctx.strokeStyle = `rgba(${rgb}, 0.5)`;
                ctx.lineWidth = this.size * 0.8;
                ctx.stroke();

                // Draw packet head
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = currentColor;
                ctx.shadowColor = currentColor;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            }
        }

        const packets = [];
        const initPackets = () => {
            // Source -> Core
            sourceNodes.forEach(src => {
                for (let i = 0; i < 3; i++) {
                    packets.push(new Packet(src, coreNode, Math.random()));
                }
            });
            // Core -> Features
            featureNodes.forEach(feat => {
                for (let i = 0; i < 3; i++) {
                    packets.push(new Packet(coreNode, feat, Math.random()));
                }
            });
        };

        initPackets();

        // Calculate layout
        const layoutNodes = () => {
            const centerX = width * 0.5;
            const centerY = height * 0.5;

            // Adjust spread based on available width
            const xSpread = Math.min(width * 0.20, 160);
            const ySpread = Math.min(height * 0.25, 150);

            // Core in center
            nodePositions.set(coreNode.id, { x: centerX, y: centerY });

            // Sources on left
            sourceNodes.forEach((node, i) => {
                const yOffset = (i - 1) * ySpread;
                nodePositions.set(node.id, { x: centerX - xSpread, y: centerY + yOffset });
            });

            // Features on right
            featureNodes.forEach((node, i) => {
                const yOffset = (i - 1) * ySpread;
                nodePositions.set(node.id, { x: centerX + xSpread, y: centerY + yOffset });
            });
        };

        const drawHexagon = (ctx, x, y, size, activeColorRgb, isCore = false) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - (Math.PI / 6); // Pointy top
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();

            ctx.fillStyle = DATA_NODE_BG;
            ctx.fill();

            ctx.lineWidth = isCore ? 2 : 1.5;
            ctx.strokeStyle = `rgba(${activeColorRgb}, ${isCore ? 0.8 : 0.5})`;

            if (isCore) {
                ctx.shadowColor = `rgb(${activeColorRgb})`;
                ctx.shadowBlur = 15;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Inner styling
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - (Math.PI / 6);
                const hx = x + (size - 6) * Math.cos(angle);
                const hy = y + (size - 6) * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(${activeColorRgb}, 0.05)`;
            ctx.fill();
            ctx.strokeStyle = `rgba(${activeColorRgb}, 0.2)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        const drawCurve = (ctx, p1, p2, activeColorRgb, highlightIntensity = 0) => {
            const cp1x = p1.x + (p2.x - p1.x) * 0.5;
            const cp1y = p1.y;
            const cp2x = p1.x + (p2.x - p1.x) * 0.5;
            const cp2y = p2.y;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);

            const baseAlpha = 0.15;
            const highlightAlpha = highlightIntensity * 0.5;

            ctx.strokeStyle = `rgba(${activeColorRgb}, ${baseAlpha + highlightAlpha})`;
            ctx.lineWidth = 1.5 + (highlightIntensity * 2);
            ctx.stroke();

            // Add dashed overlay for military/schematic feel
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = `rgba(${activeColorRgb}, ${0.3 + highlightIntensity * 0.4})`;
            ctx.stroke();
            ctx.restore();
        };

        // UI Grid / HUD Background
        const drawGrid = (ctx) => {
            const gridSize = 40;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;

            // Mouse parallax offset for grid
            const offsetX = (mouseRef.current.x - width/2) * 0.02;
            const offsetY = (mouseRef.current.y - height/2) * 0.02;

            ctx.beginPath();
            for (let x = (offsetX % gridSize); x < width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (let y = (offsetY % gridSize); y < height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();

            // Crosshairs at intersections randomly
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let x = (offsetX % gridSize); x < width; x += gridSize * 4) {
                for (let y = (offsetY % gridSize); y < height; y += gridSize * 4) {
                    ctx.fillRect(x - 2, y, 5, 1);
                    ctx.fillRect(x, y - 2, 1, 5);
                }
            }
        };

        let currentColorAmount = isSignIn ? 0 : 1;
        let time = 0;

        const animate = () => {
            time += 0.01;

            // Smoothly update color state
            const targetColorAmount = isSignInRef.current ? 0 : 1;
            currentColorAmount += (targetColorAmount - currentColorAmount) * 0.05;

            // Smooth mouse tracking
            if(mouseRef.current.isActive) {
                mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
                mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;
            } else {
                 // Slowly drift to center if inactive
                 mouseRef.current.x += (width/2 - mouseRef.current.x) * 0.02;
                 mouseRef.current.y += (height/2 - mouseRef.current.y) * 0.02;
            }

            const currentColor = lerpColor(SIGN_IN_COLOR, SIGN_UP_COLOR, currentColorAmount);
            const rgb = hexToRgb(currentColor);

            // Clear Background
            ctx.fillStyle = '#050508'; // Very dark base
            ctx.fillRect(0, 0, width, height);

            drawGrid(ctx);

            layoutNodes();

            // Parallax offset for nodes based on mouse
            const pOffsetX = (mouseRef.current.x - width/2) * -0.015;
            const pOffsetY = (mouseRef.current.y - height/2) * -0.015;

            // Apply global offset
            ctx.save();
            ctx.translate(pOffsetX, pOffsetY);

            // Determine if mouse is near any path or node
            const mX = mouseRef.current.x - pOffsetX;
            const mY = mouseRef.current.y - pOffsetY;

            // Draw Paths
            sourceNodes.forEach(src => {
                const p1 = nodePositions.get(src.id);
                const p2 = nodePositions.get(coreNode.id);

                // Simple distance check to path bounding box for highlight
                let highlight = 0;
                if (mX > p1.x && mX < p2.x && mY > Math.min(p1.y, p2.y) - 50 && mY < Math.max(p1.y, p2.y) + 50) {
                    highlight = 1;
                }

                drawCurve(ctx, p1, p2, rgb, highlight);
            });

            featureNodes.forEach(feat => {
                const p1 = nodePositions.get(coreNode.id);
                const p2 = nodePositions.get(feat.id);

                let highlight = 0;
                if (mX > p1.x && mX < p2.x && mY > Math.min(p1.y, p2.y) - 50 && mY < Math.max(p1.y, p2.y) + 50) {
                    highlight = 1;
                }

                drawCurve(ctx, p1, p2, rgb, highlight);
            });

            // Update and draw packets
            packets.forEach(p => {
                p.update();
                p.draw(ctx, currentColorAmount);
            });

            // Draw Nodes
            allNodes.forEach(node => {
                const pos = nodePositions.get(node.id);
                const isCore = node.role === 'center';
                const size = isCore ? 60 : 40;

                // Pulse core slightly
                const pulse = isCore ? Math.sin(time * 3) * 3 : 0;

                // Check mouse proximity to node
                const dist = Math.sqrt(Math.pow(mX - pos.x, 2) + Math.pow(mY - pos.y, 2));
                const hoverAmt = Math.max(0, 1 - (dist / (size * 2)));

                // Draw Hexagon base
                drawHexagon(ctx, pos.x, pos.y, size + pulse + (hoverAmt * 5), rgb, isCore);

                // Draw connecting rings (aesthetic)
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size + 15, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${rgb}, ${0.1 + hoverAmt * 0.2})`;
                ctx.setLineDash([2, 8]);

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(time * (isCore ? 0.5 : -0.2));
                ctx.stroke();
                ctx.restore();
                ctx.setLineDash([]); // reset

                // Typography
                ctx.textAlign = isCore ? 'center' : (node.role === 'source' ? 'right' : 'left');
                ctx.textBaseline = 'middle';

                const textX = pos.x + (isCore ? 0 : (node.role === 'source' ? -size - 25 : size + 25));
                const textY = pos.y;

                // Title
                ctx.font = '600 13px "Inter", "SF Pro Display", sans-serif';
                ctx.fillStyle = ACCENT_COLOR;
                ctx.fillText(node.label, textX, isCore ? textY - 80 : textY - 8);

                // Subtext
                if (node.subtext) {
                    ctx.font = '400 11px "JetBrains Mono", monospace';
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.fillText(node.subtext, textX, textY + 8);
                }

                // Terminal output for core
                if (isCore) {
                    ctx.font = '400 10px "JetBrains Mono", monospace';
                    ctx.fillStyle = `rgba(${rgb}, 0.8)`;
                    ctx.fillText(`STATUS: SYNCING...`, textX, textY + 80);

                    // Rotating ID hash
                    const hash = Math.floor(Math.abs(Math.sin(time) * 10000000)).toString(16).toUpperCase();
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.fillText(`SEQ_${hash}`, textX, textY + 95);
                }

                // Draw tiny technical dots on node edges
                ctx.fillStyle = `rgb(${rgb})`;
                ctx.fillRect(pos.x - 2, pos.y - size - 2, 4, 4);
                ctx.fillRect(pos.x - 2, pos.y + size - 2, 4, 4);
            });

            ctx.restore(); // Restore from parallax offset

            // Vignette overlay to blend edges
            const grad = ctx.createRadialGradient(width/2, height/2, height*0.3, width/2, height/2, height);
            grad.addColorStop(0, 'rgba(5, 5, 8, 0)');
            grad.addColorStop(1, 'rgba(5, 5, 8, 0.9)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Mouse handlers
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.targetX = e.clientX - rect.left;
            mouseRef.current.targetY = e.clientY - rect.top;
            if(!mouseRef.current.isActive) {
                // Instantly snap on first enter
                mouseRef.current.x = mouseRef.current.targetX;
                mouseRef.current.y = mouseRef.current.targetY;
            }
            mouseRef.current.isActive = true;
        };

        const handleMouseLeave = () => {
            mouseRef.current.isActive = false;
        };

        const parent = canvas.parentElement;
        if (parent) {
             parent.addEventListener('mousemove', handleMouseMove);
             parent.addEventListener('mouseleave', handleMouseLeave);
             window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (parent) {
                parent.removeEventListener('mousemove', handleMouseMove);
                parent.removeEventListener('mouseleave', handleMouseLeave);
                window.removeEventListener('mousemove', handleMouseMove);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ display: 'block' }}
        />
    );
}
