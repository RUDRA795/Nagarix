'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, Zap, Map, BarChart3, Brain,
  ArrowRight, Sparkles, Shield, Compass, Camera, Layers, Bot,
  Award, ChevronRight, Activity, Navigation, HeartPulse
} from 'lucide-react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { CityStatsBar } from '@/components/civic/CityStatsBar';
import { CinematicHero } from '@/components/cinematic/CinematicHero';

const CAPABILITIES = [
  {
    num: '01',
    icon: '🤖',
    title: 'Multilingual AI Assistant',
    subtitle: 'Ask NagariX anything about Nagpur',
    desc: 'Converses natively in English, Hindi, Marathi, or Hinglish with live database tool grounding & instant map pills.',
    href: '#ai-assistant',
    tag: 'NLP + Gemini 3.6',
  },
  {
    num: '02',
    icon: '📸',
    title: 'Multimodal Vision Reporting',
    subtitle: 'Photo to ticket in seconds',
    desc: 'Gemini AI Vision inspects citizen photos, auto-detects severity, and routes directly to NMC departments.',
    href: '/report',
    tag: 'Computer Vision',
  },
  {
    num: '03',
    icon: '🗺️',
    title: 'Live Geospatial GIS Map',
    subtitle: '8 Working GIS Modes with Instant Spot Focus',
    desc: 'Interactive dual-engine GIS with Satellite, Hybrid, Density Heatmap, Turf.js Clusters, and Civic Radar.',
    href: '/map',
    tag: 'GIS Intelligence',
  },
  {
    num: '04',
    icon: '📊',
    title: 'Municipal Command Center',
    subtitle: 'Executive intelligence for NMC',
    desc: 'Live Civic Health Index (0-100), 23-ward performance leaderboard, and real-time SLA risk monitoring.',
    href: '/dashboard',
    tag: 'Executive Dashboard',
  },
  {
    num: '05',
    icon: '🔮',
    title: 'AI City Copilot & Reports',
    subtitle: 'Natural language decision support',
    desc: 'One-click AI executive city briefings, recurring problem detectors, and multi-agency conflict resolution.',
    href: '/dashboard/copilot',
    tag: 'Decision Support',
  },
];

const QUICK_ACTIONS = [
  { href: '/report', icon: Camera, label: 'Report Issue', desc: 'Photo upload with Gemini triage', color: 'var(--accent-orange)' },
  { href: '/track', icon: CheckCircle, label: 'Track Complaint', desc: 'Live timeline & SLA countdown', color: 'var(--color-success)' },
  { href: '/map', icon: Compass, label: 'City Map GIS', desc: 'Satellite, Heatmap & Radar Near Me', color: 'var(--accent-blue)' },
  { href: '/dashboard', icon: BarChart3, label: 'Command Center', desc: 'Civic Health & Ward Leaderboard', color: 'var(--accent-purple)' },
];

const FEATURED_HOTSPOTS = [
  { zone: 'Dharampeth', category: 'Road/Pothole', count: 12, health: 84, href: '/map?zone=Dharampeth' },
  { zone: 'Gandhibagh', category: 'Drainage', count: 9, health: 68, href: '/map?zone=Gandhibagh' },
  { zone: 'Laxmi Nagar', category: 'Water Supply', count: 11, health: 76, href: '/map?zone=Laxmi Nagar' },
  { zone: 'Sitabuldi', category: 'Traffic Signal', count: 7, health: 82, href: '/map?ward=23' },
];

