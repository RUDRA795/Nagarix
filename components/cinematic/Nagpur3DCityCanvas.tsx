'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';

interface Nagpur3DCityProps {
  interactive?: boolean;
}

export function Nagpur3DCityCanvas({ interactive = true }: Nagpur3DCityProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / width - 0.5;
      const ny = (e.clientY - rect.top) / height - 0.5;
      mouseRef.current.targetX = nx * 35;
      mouseRef.current.targetY = ny * 25;
    };
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // ── CITY GRID & BUILDINGS MODEL (Nagpur Radial Plan) ──
    const buildings: Array<{
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      isLandmark?: boolean;
      colorIndex: number;
    }> = [];

    // Generate concentric city blocks & radial corridors
    for (let r = 50; r <= 320; r += 32) {
      const count = Math.floor((r * 2 * Math.PI) / 40);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (r % 2 === 0 ? 0.1 : 0);
        // Leave gaps for 4 main radial corridors (Wardha Rd, Amravati Rd, Kamptee Rd, Bhandara Rd)
        const inCorridor =
          Math.abs(angle - 0) < 0.15 ||
          Math.abs(angle - Math.PI / 2) < 0.15 ||
          Math.abs(angle - Math.PI) < 0.15 ||
          Math.abs(angle - (3 * Math.PI) / 2) < 0.15;

        if (!inCorridor && Math.random() > 0.2) {
          const bx = Math.cos(angle) * r;
          const bz = Math.sin(angle) * r;
          const bh = 15 + Math.random() * 55 * Math.max(0.2, 1 - r / 380);
          buildings.push({
            x: bx,
            z: bz,
            w: 16 + Math.random() * 10,
            d: 16 + Math.random() * 10,
            h: bh,
            isLandmark: r < 100 && Math.random() > 0.7,
            colorIndex: Math.floor(Math.random() * 3),
          });
        }
      }
    }

    // ── DATA NODES & CIVIC PULSES ──────────────────────────
    const nodes = [
      { x: -70, z: -40, type: 'Road', color: '#f97316' },
      { x: 60, z: 70, type: 'Water', color: '#3b82f6' },
      { x: -50, z: 90, type: 'Waste', color: '#8b5cf6' },
      { x: 100, z: -60, type: 'Light', color: '#eab308' },
      { x: 0, z: 0, type: 'ZeroMile', color: '#ea580c', isHub: true },
      { x: -120, z: -100, type: 'Drainage', color: '#06b6d4' },
      { x: 130, z: 40, type: 'Traffic', color: '#f97316' },
    ];

    let pulseRadius = 0;
    let angleOrbit = 0;

    // ── RENDER LOOP ─────────────────────────────────────────
    const render = () => {
      // Smooth camera interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      angleOrbit += 0.0015; // Very slow majestic orbit
      pulseRadius = (pulseRadius + 1.2) % 360;

      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';
      const centerX = width * 0.5 + mouseRef.current.x;
      const centerY = height * 0.52 + mouseRef.current.y;
      const fov = 420;

      // ── 1. RENDER GROUND RADIAL RINGS (Deekshabhoomi/Zero-Mile motif) ──
      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring grid
      for (let r = 60; r <= 360; r += 50) {
        ctx.beginPath();
        ctx.ellipse(0, 80, r, r * 0.38, 0, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.07)' : 'rgba(234, 88, 12, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 4 Main Radial Corridors
      const corridorLength = 360;
      const corridorAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
      corridorAngles.forEach(ang => {
        const cos = Math.cos(ang + angleOrbit * 0.2);
        const sin = Math.sin(ang + angleOrbit * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.lineTo(cos * corridorLength, 80 + sin * corridorLength * 0.38);
        ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.09)' : 'rgba(234, 88, 12, 0.1)';
        ctx.stroke();
      });

      // ── 2. RENDER EXPANDING ORANGE CIVIC PULSE ───────────────
      ctx.beginPath();
      ctx.ellipse(0, 80, pulseRadius, pulseRadius * 0.38, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark
        ? `rgba(249, 115, 22, ${Math.max(0, 1 - pulseRadius / 360) * 0.6})`
        : `rgba(234, 88, 12, ${Math.max(0, 1 - pulseRadius / 360) * 0.5})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = isDark ? 16 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 3. RENDER 3D BUILDINGS ──────────────────────────────
      // Sort buildings from back to front
      const rotatedBuildings = buildings.map(b => {
        const cos = Math.cos(angleOrbit);
        const sin = Math.sin(angleOrbit);
        const rx = b.x * cos - b.z * sin;
        const rz = b.x * sin + b.z * cos;
        return { ...b, rx, rz };
      }).sort((a, b) => a.rz - b.rz);

      rotatedBuildings.forEach(b => {
        const scale = fov / (fov + b.rz + 200);
        if (scale <= 0) return;

        const screenX = b.rx * scale;
        const groundY = 80 + b.rz * 0.38 * scale;
        const roofY = groundY - b.h * scale;
        const bw = b.w * scale;
        const bd = b.d * scale * 0.38;

        // Colors
        let wallColor = isDark ? 'rgba(15, 31, 61, 0.65)' : 'rgba(240, 235, 224, 0.85)';
        let roofColor = isDark ? 'rgba(22, 35, 66, 0.85)' : 'rgba(255, 255, 255, 0.95)';
        let edgeColor = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 88, 12, 0.2)';

        if (b.isLandmark) {
          roofColor = isDark ? 'rgba(249, 115, 22, 0.4)' : 'rgba(234, 88, 12, 0.35)';
          edgeColor = '#f97316';
        }

        // Draw Building Sides
        ctx.fillStyle = wallColor;
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 0.8;

        // Front Face
        ctx.beginPath();
        ctx.moveTo(screenX - bw / 2, groundY);
        ctx.lineTo(screenX + bw / 2, groundY);
        ctx.lineTo(screenX + bw / 2, roofY);
        ctx.lineTo(screenX - bw / 2, roofY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Top Roof
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(screenX - bw / 2, roofY);
        ctx.lineTo(screenX, roofY - bd);
        ctx.lineTo(screenX + bw / 2, roofY);
        ctx.lineTo(screenX, roofY + bd);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // ── 4. RENDER DATA NODES & NETWORK CONNECTIONS ──────────
      const rotatedNodes = nodes.map(n => {
        const cos = Math.cos(angleOrbit);
        const sin = Math.sin(angleOrbit);
        const rx = n.x * cos - n.z * sin;
        const rz = n.x * sin + n.z * cos;
        const scale = fov / (fov + rz + 200);
        return {
          ...n,
          sx: rx * scale,
          sy: 80 + rz * 0.38 * scale - 24 * scale,
          scale,
        };
      });

      // Connect nearby nodes with glowing neural lines
      for (let i = 0; i < rotatedNodes.length; i++) {
        for (let j = i + 1; j < rotatedNodes.length; j++) {
          const n1 = rotatedNodes[i];
          const n2 = rotatedNodes[j];
          const dist = Math.hypot(n1.sx - n2.sx, n1.sy - n2.sy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(n1.sx, n1.sy);
            ctx.lineTo(n2.sx, n2.sy);
            ctx.strokeStyle = isDark
              ? `rgba(249, 115, 22, ${0.35 * (1 - dist / 180)})`
              : `rgba(234, 88, 12, ${0.3 * (1 - dist / 180)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // Draw floating node beacons
      rotatedNodes.forEach(n => {
        const radius = (n.isHub ? 6 : 4) * n.scale;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = isDark ? 12 : 6;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.sx, n.sy, radius * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [theme, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.9,
      }}
    />
  );
}
