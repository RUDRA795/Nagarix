'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { usePathname } from 'next/navigation';

export function GlobalNagpur3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const pathname = usePathname();
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / width) - 0.5;
      const ny = (e.clientY / height) - 0.5;
      mouseRef.current.targetX = nx * 40;
      mouseRef.current.targetY = ny * 30;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleScroll = () => {
      scrollRef.current = window.scrollY || document.documentElement.scrollTop;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ── 3D MODEL GEOMETRY GENERATOR: NAGPUR ICONIC STRUCTURES ──
    // 1. Zero Mile Monument Monolith (Central Axis of India)
    // 2. Deekshabhoomi Dome Radial Ribs & Concentric Rings
    // 3. Floating Civic Data Beacons (Road, Water, Metro, Environment)

    // A. Deekshabhoomi Stupa Wireframe Nodes (Concentric latitude/longitude arcs)
    const stupaRings: Array<{ radius: number; y: number; segments: number }> = [];
    for (let i = 0; i <= 10; i++) {
      const phi = (i / 10) * (Math.PI / 2); // 0 to 90 degrees
      const radius = 140 * Math.cos(phi);
      const y = -140 * Math.sin(phi); // Dome shape
      stupaRings.push({ radius, y, segments: 16 });
    }

    // B. Zero-Mile Obelisk / Monolith 3D Vertices
    const monolithVertices = [
      // Base
      { x: -18, y: 40, z: -18 },
      { x: 18, y: 40, z: -18 },
      { x: 18, y: 40, z: 18 },
      { x: -18, y: 40, z: 18 },
      // Mid-Tier
      { x: -12, y: -40, z: -12 },
      { x: 12, y: -40, z: -12 },
      { x: 12, y: -40, z: 12 },
      { x: -12, y: -40, z: 12 },
      // Tip (Apex Point)
      { x: 0, y: -75, z: 0 },
    ];

    // C. 3D Floating Nagpur Civic Data Particles
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      type: string;
      color: string;
      size: number;
      pulseSpeed: number;
      pulseOffset: number;
    }> = [];

    const PARTICLE_TYPES = [
      { type: 'ZeroMile', color: '#f97316', size: 5 },
      { type: 'Metro', color: '#8b5cf6', size: 4 },
      { type: 'Civic', color: '#3b82f6', size: 4 },
      { type: 'Water', color: '#06b6d4', size: 3.5 },
      { type: 'Green', color: '#10b981', size: 3.5 },
    ];

    for (let i = 0; i < 40; i++) {
      const ptype = PARTICLE_TYPES[i % PARTICLE_TYPES.length];
      const rad = 80 + Math.random() * 320;
      const theta = Math.random() * Math.PI * 2;
      const py = -100 + Math.random() * 200;
      particles.push({
        x: Math.cos(theta) * rad,
        y: py,
        z: Math.sin(theta) * rad,
        type: ptype.type,
        color: ptype.color,
        size: ptype.size,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let angleOrbit = 0;
    let pulseRadius = 0;

    // ── 3D PROJECTION UTILITY ──
    const project = (x: number, y: number, z: number, fov = 500, cx = width * 0.5, cy = height * 0.48) => {
      const cos = Math.cos(angleOrbit);
      const sin = Math.sin(angleOrbit);
      // Rotate around Y axis
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const scale = fov / (fov + rz + 280);
      return {
        sx: cx + rx * scale,
        sy: cy + y * scale,
        scale,
        rz,
      };
    };

    // ── RENDER LOOP ──
    const render = () => {
      // Smooth interpolation for mouse & scroll
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      angleOrbit += 0.0018; // Slow majestic rotation
      pulseRadius = (pulseRadius + 0.9) % 360;

      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';
      // Center shifts subtly with scroll & mouse
      const scrollOffset = (scrollRef.current * 0.06) % height;
      const centerX = width * 0.5 + mouseRef.current.x;
      const centerY = height * 0.45 + mouseRef.current.y - scrollOffset * 0.3;

      // ── 1. AMBIENT NAGPUR WARMTH RADIAL GRADIENT ──
      const grad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, width * 0.7);
      if (isDark) {
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.07)');
        grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
        grad.addColorStop(1, 'rgba(5, 8, 20, 0)');
      } else {
        grad.addColorStop(0, 'rgba(234, 88, 12, 0.08)');
        grad.addColorStop(0.5, 'rgba(251, 146, 60, 0.04)');
        grad.addColorStop(1, 'rgba(247, 244, 238, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. ZERO MILE RADIAL RINGS (Central India Geodetic Datum) ──
      for (let r = 70; r <= 420; r += 70) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 60, r, r * 0.36, 0, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(249, 115, 22, 0.08)' : 'rgba(234, 88, 12, 0.09)';
        ctx.lineWidth = r === 210 ? 1.5 : 0.8;
        if (r === 210) ctx.setLineDash([8, 6]);
        else ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── 3. EXPANDING CIVIC ENERGY PULSE ──
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 60, pulseRadius, pulseRadius * 0.36, 0, 0, Math.PI * 2);
      const pulseOpacity = Math.max(0, 1 - pulseRadius / 360) * (isDark ? 0.35 : 0.28);
      ctx.strokeStyle = isDark ? `rgba(249, 115, 22, ${pulseOpacity})` : `rgba(234, 88, 12, ${pulseOpacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── 4. RENDER 3D DEEKSHABHOOMI WIREFRAME DOME (Right Background) ──
      const domeCX = centerX + (width > 900 ? 280 : 0);
      const domeCY = centerY - 20;

      // Latitude Rings
      stupaRings.forEach(ring => {
        ctx.beginPath();
        for (let j = 0; j <= ring.segments; j++) {
          const theta = (j / ring.segments) * Math.PI * 2;
          const x = Math.cos(theta) * ring.radius;
          const z = Math.sin(theta) * ring.radius;
          const p = project(x, ring.y, z, 500, domeCX, domeCY);
          if (j === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(234, 88, 12, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Longitude Ribs
      for (let j = 0; j < 8; j++) {
        const theta = (j / 8) * Math.PI * 2;
        ctx.beginPath();
        stupaRings.forEach((ring, idx) => {
          const x = Math.cos(theta) * ring.radius;
          const z = Math.sin(theta) * ring.radius;
          const p = project(x, ring.y, z, 500, domeCX, domeCY);
          if (idx === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.strokeStyle = isDark ? 'rgba(249, 115, 22, 0.14)' : 'rgba(234, 88, 12, 0.14)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // ── 5. RENDER 3D ZERO-MILE MONOLITH (Left-Center Background) ──
      const monolithCX = centerX - (width > 900 ? 260 : 0);
      const monolithCY = centerY + 10;
      const projMono = monolithVertices.map(v => project(v.x, v.y, v.z, 500, monolithCX, monolithCY));

      // Draw Monolith Edges
      const monoEdges = [
        // Base square
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Mid square
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Vertical pillars
        [0, 4], [1, 5], [2, 6], [3, 7],
        // Apex Pyramid
        [4, 8], [5, 8], [6, 8], [7, 8],
      ];

      ctx.beginPath();
      monoEdges.forEach(([i1, i2]) => {
        const p1 = projMono[i1];
        const p2 = projMono[i2];
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
      });
      ctx.strokeStyle = isDark ? 'rgba(249, 115, 22, 0.22)' : 'rgba(234, 88, 12, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Glowing Apex Point on Monolith
      const apex = projMono[8];
      ctx.beginPath();
      ctx.arc(apex.sx, apex.sy, 4 * apex.scale, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = isDark ? 14 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── 6. RENDER 3D FLOATING CIVIC DATA PARTICLES & NETWORK ──
      const projParticles = particles.map(pt => {
        const p = project(pt.x, pt.y, pt.z, 500, centerX, centerY);
        return { ...pt, ...p };
      });

      // Neural Connections between nearby particles
      for (let i = 0; i < projParticles.length; i++) {
        for (let j = i + 1; j < projParticles.length; j++) {
          const p1 = projParticles[i];
          const p2 = projParticles[j];
          const dist = Math.hypot(p1.sx - p2.sx, p1.sy - p2.sy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            const lineAlpha = (1 - dist / 120) * (isDark ? 0.18 : 0.15);
            ctx.strokeStyle = isDark ? `rgba(249, 115, 22, ${lineAlpha})` : `rgba(234, 88, 12, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particle spheres
      projParticles.forEach(pt => {
        const rad = pt.size * pt.scale;
        if (rad <= 0) return;

        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = isDark ? 10 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [theme, pathname]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: pathname === '/map' ? 0.25 : 0.85,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
}