export default function HomePage() {
  const [showCoreApp, setShowCoreApp] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <>
      {/* ── 1. FLAGSHIP CINEMATIC OPENING HERO ────────────── */}
      <CinematicHero onEnterApp={() => setShowCoreApp(true)} />

      {/* ── 2. CORE APPLICATION LAYER ─────────────────────── */}
      <div id="nagarix-core-app">
        
        {/* ── LIVE INTERACTIVE AI ASSISTANT SECTION ───────── */}
        <section className="section" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', background: 'var(--bg-primary)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-10)', alignItems: 'center' }}>
              
              {/* Left Column: Context & Stats */}
              <div>
                <div className="glass-pill" style={{ marginBottom: 'var(--space-4)', color: 'var(--accent-orange)' }}>
                  <Sparkles size={13} />
                  <span>Real-Time Civic AI Intelligence</span>
                </div>

                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                  Nagpur&apos;s AI Urban Intelligence & <span style={{ color: 'var(--accent-orange)' }}>Municipal Action</span>
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
                  Ask questions in any language, report issues with photos, track SLA deadlines, and inspect real-time civic clusters across Nagpur.
                </p>

                {/* Live Municipal Statistics Bar */}
                <CityStatsBar />

                <div className="flex gap-4 flex-wrap mt-6">
                  <Link href="/report" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 8px 24px var(--accent-orange-glow)' }}>
                    <Camera size={18} /> Report an Issue
                  </Link>
                  <Link href="/map" className="btn btn-secondary btn-lg" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
                    <Compass size={18} /> Explore City GIS Map
                  </Link>
                </div>
              </div>

              {/* Right Column: Embedded Gemini AI Assistant */}
              <div id="ai-assistant">
                <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    padding: 'var(--space-3) var(--space-5)',
                    background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  }}>
                    <Brain size={16} style={{ color: 'var(--accent-orange)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>NagariX AI Civic Assistant</span>
                    <div className="glass-pill" style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '10px', color: 'var(--color-success)' }}>
                      ● Gemini Grounded
                    </div>
                  </div>
                  <ChatInterface compact placeholder="Ask about Nagpur civic issues (EN / हिं / मरा)..." />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. QUICK ACTIONS GRID ────────────────────────── */}
        <section className="section" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-10)', background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: 'var(--radius-xl)',
                      background: `${color}18`, border: `1px solid ${color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto var(--space-3)',
                    }}>
                      <Icon size={24} style={{ color }} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. SMART CARDS SLIDER & HOTSPOT SHOWCASE ─────── */}
        <section className="section" style={{ background: 'var(--bg-primary)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="glass-pill" style={{ color: 'var(--accent-blue)', marginBottom: 6 }}>
                  <Activity size={12} />
                  <span>Interactive Urban Hotspots</span>
                </div>
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Live Zone Intelligence & GIS Spotlight
                </h2>
              </div>
              <Link href="/map" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-orange)', fontWeight: 800 }}>
                View All on GIS Map →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
              {FEATURED_HOTSPOTS.map((hotspot) => (
                <Link key={hotspot.zone} href={hotspot.href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 'var(--space-5)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{hotspot.zone} Zone</span>
                      <span className="glass-pill" style={{ color: 'var(--color-success)' }}>
                        {hotspot.health}/100 Health
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Dominant Category: <strong style={{ color: 'var(--accent-orange)' }}>{hotspot.category}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>{hotspot.count} Active Records</span>
                      <span style={{ color: 'var(--accent-orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                        Inspect Spot <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. PLATFORM CAPABILITIES SHOWCASE ────────────── */}
        <section id="platform-architecture" className="section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center', alignItems: 'center', marginBottom: 'var(--space-10)' }}>
              <div className="glass-pill" style={{ color: 'var(--accent-orange)', marginBottom: 8 }}>
                ONE CITY · ONE INTELLIGENCE LAYER
              </div>
              <h2 className="section-title">
                Connected Urban Capabilities for <span style={{ color: 'var(--accent-orange)' }}>Nagpur</span>
              </h2>
              <p className="section-description" style={{ margin: '0 auto', maxWidth: 640 }}>
                From citizen vision triage and smart complaint creation to geospatial hotspot heatmaps and municipal executive copilot.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              {CAPABILITIES.map((c) => (
                <Link key={c.title} href={c.href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 'var(--space-6)', height: '100%', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontSize: 32 }}>{c.icon}</span>
                      <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-orange)', fontSize: '10px' }}>{c.tag}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 4, color: 'var(--text-primary)' }}>{c.title}</h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-orange)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{c.subtitle}</div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
