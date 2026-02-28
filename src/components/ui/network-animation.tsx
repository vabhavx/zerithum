"use client";

import React, { useRef, useEffect } from "react";

export function NetworkAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth / 2;
    let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const nodes: Node[] = [];
    const numNodes = 120; // Enterprise-grade density
    const maxDistance = 150;

    // Aesthetic colors
    const colors = [
      "#00e5ff", // Cyber blue (Zerithum core/Primary)
      "#00ff7f", // Tactical green (Bank deposits/Success)
      "#ffaa00", // Warning orange (Stripe/Anomalies)
      "#ff2a2a", // Alert red (YouTube/Flags)
      "#a020f0"  // Deep purple (External APIs)
    ];

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      originalRadius: number;
      label?: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 2.5 + 1;
        this.originalRadius = this.radius;
        this.color = colors[Math.floor(Math.random() * colors.length)];

        // Assign some labels to make it feel like real data
        if (Math.random() > 0.9) {
          const labels = ["STRIPE_API", "YT_DATA_API", "BANK_SYNC", "ZERITHUM_CORE", "TAX_ENGINE", "ANOMALY_DETECT"];
          this.label = labels[Math.floor(Math.random() * labels.length)];
          this.radius *= 2; // Make labeled nodes bigger
          this.originalRadius = this.radius;
        }
      }

      update(mouse: { x: number; y: number; radius: number }) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction (repel)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.radius;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * 5;
          const directionY = forceDirectionY * force * 5;

          this.x -= directionX;
          this.y -= directionY;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        if (this.label) {
          ctx.font = "10px monospace";
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillText(this.label, this.x + 8, this.y + 3);
        }
      }
    }

    // Initialize nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push(new Node(Math.random() * width, Math.random() * height));
    }

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;

    const animate = () => {
      // Obsidian background with slight trail effect
      ctx.fillStyle = "rgba(10, 14, 23, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();

            // Create gradient line between nodes based on their colors
            const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);

            // Opacity based on distance
            const opacity = 1 - (distance / maxDistance);

            // Function to add alpha to hex
            const addAlpha = (hex: string, alpha: number) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            gradient.addColorStop(0, addAlpha(nodes[i].color, opacity * 0.5));
            gradient.addColorStop(1, addAlpha(nodes[j].color, opacity * 0.5));

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw mouse connections (Data sync visual)
      for (let i = 0; i < nodes.length; i++) {
        const dx = mouse.x - nodes[i].x;
        const dy = mouse.y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius * 1.5) {
          ctx.beginPath();
          const opacity = 1 - (distance / (mouse.radius * 1.5));
          ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.8})`; // Bright cyber blue connection
          ctx.lineWidth = 1.5;
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(nodes[i].x, nodes[i].y);
          ctx.stroke();

          // Draw small scanning rings at connection points
          if (Math.random() > 0.95) {
             ctx.beginPath();
             ctx.arc(nodes[i].x, nodes[i].y, 5, 0, Math.PI * 2);
             ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
             ctx.stroke();
          }
        }
      }

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].update(mouse);
        nodes[i].draw(ctx);
      }

      // Draw grid overlay for military scanner feel
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw crosshairs at mouse
      if (mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.moveTo(mouse.x - 15, mouse.y);
        ctx.lineTo(mouse.x + 15, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - 15);
        ctx.lineTo(mouse.x, mouse.y + 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "10px monospace";
        ctx.fillStyle = "rgba(0, 229, 255, 0.8)";
        ctx.fillText(`LOC: ${Math.round(mouse.x)}, ${Math.round(mouse.y)}`, mouse.x + 15, mouse.y - 15);
        ctx.fillText(`TARGETS: ${nodes.filter(n => Math.sqrt(Math.pow(mouse.x - n.x, 2) + Math.pow(mouse.y - n.y, 2)) < mouse.radius * 1.5).length}`, mouse.x + 15, mouse.y - 5);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0e17] overflow-hidden">
      <div className="absolute top-4 left-4 z-10 font-mono text-xs text-[#00e5ff] opacity-70">
        <div>SYS.STATUS: ONLINE</div>
        <div>UPLINK: SECURE</div>
        <div>DATA.SYNC: ACTIVE</div>
      </div>
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />
      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, #0a0e17 100%)'
      }} />
      <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-[#0a0e17] to-transparent pointer-events-none" />
    </div>
  );
}
