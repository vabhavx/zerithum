import React, { useRef, useEffect } from 'react';

export function AuthDataAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize by disabling alpha on context if background is opaque
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const mouse = { x: -1000, y: -1000 };

    // Core Colors
    const BG_COLOR = '#030712'; // Military dark
    const ACCENT_COLOR = '#00e5ff'; // Pure cyan
    const MUTED_COLOR = '#1f2937'; // Slate 800 for subtle grid
    const TEXT_COLOR = '#9ca3af'; // Gray 400 for text

    // Node definitions
    interface Node {
      id: string;
      label: string;
      x: number;
      y: number;
      radius: number;
      type: 'source' | 'engine' | 'destination';
      connectedTo: string[];
      glowRadius: number;
    }

    let nodes: Node[] = [];

    // Particle definitions
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetNodeId: string;
      sourceNodeId: string;
      progress: number; // 0 to 1
      speed: number;
      size: number;
      alpha: number;
    }

    let particles: Particle[] = [];
    const MAX_PARTICLES = 150;

    // Grid properties
    const gridSize = 40;

    const initializeNodes = () => {
      // Responsive layout logic
      const cx = width / 2;
      const cy = height / 2;

      const sourceRadius = Math.min(width, height) * 0.35; // Spread sources around
      const engineRadius = 40;

      nodes = [
        // Central Engine
        {
          id: 'zerithum-engine',
          label: 'ZERITHUM CORE',
          x: cx,
          y: cy,
          radius: engineRadius,
          type: 'engine',
          connectedTo: ['bank-ledger'],
          glowRadius: 0
        },
        // Destinations
        {
          id: 'bank-ledger',
          label: 'BANK LEDGER',
          x: cx,
          y: cy + sourceRadius * 0.8,
          radius: 30,
          type: 'destination',
          connectedTo: [],
          glowRadius: 0
        },
        // Sources
        {
          id: 'tiktok',
          label: 'TikTok',
          x: cx - sourceRadius * 0.8,
          y: cy - sourceRadius * 0.4,
          radius: 25,
          type: 'source',
          connectedTo: ['zerithum-engine'],
          glowRadius: 0
        },
        {
          id: 'shopify',
          label: 'Shopify',
          x: cx + sourceRadius * 0.8,
          y: cy - sourceRadius * 0.4,
          radius: 25,
          type: 'source',
          connectedTo: ['zerithum-engine'],
          glowRadius: 0
        },
        {
          id: 'stripe',
          label: 'Stripe',
          x: cx - sourceRadius * 0.4,
          y: cy - sourceRadius * 0.8,
          radius: 25,
          type: 'source',
          connectedTo: ['zerithum-engine'],
          glowRadius: 0
        },
        {
          id: 'paypal',
          label: 'PayPal',
          x: cx + sourceRadius * 0.4,
          y: cy - sourceRadius * 0.8,
          radius: 25,
          type: 'source',
          connectedTo: ['zerithum-engine'],
          glowRadius: 0
        }
      ];
    };

    const spawnParticle = () => {
      if (particles.length >= MAX_PARTICLES) return;

      const sources = nodes.filter(n => n.type === 'source');
      const engine = nodes.find(n => n.id === 'zerithum-engine');
      const bank = nodes.find(n => n.id === 'bank-ledger');

      if (!engine || !bank || sources.length === 0) return;

      // Randomly choose if particle goes from source->engine or engine->bank
      const isIngestion = Math.random() > 0.3;

      let sourceNode, targetNode;

      if (isIngestion) {
        sourceNode = sources[Math.floor(Math.random() * sources.length)];
        targetNode = engine;
      } else {
        sourceNode = engine;
        targetNode = bank;
      }

      particles.push({
        x: sourceNode.x,
        y: sourceNode.y,
        vx: 0,
        vy: 0,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        progress: 0,
        speed: 0.002 + Math.random() * 0.003,
        size: 1.5 + Math.random() * 2,
        alpha: 0
      });
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        initializeNodes();
        particles = []; // clear particles on resize to prevent weird states
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const drawGrid = () => {
      ctx.strokeStyle = MUTED_COLOR;
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      // Moving grid effect
      const offsetX = (Date.now() * 0.02) % gridSize;
      const offsetY = (Date.now() * 0.02) % gridSize;

      for (let x = -offsetX; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = -offsetY; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    };

    const updateAndDrawParticles = () => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const source = nodes.find(n => n.id === p.sourceNodeId);
        const target = nodes.find(n => n.id === p.targetNodeId);

        if (!source || !target) {
          particles.splice(i, 1);
          continue;
        }

        // Update progress
        p.progress += p.speed;

        // Calculate position based on progress (linear interpolation)
        let currentX = source.x + (target.x - source.x) * p.progress;
        let currentY = source.y + (target.y - source.y) * p.progress;

        // Mouse interaction: Repel particles slightly
        const dx = currentX - mouse.x;
        const dy = currentY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 100;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          currentX += (dx / dist) * force * 15;
          currentY += (dy / dist) * force * 15;
        }

        p.x = currentX;
        p.y = currentY;

        // Fade in/out logic
        if (p.progress < 0.1) p.alpha = p.progress * 10;
        else if (p.progress > 0.9) p.alpha = (1 - p.progress) * 10;
        else p.alpha = 1;

        // Remove if reached destination
        if (p.progress >= 1) {
          particles.splice(i, 1);
          // Pulse the target node
          target.glowRadius = 15;
          continue;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
        ctx.fill();

        // Trail effect (simple line to previous position, approximated)
        ctx.beginPath();
        const prevProgress = Math.max(0, p.progress - p.speed * 3);
        const prevX = source.x + (target.x - source.x) * prevProgress;
        const prevY = source.y + (target.y - source.y) * prevProgress;
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(0, 229, 255, ${p.alpha * 0.5})`;
        ctx.lineWidth = p.size;
        ctx.stroke();
      }
    };

    const drawNodes = () => {
      nodes.forEach(node => {
        // Node connection lines
        node.connectedTo.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId);
          if (target) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);

            // Highlight connection if mouse is near
            const mouseToSourceDist = Math.hypot(node.x - mouse.x, node.y - mouse.y);
            const mouseToTargetDist = Math.hypot(target.x - mouse.x, target.y - mouse.y);

            if (mouseToSourceDist < 100 || mouseToTargetDist < 100) {
              ctx.strokeStyle = `rgba(0, 229, 255, 0.4)`;
              ctx.lineWidth = 1.5;
            } else {
              ctx.strokeStyle = `rgba(31, 41, 55, 0.8)`; // Muted line
              ctx.lineWidth = 1;
            }
            ctx.stroke();
          }
        });

        // Update glow
        if (node.glowRadius > 0) {
          node.glowRadius -= 0.5;
        }

        // Draw Node glow
        if (node.glowRadius > 0 || Math.hypot(node.x - mouse.x, node.y - mouse.y) < node.radius + 20) {
          ctx.beginPath();
          const extraGlow = Math.hypot(node.x - mouse.x, node.y - mouse.y) < node.radius + 20 ? 10 : 0;
          ctx.arc(node.x, node.y, node.radius + node.glowRadius + extraGlow, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, 0.1)`;
          ctx.fill();
        }

        // Draw Node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        if (node.type === 'engine') {
           // Complex engine drawing
           ctx.fillStyle = '#0a0f1c'; // Darker core
           ctx.fill();
           ctx.lineWidth = 2;
           ctx.strokeStyle = ACCENT_COLOR;
           ctx.stroke();

           // Inner rotating ring
           ctx.save();
           ctx.translate(node.x, node.y);
           ctx.rotate(Date.now() * 0.001);
           ctx.beginPath();
           ctx.setLineDash([5, 5]);
           ctx.arc(0, 0, node.radius * 0.7, 0, Math.PI * 2);
           ctx.strokeStyle = ACCENT_COLOR;
           ctx.stroke();
           ctx.restore();

           // Inner core
           ctx.beginPath();
           ctx.arc(node.x, node.y, node.radius * 0.3, 0, Math.PI * 2);
           ctx.fillStyle = ACCENT_COLOR;
           ctx.fill();

        } else {
           // Standard node (source/destination)
           ctx.fillStyle = '#0a0f1c';
           ctx.fill();
           ctx.lineWidth = 1.5;
           ctx.strokeStyle = node.type === 'destination' ? '#10b981' : '#3b82f6'; // Green for bank, blue for sources
           ctx.stroke();

           // Small inner dot
           ctx.beginPath();
           ctx.arc(node.x, node.y, node.radius * 0.2, 0, Math.PI * 2);
           ctx.fillStyle = node.type === 'destination' ? '#10b981' : '#3b82f6';
           ctx.fill();
        }

        // Draw Node label
        ctx.font = "10px 'Courier New', monospace";
        ctx.fillStyle = TEXT_COLOR;
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + node.radius + 15);
      });
    };

    const render = () => {
      // Clear background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      drawNodes();

      // Spawn particles periodically
      if (Math.random() < 0.2) { // 20% chance per frame to spawn
        spawnParticle();
      }

      updateAndDrawParticles();

      // Draw "SCANNING" overlay line
      const scanY = (Date.now() * 0.05) % height;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Overlay a subtle vignette / noise if desired (skipping for performance, sticking to pure military vectors)

      animationFrameId = requestAnimationFrame(render);
    };

    // Start loop
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block', backgroundColor: '#030712' }}
    />
  );
}