import React, { useRef, useEffect } from 'react';

// Utility for smooth color interpolation
function lerpColor(a, b, amount) {
    const ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1).padStart(6, '0');
}

// Convert hex to rgb string for alpha manipulation
function hexToRgb(hex) {
    // Make sure we have a valid string, pad if lerpColor returned short hex
    if (!hex || typeof hex !== 'string') return '0, 0, 0';
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2];
    }
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

export function AuthAnimation({ isSignIn }) {
    const canvasRef = useRef(null);
    const isSignInRef = useRef(isSignIn);
    const mouseRef = useRef({ x: -1000, y: -1000, isActive: false });

    // Update ref when prop changes to avoid re-triggering the whole effect
    useEffect(() => {
        isSignInRef.current = isSignIn;
    }, [isSignIn]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Serious Military-Grade / Data Node Colors
        const SIGN_IN_COLOR = '#00f2fe'; // Bright Teal
        const SIGN_UP_COLOR = '#6366f1'; // Indigo

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

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.baseVx = this.vx;
                this.baseVy = this.vy;
                this.radius = Math.random() * 1.5 + 0.5;
                this.colorAmount = isSignInRef.current ? 0 : 1;
            }

            update() {
                const targetColorAmount = isSignInRef.current ? 0 : 1;
                this.colorAmount += (targetColorAmount - this.colorAmount) * 0.05;

                const isWarping = Math.abs(targetColorAmount - this.colorAmount) > 0.01;
                const speedMultiplier = isWarping ? 4 : 1; // Warp speed during transition

                if (mouseRef.current.isActive) {
                    const dx = mouseRef.current.x - this.x;
                    const dy = mouseRef.current.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 250;

                    if (dist < maxDist) {
                        const force = (maxDist - dist) / maxDist;
                        // Magnetic repulsion
                        this.vx -= (dx / dist) * force * 0.8;
                        this.vy -= (dy / dist) * force * 0.8;
                    }
                }

                // Friction to return to base speed
                this.vx += (this.baseVx * speedMultiplier - this.vx) * 0.05;
                this.vy += (this.baseVy * speedMultiplier - this.vy) * 0.05;

                this.x += this.vx;
                this.y += this.vy;

                // Wrap around edges smoothly
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw(ctx) {
                const currentColor = lerpColor(SIGN_IN_COLOR, SIGN_UP_COLOR, this.colorAmount);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = currentColor;
                ctx.fill();
            }
        }

        let particles = [];
        const initParticles = () => {
            particles = [];
            const area = width * height;
            // Higher particle density for a more complex "fluid data" look
            const count = Math.min(Math.floor(area / 5000), 400);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        // Delay init to ensure parent has sized correctly
        setTimeout(() => {
            resize();
            initParticles();
        }, 0);

        const drawConnections = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const maxDist = 130;
                    if (dist < maxDist) {
                        const opacity = 1 - (dist / maxDist);
                        const colorAmount = (particles[i].colorAmount + particles[j].colorAmount) / 2;
                        const currentColor = lerpColor(SIGN_IN_COLOR, SIGN_UP_COLOR, colorAmount);
                        const rgb = hexToRgb(currentColor);

                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.4})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        };

        // Procedural fluid noise background variables
        let t = 0;
        let t2 = 0;
        const animate = () => {
            // WebGL-like procedural fluid shader effect in 2D
            t += 0.005;
            t2 += 0.01;

            // Draw gradient background that subtly pulses
            const pulse = Math.sin(t * 2) * 0.05 + 0.95;
            const bgGradient = ctx.createLinearGradient(0, 0, width, height);

            // Adjust base color slightly based on state
            const targetColorAmount = isSignInRef.current ? 0 : 1;
            const baseGlow = lerpColor(SIGN_IN_COLOR, SIGN_UP_COLOR, targetColorAmount);
            const baseGlowRgb = hexToRgb(baseGlow);

            bgGradient.addColorStop(0, `rgba(5, 5, 8, ${0.4 * pulse})`);
            bgGradient.addColorStop(1, `rgba(${baseGlowRgb}, ${0.05 * pulse})`);

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // Overlay fluid waves simulating shader noise
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // Render multiple interacting wave planes
            for(let layer = 0; layer < 3; layer++) {
                ctx.beginPath();
                const offsetY = (layer * height) / 4;
                const amplitude = 100 + layer * 30;
                const speed = t + layer * t2 * 0.5;

                for (let i = 0; i <= width; i += 30) {
                    // Combine sine waves to simulate noise/fluid
                    const waveY = height/2 + offsetY - 100 +
                                  Math.sin(i * 0.005 + speed) * amplitude +
                                  Math.cos(i * 0.01 - speed * 1.5) * (amplitude/2);

                    if (i === 0) ctx.moveTo(i, waveY);
                    else ctx.lineTo(i, waveY);
                }
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);

                ctx.fillStyle = `rgba(${baseGlowRgb}, ${0.015 + layer * 0.005})`;
                ctx.fill();
            }
            ctx.restore();

            // Darken slightly to keep contrast high for particles
            ctx.fillStyle = 'rgba(10, 10, 12, 0.5)';
            ctx.fillRect(0, 0, width, height);

            // Subtle glow tracking the mouse
            if (mouseRef.current.isActive) {
                const gradient = ctx.createRadialGradient(
                    mouseRef.current.x, mouseRef.current.y, 0,
                    mouseRef.current.x, mouseRef.current.y, 400
                );

                // Color matches the current state
                const currentAmount = isSignInRef.current ? 0 : 1;
                const glowColor = lerpColor(SIGN_IN_COLOR, SIGN_UP_COLOR, currentAmount);
                const rgb = hexToRgb(glowColor);

                gradient.addColorStop(0, `rgba(${rgb}, 0.08)`);
                gradient.addColorStop(1, 'rgba(10, 10, 12, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            particles.forEach(p => p.update());
            drawConnections();
            particles.forEach(p => p.draw(ctx));

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Mouse handlers on parent container to capture relative coords
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                isActive: true
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.isActive = false;
        };

        const parent = canvas.parentElement;
        if (parent) {
             parent.addEventListener('mousemove', handleMouseMove);
             parent.addEventListener('mouseleave', handleMouseLeave);
             // Also listen on window to keep tracking if mouse moves quickly
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
