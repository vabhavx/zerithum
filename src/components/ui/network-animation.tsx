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

    const centerX = width / 2;
    const centerY = height / 2;

    // Military/Enterprise Palette
    const bgDark = "#030712"; // Deep slate/obsidian
    const primaryGrid = "rgba(0, 229, 255, 0.08)"; // Faint cyan grid
    const coreBlue = "#00e5ff"; // Bright cyan
    const dataStreamAlpha = "rgba(0, 229, 255, 0.4)";
    const alertOrange = "#ff4d4d"; // High-contrast red/orange for anomalies
    const pureWhiteAlpha = "rgba(255, 255, 255, 0.8)";

    class DataPoint {
      x: number;
      y: number;
      angle: number;
      radius: number;
      speed: number;
      size: number;
      isAnomaly: boolean;

      constructor(radius: number, speed: number, isAnomaly = false) {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = radius;
        this.speed = speed;
        this.x = 0;
        this.y = 0;
        this.size = isAnomaly ? 3 : 1.5;
        this.isAnomaly = isAnomaly;
      }

      update() {
        this.angle += this.speed;
        this.x = centerX + Math.cos(this.angle) * this.radius;
        this.y = centerY + Math.sin(this.angle) * this.radius;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isAnomaly ? alertOrange : coreBlue;
        ctx.fill();

        // Glow
        if (this.isAnomaly) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = alertOrange;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      }
    }

    // Initialize structured data streams (orbits)
    const orbits = [
        { radius: 120, speed: 0.005, count: 12, label: "BANK_DEPOSITS_SYN" },
        { radius: 200, speed: -0.003, count: 24, label: "STRIPE_REVENUE_STREAM" },
        { radius: 280, speed: 0.002, count: 36, label: "YOUTUBE_AD_DATA" }
    ];

    const dataPoints: DataPoint[] = [];
    orbits.forEach(orbit => {
        for(let i=0; i<orbit.count; i++) {
            // 5% chance of being an "anomaly"
            const isAnomaly = Math.random() > 0.95;
            dataPoints.push(new DataPoint(orbit.radius, orbit.speed, isAnomaly));
        }
    });


    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const handleMouseLeave = () => { mouse.active = false; };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;
    let time = 0;

    const drawGrid = () => {
      ctx.strokeStyle = primaryGrid;
      ctx.lineWidth = 1;
      const gridSize = 40;

      const offsetX = (time * 0.5) % gridSize;
      const offsetY = (time * 0.5) % gridSize;

      ctx.beginPath();
      for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        ctx.moveTo(x + offsetX, 0);
        ctx.lineTo(x + offsetX, height);
      }
      for (let y = -gridSize; y < height + gridSize; y += gridSize) {
        ctx.moveTo(0, y + offsetY);
        ctx.lineTo(width, y + offsetY);
      }
      ctx.stroke();

      // Draw structural markers (crosshairs at intersections)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      for (let x = -gridSize; x < width + gridSize; x += gridSize * 4) {
          for (let y = -gridSize; y < height + gridSize; y += gridSize * 4) {
              ctx.beginPath();
              ctx.moveTo(x + offsetX - 5, y + offsetY);
              ctx.lineTo(x + offsetX + 5, y + offsetY);
              ctx.moveTo(x + offsetX, y + offsetY - 5);
              ctx.lineTo(x + offsetX, y + offsetY + 5);
              ctx.stroke();
          }
      }
    };

    const drawCore = () => {
        // Central Core Data Reconciler
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 229, 255, 0.05)";
        ctx.fill();
        ctx.strokeStyle = coreBlue;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner spinning ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, time * 0.02, time * 0.02 + Math.PI * 1.5);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Core text
        ctx.font = "10px monospace";
        ctx.fillStyle = coreBlue;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ZERITHUM", centerX, centerY - 6);
        ctx.fillText("CORE", centerX, centerY + 6);
    };

    const drawOrbits = () => {
        orbits.forEach(orbit => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbit.radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
            ctx.lineWidth = 1;
            // Dashed line for technical feel
            ctx.setLineDash([4, 8]);
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // Orbit label (rotating slightly)
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(-time * 0.001);
            ctx.fillStyle = "rgba(0, 229, 255, 0.4)";
            ctx.font = "9px monospace";
            ctx.textAlign = "left";
            ctx.fillText(orbit.label, 0, -orbit.radius - 4);
            ctx.restore();
        });
    };

    const drawNetworkConnections = () => {
        // Connect nodes to the core when they align, simulating data ingestion
        ctx.beginPath();
        dataPoints.forEach(point => {
            // Draw a line to center if angle is near a cardinal direction
            const normalizedAngle = ((point.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const isIngesting =
                Math.abs(normalizedAngle - 0) < 0.1 ||
                Math.abs(normalizedAngle - Math.PI/2) < 0.1 ||
                Math.abs(normalizedAngle - Math.PI) < 0.1 ||
                Math.abs(normalizedAngle - Math.PI*1.5) < 0.1;

            if (isIngesting) {
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(centerX, centerY);

                // Draw data packet moving along line
                const progress = (Math.sin(time * 0.1) + 1) / 2;
                const px = point.x + (centerX - point.x) * progress;
                const py = point.y + (centerY - point.y) * progress;

                ctx.fillStyle = pureWhiteAlpha;
                ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
            }
        });
        ctx.strokeStyle = "rgba(0, 229, 255, 0.2)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Draw connections between nodes in adjacent orbits
        ctx.beginPath();
        for(let i=0; i<dataPoints.length; i++) {
            for(let j=i+1; j<dataPoints.length; j++) {
                const p1 = dataPoints[i];
                const p2 = dataPoints[j];

                // Only connect if different orbits but close in angle
                if (p1.radius !== p2.radius) {
                    const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                    if (dist < 100) {
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                }
            }
        }
        ctx.strokeStyle = "rgba(0, 229, 255, 0.05)";
        ctx.stroke();
    };

    const drawTargetingSystem = () => {
        if (!mouse.active) return;

        // Find nearest data point
        let nearest: DataPoint | null = null;
        let minDist = Infinity;

        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(p.x - mouse.x, 2) + Math.pow(p.y - mouse.y, 2));
            if (dist < minDist && dist < 150) {
                minDist = dist;
                nearest = p;
            }
        });

        // Draw reticle at mouse
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mouse.x - 25, mouse.y);
        ctx.lineTo(mouse.x - 15, mouse.y);
        ctx.moveTo(mouse.x + 15, mouse.y);
        ctx.lineTo(mouse.x + 25, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - 25);
        ctx.lineTo(mouse.x, mouse.y - 15);
        ctx.moveTo(mouse.x, mouse.y + 15);
        ctx.lineTo(mouse.x, mouse.y + 25);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.stroke();

        // Lock onto node
        if (nearest) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(nearest.x, nearest.y);
            ctx.strokeStyle = nearest.isAnomaly ? alertOrange : coreBlue;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Box around node
            ctx.strokeStyle = nearest.isAnomaly ? alertOrange : coreBlue;
            ctx.strokeRect(nearest.x - 5, nearest.y - 5, 10, 10);

            // Readout panel
            const panelX = mouse.x + 30;
            const panelY = mouse.y - 40;

            ctx.fillStyle = "rgba(3, 7, 18, 0.85)";
            ctx.strokeStyle = nearest.isAnomaly ? alertOrange : coreBlue;
            ctx.fillRect(panelX, panelY, 140, 60);
            ctx.strokeRect(panelX, panelY, 140, 60);

            ctx.font = "10px monospace";
            ctx.fillStyle = nearest.isAnomaly ? alertOrange : coreBlue;
            ctx.textAlign = "left";
            ctx.fillText(`ID: 0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6,'0')}`, panelX + 8, panelY + 15);
            ctx.fillText(`STATUS: ${nearest.isAnomaly ? 'ANOMALY DETECTED' : 'VERIFIED'}`, panelX + 8, panelY + 28);
            ctx.fillText(`RAD: ${nearest.radius} | VEL: ${nearest.speed.toFixed(3)}`, panelX + 8, panelY + 41);

            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fillText(`LOC: [${nearest.x.toFixed(1)}, ${nearest.y.toFixed(1)}]`, panelX + 8, panelY + 52);

            // Connecting line to panel
            ctx.beginPath();
            ctx.moveTo(nearest.x + 5, nearest.y - 5);
            ctx.lineTo(panelX, panelY + 60);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.stroke();
        }
    };

    const drawHUD = () => {
        ctx.font = "10px monospace";
        ctx.fillStyle = coreBlue;
        ctx.textAlign = "left";

        const pad = 20;

        // Top Left: System Status
        ctx.fillText("ZERITHUM // RECON_ENGINE v4.2.1", pad, pad + 10);
        ctx.fillText(`UPTIME: ${(time / 60).toFixed(1)}s`, pad, pad + 25);
        ctx.fillText(`NODES ACTIVE: ${dataPoints.length}`, pad, pad + 40);

        // Progress bar
        ctx.strokeStyle = coreBlue;
        ctx.strokeRect(pad, pad + 50, 100, 4);
        ctx.fillRect(pad, pad + 51, 100 * (Math.sin(time*0.05) + 1)/2, 2);

        // Bottom Left: Data processing log
        const logLines = [
            `> RECV: PKT_${Math.floor(time*10)} OK`,
            `> SYNC: BANK_DEP MATCHED`,
            `> CALC: TAX_LIAB UPDATED`,
            `> AWAITING INGESTION...`
        ];

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        logLines.forEach((line, i) => {
            // Flicker effect on first line
            if (i === 0 && Math.random() > 0.8) return;
            ctx.fillText(line, pad, height - pad - (logLines.length - i - 1) * 15);
        });

        // Top Right: Server Info
        ctx.textAlign = "right";
        ctx.fillStyle = coreBlue;
        ctx.fillText("SERVER: US-EAST-1", width - pad, pad + 10);
        ctx.fillText("LATENCY: 12ms", width - pad, pad + 25);
        ctx.fillText("ENCRYPTION: AES-256", width - pad, pad + 40);

        // Radar Sweep in corner
        const radarX = width - pad - 40;
        const radarY = height - pad - 40;
        const radarRad = 30;

        ctx.beginPath();
        ctx.arc(radarX, radarY, radarRad, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.3)";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(radarX, radarY);
        ctx.arc(radarX, radarY, radarRad, time * 0.05, time * 0.05 + 0.5);
        ctx.lineTo(radarX, radarY);
        ctx.fillStyle = "rgba(0, 229, 255, 0.2)";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(radarX, radarY);
        ctx.lineTo(radarX + Math.cos(time*0.05)*radarRad, radarY + Math.sin(time*0.05)*radarRad);
        ctx.strokeStyle = coreBlue;
        ctx.stroke();
    };


    const animate = () => {
      // Clear with dark background
      ctx.fillStyle = bgDark;
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      drawOrbits();
      drawNetworkConnections();

      // Update and draw points
      dataPoints.forEach(p => {
          p.update();
          p.draw(ctx);
      });

      drawCore();
      drawTargetingSystem();
      drawHUD();

      time++;
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
    <div className="relative w-full h-full bg-[#030712] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />

      {/* Subtle scanline overlay for CRT/Terminal feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
        style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 229, 255, 0.1) 1px, rgba(0, 229, 255, 0.1) 2px)`
        }}
      />

      {/* Vignette overlay to darken edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
            background: 'radial-gradient(circle at center, transparent 30%, #030712 100%)'
        }}
      />
    </div>
  );
}
