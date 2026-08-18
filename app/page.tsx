'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Zap, Map, BarChart3, Brain, ArrowRight, Sparkles, Shield, Compass, Camera, Layers, Bot } from 'lucide-react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { CityStatsBar } from '@/components/civic/CityStatsBar';
import { CinematicHero } from '@/components/cinematic/CinematicHero';

const CAPABILITIES = [
  {
    num: '01',
    icon: '🤖',
    title: 'Multilingual AI Assistant',
    subtitle: 'Ask NagariX anything about Nagpur',
    desc: 'Converses natively in English, Hindi, Marathi, or Hinglish with live database tool grounding.',
    href: '#ai-assistant',
  },
  {
    num: '02',
    icon: '📸',
    title: 'Multimodal Vision Reporting',
    subtitle: 'Photo to ticket in seconds',
    desc: 'Gemini AI Vision inspects citizen photos, verifies civic severity, and assigns direct NMC departments.',
    href: '/report',
  },
  {
    num: '03',
    icon: '🗺️',
    title: 'Live Geospatial City GIS',
    subtitle: 'See civic patterns where they happen',
    desc: 'Interactive Google Maps with real-time severity pins, density heatmaps, and ward intelligence.',
    href: '/map',
  },
  {
    num: '04',
    icon: '📊',
    title: 'Municipal Command Center',
    subtitle: 'Executive intelligence for NMC',
    desc: 'Live KPI monitoring, 10-zone ingestion ranking, 14-day velocity analysis, and SLA breach tracking.',
    href: '/dashboard',
  },
  {
    num: '05',
    icon: '🔮',
    title: 'AI City Copilot',
    subtitle: 'Natural language predictive analytics',
    desc: 'Decision-support intelligence to prioritize high-risk road voids and waterlogging hotspots.',
    href: '/dashboard/copilot',
  },
];

const QUICK_ACTIONS = [
  { href: '/report', icon: AlertTriangle, label: 'Report Issue', desc: 'Submit with Gemini photo inspection', color: 'var(--color-danger)' },
  { href: '/track', icon: CheckCircle, label: 'Track Complaint', desc: 'Real-time timeline by Ticket ID', color: 'var(--color-success)' },
  { href: '/map', icon: Map, label: 'City Map GIS', desc: 'Interactive heatmap & ward analytics', color: 'var(--accent-blue)' },
  { href: '/dashboard', icon: BarChart3, label: 'Command Center', desc: 'Smart city municipal overview', color: 'var(--accent-purple)' },
];

export default function HomePage() {
  const [showCoreApp, setShowCoreApp] = useState(false);

  return (
    <>
      {/* ── 1. FLAGSHIP CINEMATIC OPENING HERO ────────────── */}
      <CinematicHero onEnterApp={() => setShowCoreApp(true)} />

      {/* ── 2. CORE APPLICATION LAYER ─────────────────────── */}
      <div id="nagarix-core-app">
        
        {/* ── LIVE INTERACTIVE AI ASSISTANT SECTION ───────── */}
        <section className="section" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', background: 'var(--bg-primary)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 'var(--space-10)', alignItems: 'center' }}>
              
              {/* Left Column: Context & Stats */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 'var(--radius-full)', color: 'var(--accent-orange)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-4)' }}>
                  <Sparkles size={12} /> Real-Time Civic Intelligence
                </div>

                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 'var(--space-4)' }}>
                  Grounded AI for <span style={{ color: 'var(--accent-orange)' }}>Nagpur Citizens</span> & Municipal Action
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
                  Ask questions in any language, report issues with photos, and follow tickets through automated NMC department dispatch.
                </p>

                {/* Live Municipal Statistics Bar */}
                <CityStatsBar />

                <div className="flex gap-4 flex-wrap mt-6">
                  <Link href="/report" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
                    <Camera size={18} /> Report an Issue
                  </Link>
                  <Link href="/map" className="btn btn-secondary btn-lg">
                    <Map size={18} /> Open City Map
                  </Link>
                </div>
              </div>

              {/* Right Column: Embedded Gemini AI Assistant */}
              <div id="ai-assistant">
                <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
                  <div style={{
                    padding: 'var(--space-3) var(--space-5)',
                    background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  }}>
                    <Brain size={16} style={{ color: 'var(--accent-purple)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>NagariX AI Civic Assistant</span>
                    <div className="demo-banner" style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '10px' }}>
                      Gemini Grounded
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%', transition: 'all 0.2s' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                      background: `${color}18`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto var(--space-3)',
                    }}>
                      <Icon size={22} style={{ color }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>{label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. PLATFORM ARCHITECTURE & CAPABILITIES ──────── */}
        <section id="platform-architecture" className="section" style={{ background: 'var(--bg-primary)' }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center', alignItems: 'center', marginBottom: 'var(--space-10)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-orange)', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                ONE CITY · ONE INTELLIGENCE LAYER
              </div>
              <h2 className="section-title">
                Connected Urban Capabilities for <span style={{ color: 'var(--accent-orange)' }}>Nagpur</span>
              </h2>
              <p className="section-description" style={{ margin: '0 auto', maxWidth: 640 }}>
                From citizen vision and smart complaint creation to geospatial hotspot heatmaps and municipal executive copilot.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              {CAPABILITIES.map((c) => (
                <Link key={c.title} href={c.href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 'var(--space-6)', height: '100%', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontSize: 28 }}>{c.icon}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--text-muted)' }}>{c.num}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 2 }}>{c.title}</h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{c.subtitle}</div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. TRANSPARENT COMPLAINT PIPELINE ─────────────── */}
        <section className="section" style={{ background: 'var(--bg-secondary)', paddingLeft: 0, paddingRight: 0 }}>
          <div className="container" style={{ padding: 'var(--space-12) var(--space-6)' }}>
            <div className="section-header" style={{ textAlign: 'center', alignItems: 'center' }}>
              <div style={{ color: 'var(--accent-blue)', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                SEE · UNDERSTAND · REPORT · ACT · RESOLVE
              </div>
              <h2 className="section-title">End-to-End Issue Lifecycle</h2>
              <p className="section-description" style={{ margin: '0 auto' }}>
                Every complaint follows an auditable lifecycle with automated classification and SLA breach tracking.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
              {[
                { label: 'Reported', color: 'var(--color-reported)', icon: '📝' },
                { label: 'AI Verified', color: 'var(--color-ai-verified)', icon: '🤖' },
                { label: 'Assigned', color: 'var(--color-assigned)', icon: '📋' },
                { label: 'In Progress', color: 'var(--color-in-progress)', icon: '🔧' },
                { label: 'Resolved', color: 'var(--color-resolved)', icon: '✅' },
                { label: 'Citizen Verified', color: 'var(--color-citizen-verified)', icon: '🌟' },
              ].map((stage, i, arr) => (
                <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: `${stage.color}15`,
                    border: `1px solid ${stage.color}40`,
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    minWidth: 115,
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{stage.icon}</div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: stage.color }}>{stage.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
