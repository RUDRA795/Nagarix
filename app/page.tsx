import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Zap, Map, BarChart3, Brain, ArrowRight, Sparkles } from 'lucide-react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { CityStatsBar } from '@/components/civic/CityStatsBar';

export const metadata: Metadata = {
  title: 'NagariX — AI Urban Intelligence Platform for Nagpur',
  description: 'Turn citizen observations into actionable urban intelligence for Nagpur. Multilingual AI Assistant, real-time geospatial intelligence, and municipal command center.',
};

const FEATURES = [
  {
    icon: '🤖',
    title: 'Multilingual AI Assistant',
    desc: 'Converse in English, Hindi, Marathi, or Hinglish. Automatically analyzes civic intent and responds with real data.',
  },
  {
    icon: '🗺️',
    title: 'Geospatial City Map',
    desc: 'Explore all civic issues on an interactive map layer with heatmaps, ward filters, and severity clustering.',
  },
  {
    icon: '📸',
    title: 'Multimodal Issue Detection',
    desc: 'Detect civic anomalies from citizen photos and geolocations, categorizing reports straight to responsible NMC depts.',
  },
  {
    icon: '📊',
    title: 'Municipal Command Center',
    desc: 'Real-time smart-city analytics dashboard for NMC officials — KPIs, ward performance, SLA tracking.',
  },
  {
    icon: '🧠',
    title: 'AI City Copilot',
    desc: 'Ask natural-language questions: "Which ward has the most unresolved drainage complaints?"',
  },
  {
    icon: '🔮',
    title: 'Predictive Intelligence',
    desc: 'Algorithmic urgency rankings, SLA breach monitoring, and priority recommendations for city maintenance.',
  },
];

const QUICK_ACTIONS = [
  { href: '/report', icon: AlertTriangle, label: 'Report Issue', desc: 'Submit a new civic complaint', color: 'var(--color-danger)' },
  { href: '/track', icon: CheckCircle, label: 'Track Complaint', desc: 'Check status by ticket ID', color: 'var(--color-success)' },
  { href: '/map', icon: Map, label: 'City Map', desc: 'View issues geospatially', color: 'var(--accent-blue)' },
  { href: '/dashboard', icon: BarChart3, label: 'Command Center', desc: 'Smart city overview', color: 'var(--accent-purple)' },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
        </div>

        <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-12)', alignItems: 'center' }}>
            {/* Left: Content */}
            <div className="hero-content">
              <div className="hero-eyebrow">
                <Zap size={12} />
                Nagpur Municipal AI Platform
              </div>

              <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', marginBottom: 'var(--space-4)' }}>
                NAGARIX — AI Urban Intelligence for{' '}
                <span className="text-gradient">Nagpur</span>
              </h1>

              <p className="hero-description" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-8)' }}>
                Turn citizen observations into actionable urban intelligence.
                Report civic issues, track resolutions, and explore live city-wide data with Gemini AI.
              </p>

              <div className="flex gap-4 flex-wrap" style={{ marginBottom: 'var(--space-8)' }}>
                <a href="#ai-assistant" className="btn btn-primary btn-lg">
                  <Sparkles size={18} />
                  Ask NagariX
                </a>
                <Link href="/report" className="btn btn-secondary btn-lg">
                  <AlertTriangle size={18} />
                  Report an Issue
                </Link>
              </div>

              {/* Stats Bar */}
              <CityStatsBar />
            </div>

            {/* Right: AI Chat Card */}
            <div id="ai-assistant">
              <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-5)',
                  background: 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                }}>
                  <Brain size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>NagariX AI Assistant</span>
                  <div className="demo-banner" style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '10px' }}>
                    Live Prototype
                  </div>
                </div>
                <ChatInterface compact placeholder="Ask about Nagpur civic issues (EN / हिं / मरा)..." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-10)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
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

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Platform Architecture</div>
            <h2 className="section-title">
              Connected Intelligence for{' '}
              <span className="text-gradient">Nagpur City</span>
            </h2>
            <p className="section-description">
              From instant citizen voice and photo reporting to real-time municipal dashboard dispatch.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLAINT LIFECYCLE ───────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-secondary)', paddingLeft: 0, paddingRight: 0 }}>
        <div className="container" style={{ padding: 'var(--space-12) var(--space-6)' }}>
          <div className="section-header" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="section-eyebrow">End-to-End Transparency</div>
            <h2 className="section-title">Transparent Issue Resolution Pipeline</h2>
            <p className="section-description" style={{ margin: '0 auto' }}>
              Every civic complaint follows an auditable lifecycle powered by automated AI verification and SLA tracking.
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
    </>
  );
}
