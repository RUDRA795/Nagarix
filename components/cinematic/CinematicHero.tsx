'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight, Compass, Shield, Zap, MapPin } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { Nagpur3DCityCanvas } from '@/components/cinematic/Nagpur3DCityCanvas';

interface CinematicHeroProps {
  onEnterApp: () => void;
}

export function CinematicHero({ onEnterApp }: CinematicHeroProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<number>(0); // 0 to 6 animation steps
  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user already skipped in this session
    try {
      if (sessionStorage.getItem('nagarix_intro_skipped') === 'true') {
        setIsSkipped(true);
        setStep(6);
        return;
      }
    } catch {}

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsSkipped(true);
      setStep(6);
      return;
    }

    // Step Timers
    const t1 = setTimeout(() => setStep(1), 600);   // Map outline appears
    const t2 = setTimeout(() => setStep(2), 1600);  // Orange orb & energy line travels
    const t3 = setTimeout(() => setStep(3), 3200);  // Network nodes illuminate
    const t4 = setTimeout(() => setStep(4), 4200);  // Map slides left, "HELLO, NAGPUR." appears
    const t5 = setTimeout(() => setStep(5), 5600);  // "WELCOME TO NAGARIX" & Subtitle appear
    const t6 = setTimeout(() => setStep(6), 6600);  // CTAs appear, complete state

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  const handleSkip = () => {
    setIsSkipped(true);
    setStep(6);
    try {
      sessionStorage.setItem('nagarix_intro_skipped', 'true');
    } catch {}
  };

  const handleEnterClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onEnterApp();
      const appSection = document.getElementById('nagarix-core-app');
      if (appSection) {
        appSection.scrollIntoView({ behavior: 'smooth' });
      }
      setIsTransitioning(false);
    }, 650);
  };

  return (
    <div
      ref={heroRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-6)',
        boxSizing: 'border-box',
      }}
    >
      {/* ── AMBIENT ATMOSPHERIC BACKGROUND ──────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Warm Nagpur Orange Atmospheric Glow */}
        <div
          style={{
            position: 'absolute',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-orange-glow) 0%, rgba(249,115,22,0.02) 60%, transparent 80%)',
            top: '-200px',
            left: step >= 4 ? '10%' : '50%',
            transform: 'translateX(-50%)',
            transition: 'left 1.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease',
            opacity: step >= 1 ? 1 : 0,
            filter: 'blur(60px)',
          }}
        />

        {/* Deekshabhoomi & Geometric Concentric Rings */}
        <div
          style={{
            position: 'absolute',
            width: '900px',
            height: '900px',
            borderRadius: '50%',
            border: '1px dashed var(--border-subtle)',
            top: '50%',
            left: step >= 4 ? '30%' : '50%',
            transform: 'translate(-50%, -50%)',
            opacity: step >= 2 ? 0.35 : 0,
            transition: 'all 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            border: '1px solid var(--border-subtle)',
            top: '50%',
            left: step >= 4 ? '30%' : '50%',
            transform: 'translate(-50%, -50%)',
            opacity: step >= 2 ? 0.25 : 0,
            transition: 'all 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
        />

        {/* 3D Stylized Nagpur Digital City Visualization Canvas */}
        <Nagpur3DCityCanvas interactive={true} />

        {/* Subtle City Grid Texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(var(--border-subtle) 1px, transparent 1px),
              linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            opacity: step >= 1 ? 0.45 : 0,
            transition: 'opacity 1.5s ease',
          }}
        />
      </div>

      {/* ── SKIP INTRO BUTTON (TOP RIGHT) ────────────────── */}
      {!isSkipped && step < 6 && (
        <button
          type="button"
          onClick={handleSkip}
          className="btn btn-ghost btn-sm"
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 40,
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Skip Intro →
        </button>
      )}

      {/* ── MAIN CINEMATIC COMPOSITION CONTAINER ────────── */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: step >= 4 ? '44% 56%' : '1fr',
          alignItems: 'center',
          gap: 'var(--space-8)',
          minHeight: '75vh',
          transition: 'grid-template-columns 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── LEFT: ABSTRACT ANIMATED NAGPUR GEOMETRY & ORANGE ORB ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 4 ? 'translateX(0)' : step >= 1 ? 'scale(1.05)' : 'scale(0.95)',
            transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
            minHeight: step >= 4 ? '400px' : '480px',
          }}
        >
          {/* Animated SVG Map of Nagpur Arterial Grid & Zones */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '460px', aspectRatio: '1/1' }}>
            <svg
              viewBox="0 0 500 500"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="orangeGlowLine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ea580c" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Nagpur Outer Perimeter Ring */}
              <circle
                cx="250"
                cy="250"
                r="190"
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="1.5"
                strokeDasharray="6 8"
                opacity={step >= 1 ? 0.6 : 0}
                style={{ transition: 'opacity 1.2s ease' }}
              />

              {/* Inner Zero-Mile / Sitabuldi Radial Center */}
              <circle
                cx="250"
                cy="250"
                r="70"
                fill="none"
                stroke="var(--accent-orange)"
                strokeWidth="1.5"
                opacity={step >= 2 ? 0.4 : 0}
                style={{ transition: 'opacity 1.2s ease' }}
              />

              {/* Major Arterial Corridors (Wardha Rd, Amravati Rd, Kamptee Rd, Bhandara Rd) */}
              <g stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" opacity={step >= 1 ? 0.7 : 0} style={{ transition: 'opacity 1s ease' }}>
                <line x1="250" y1="60" x2="250" y2="440" />
                <line x1="60" y1="250" x2="440" y2="250" />
                <line x1="115" y1="115" x2="385" y2="385" />
                <line x1="385" y1="115" x2="115" y2="385" />
              </g>

              {/* Animated Glowing Orange Trajectory Line */}
              {step >= 2 && (
                <path
                  d="M 120 370 Q 200 240 250 250 T 380 130"
                  fill="none"
                  stroke="url(#orangeGlowLine)"
                  strokeWidth="3.5"
                  filter="url(#glowFilter)"
                  strokeDasharray="400"
                  strokeDashoffset={step >= 3 ? '0' : '400'}
                  style={{
                    transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              )}

              {/* 10 NMC Zone Neural Nodes */}
              {[
                { name: 'Dharampeth', cx: 200, cy: 230 },
                { name: 'Sitabuldi (Zero Mile)', cx: 250, cy: 250, isCenter: true },
                { name: 'Laxmi Nagar', cx: 270, cy: 300 },
                { name: 'Gandhibagh', cx: 290, cy: 210 },
                { name: 'Dhantoli', cx: 230, cy: 290 },
                { name: 'Hanuman Nagar', cx: 280, cy: 360 },
                { name: 'Nehru Nagar', cx: 330, cy: 260 },
                { name: 'Satranjipura', cx: 310, cy: 160 },
                { name: 'Mangalwari', cx: 210, cy: 170 },
                { name: 'Lakadganj', cx: 360, cy: 210 },
                { name: 'Ashi Nagar', cx: 310, cy: 110 },
              ].map((node, i) => (
                <g key={node.name} opacity={step >= 3 ? 1 : 0} style={{ transition: `opacity 0.6s ease ${i * 80}ms` }}>
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.isCenter ? 8 : 5}
                    fill={node.isCenter ? '#f97316' : 'var(--accent-blue)'}
                    filter={node.isCenter ? 'url(#glowFilter)' : undefined}
                  />
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.isCenter ? 16 : 10}
                    fill="none"
                    stroke={node.isCenter ? '#f97316' : 'var(--accent-blue)'}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </g>
              ))}

              {/* The Signature Glowing Orange Orb / Energy Core */}
              <circle
                cx={step >= 4 ? 250 : step >= 2 ? 380 : 120}
                cy={step >= 4 ? 250 : step >= 2 ? 130 : 370}
                r={step >= 4 ? 14 : 10}
                fill="#f97316"
                filter="url(#glowFilter)"
                style={{
                  transition: 'cx 2s cubic-bezier(0.2, 0.8, 0.2, 1), cy 2s cubic-bezier(0.2, 0.8, 0.2, 1), r 0.8s ease',
                  opacity: step >= 2 ? 1 : 0,
                }}
              />
            </svg>

            {/* City Coordinate Tag Overlay */}
            {step >= 3 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(10, 22, 40, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.8s ease',
                }}
              >
                <MapPin size={11} style={{ color: 'var(--accent-orange)' }} />
                <span>NAGPUR · 21.1458° N, 79.0882° E</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: CINEMATIC TYPOGRAPHY & BRAND REVEAL ───── */}
        <div
          style={{
            display: step >= 4 ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            animation: 'fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* 1. HELLO, NAGPUR. */}
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <div
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              HELLO,
            </div>
            <div
              style={{
                fontSize: 'clamp(3.2rem, 7.5vw, 5.8rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 0.95,
                color: 'var(--text-primary)',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              NAGPUR.
              {/* Orange Accent Underline */}
              <div
                style={{
                  height: '4px',
                  width: '100%',
                  background: 'linear-gradient(90deg, #f97316 0%, #ea580c 60%, transparent 100%)',
                  borderRadius: '2px',
                  marginTop: '4px',
                  boxShadow: '0 0 12px rgba(249,115,22,0.6)',
                }}
              />
            </div>
          </div>

          {/* 2. WELCOME TO NAGARIX */}
          <div
            style={{
              marginTop: 'var(--space-6)',
              opacity: step >= 5 ? 1 : 0,
              transform: step >= 5 ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent-orange)', marginBottom: 4 }}>
              WELCOME TO
            </div>
            <h2
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: 'var(--space-4)',
              }}
            >
              NAGARI<span style={{ color: 'var(--accent-orange)', textShadow: '0 0 24px rgba(249,115,22,0.5)' }}>X</span>
            </h2>

            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              AI Urban Intelligence Platform for Nagpur
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, maxWidth: 500, marginBottom: 'var(--space-8)' }}>
              Understand the city. Report problems with Gemini AI. Turn citizen observations into real-time municipal action.
            </p>

            {/* 3. PRIMARY & SECONDARY CTA BUTTONS */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-4)',
                alignItems: 'center',
                flexWrap: 'wrap',
                opacity: step >= 6 ? 1 : 0,
                transform: step >= 6 ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <button
                type="button"
                onClick={handleEnterClick}
                className="btn btn-primary btn-lg"
                style={{
                  padding: '16px 36px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  boxShadow: '0 8px 30px rgba(249, 115, 22, 0.35)',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  borderRadius: 'var(--radius-xl)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                ENTER NAGARIX <ArrowRight size={18} />
              </button>

              <a
                href="#platform-architecture"
                className="btn btn-secondary btn-lg"
                style={{
                  padding: '16px 28px',
                  fontSize: 'var(--text-base)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <Compass size={18} /> Explore Capabilities
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPANDING ORANGE PULSE TRANSITION LAYER ───────── */}
      {isTransitioning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at center, #f97316 0%, #050814 80%)',
            zIndex: 999,
            animation: 'pulseExpand 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Keyframe Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseExpand {
          0%   { opacity: 0; transform: scale(0.8); }
          50%  { opacity: 0.85; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @media (max-width: 900px) {
          .container {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .container > div {
            justify-content: center;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
