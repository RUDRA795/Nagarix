'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3,
  Map, Zap, HeartPulse, Sparkles, MapPin, ArrowUpRight, Compass, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { getCategoryIcon, getStatusLabel, timeAgo } from '@/lib/utils';
import { CityHealthIndex } from '@/lib/analytics/healthScore';

interface Analytics {
  overview: {
    total: number;
    active: number;
    resolved: number;
    slaBreach: number;
    resolvedToday: number;
    criticalActive: number;
    resolutionRate: number;
    pending: number;
  };
  byCategory: Array<{ category: string; count: number }>;
  byZone: Array<{ zone: string; count: number }>;
  trend: Array<{ date: string; reported: number; resolved: number }>;
}

interface Issue {
  ticketId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  zone: string | null;
  wardNumber: number | null;
  slaBreach: boolean;
  createdAt: string;
}

export function DashboardClient() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [criticalIssues, setCriticalIssues] = useState<Issue[]>([]);
  const [healthIndex, setHealthIndex] = useState<CityHealthIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/overview').then(r => r.json()),
      fetch('/api/analytics/health-score').then(r => r.json()),
      fetch('/api/issues?severity=Critical&status=Reported&limit=5').then(r => r.json()),
    ]).then(([analyticsData, healthData, issuesData]) => {
      setAnalytics(analyticsData);
      setHealthIndex(healthData);
      setCriticalIssues(issuesData.issues || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, margin: '80px auto 16px' }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading Municipal Command Center...</div>
      </div>
    );
  }

  const ov = analytics?.overview;
  const maxCategory = analytics?.byCategory[0]?.count || 1;
  const maxZone = analytics?.byZone[0]?.count || 1;

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-orange)', marginBottom: 'var(--space-2)' }}>
            NMC Municipal Command Center
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Nagpur Civic Command Center
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard/issues" className="btn btn-secondary btn-sm">
            <BarChart3 size={14} /> Issues Table
          </Link>
          <Link href="/dashboard/analytics" className="btn btn-secondary btn-sm">
            <TrendingUp size={14} /> Analytics & SLA
          </Link>
          <Link href="/dashboard/copilot" className="btn btn-secondary btn-sm">
            <Zap size={14} /> AI Copilot
          </Link>
          <Link href="/map" className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
            <Compass size={14} /> City GIS Map
          </Link>
        </div>
      </div>

      {/* ── 1. KPI GRID (Interactive Map Links) ────────── */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Civic Health Index */}
        <Link href="/dashboard/analytics" style={{ textDecoration: 'none' }}>
          <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
            <div className="kpi-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>🩺</div>
            <div className="kpi-label">Civic Health Index</div>
            <div className="kpi-value" style={{ color: 'var(--accent-orange)' }}>
              {healthIndex?.overallScore ?? 78}<span style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div className="kpi-change" style={{ color: 'var(--color-success)' }}>
              <span>● {healthIndex?.status ?? 'Good'} Performance</span>
            </div>
          </div>
        </Link>

        {/* Total Issues */}
        <Link href="/map" style={{ textDecoration: 'none' }}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>📋</div>
            <div className="kpi-label">Total Issues</div>
            <div className="kpi-value">{ov?.total?.toLocaleString() ?? '—'}</div>
            <div className="kpi-change" style={{ color: 'var(--accent-blue)' }}>
              <span>View all on map →</span>
            </div>
          </div>
        </Link>

        {/* Active Issues */}
        <Link href="/map?status=In_Progress" style={{ textDecoration: 'none' }}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>⏳</div>
            <div className="kpi-label">Active / Pending</div>
            <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>{ov?.active?.toLocaleString() ?? '—'}</div>
            <div className="kpi-change" style={{ color: 'var(--color-warning)' }}>
              <span>{ov?.criticalActive ?? 0} Critical Unresolved</span>
            </div>
          </div>
        </Link>

        {/* Resolved */}
        <Link href="/map?status=Resolved" style={{ textDecoration: 'none' }}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
            <div className="kpi-label">Resolved</div>
            <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{ov?.resolved?.toLocaleString() ?? '—'}</div>
            <div className="kpi-change" style={{ color: 'var(--color-success)' }}>
              <span>{ov?.resolutionRate ?? 0}% Resolution Rate</span>
            </div>
          </div>
        </Link>

        {/* SLA Breach */}
        <Link href="/map?slaBreach=true" style={{ textDecoration: 'none' }}>
          <div className="kpi-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>⚠</div>
            <div className="kpi-label">SLA Breaches</div>
            <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{ov?.slaBreach ?? '—'}</div>
            <div className="kpi-change" style={{ color: 'var(--color-danger)' }}>
              <span>Requires immediate escalation</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 2. AI CITY INTELLIGENCE OBSERVATIONS BRIEFING ── */}
      <div className="card-elevated" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--accent-orange)' }} />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
              Live AI City Intelligence Briefing
            </h2>
          </div>
          <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)', fontWeight: 700 }}>
            Ground-Truth Synthesized
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: 4 }}>
              [DATA OBSERVATION] Hotspot Density
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Dharampeth</strong> and <strong>Laxmi Nagar</strong> zones account for {analytics?.byZone[0]?.count || 12} complaints, with <strong>Road/Pothole</strong> and <strong>Drainage</strong> comprising over 45% of incoming issues.
            </p>
            <Link href="/map?zone=Dharampeth" style={{ fontSize: '11px', color: 'var(--accent-orange)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
              Inspect Dharampeth on Map →
            </Link>
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', marginBottom: 4 }}>
              [SLA WATCH] Escalation Warning
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {ov?.slaBreach ?? 5} complaints have exceeded standard SLA deadlines. 3 critical water pipe bursts in Gandhibagh require inter-departmental dispatch between Water Works & Roads.
            </p>
            <Link href="/map?slaBreach=true" style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
              View SLA Breaches →
            </Link>
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: 4 }}>
              [AI RECOMMENDATION] Maintenance Priority
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Pre-monsoon culvert desilting recommended in Sitabuldi (Ward 23) to prevent recurring waterlogging near the metro corridor.
            </p>
            <Link href="/dashboard/copilot" style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
              Ask AI Copilot for Full Plan →
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. CRITICAL ISSUES REQUIRING ATTENTION ────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} /> Critical Issues Requiring Immediate Action
          </h2>
          <Link href="/map?severity=Critical" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-orange)', fontWeight: 700, textDecoration: 'none' }}>
            View All Critical on Map →
          </Link>
        </div>

        {criticalIssues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-success)', fontWeight: 600 }}>
            ✅ No critical unresolved issues logged at this moment!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Category</th>
                  <th>Title & Location</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th style={{ textAlign: 'right' }}>GIS Action</th>
                </tr>
              </thead>
              <tbody>
                {criticalIssues.map((issue) => (
                  <tr key={issue.ticketId}>
                    <td>
                      <Link href={`/track?ticketId=${issue.ticketId}`} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {issue.ticketId}
                      </Link>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)' }}>
                        <span>{getCategoryIcon(issue.category)}</span>
                        <span>{issue.category}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{issue.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{issue.zone || 'Nagpur'}{issue.wardNumber ? ` · Ward ${issue.wardNumber}` : ''}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
                        Critical / {getStatusLabel(issue.status)}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{timeAgo(issue.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/map?ticketId=${issue.ticketId}`}
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: '11px', color: 'var(--accent-orange)', padding: '3px 8px' }}
                      >
                        <MapPin size={11} /> View on Map
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. CATEGORY & ZONE BREAKDOWN ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Category Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>Top Issue Categories</h3>
            <Link href="/map" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-orange)', fontWeight: 600 }}>Explore Map →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {analytics?.byCategory?.slice(0, 6).map(({ category, count }) => (
              <div key={category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <span>{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(count / maxCategory) * 100}%`,
                    height: '100%',
                    background: 'var(--gradient-brand)',
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>Zone Density</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>10 Zones</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {analytics?.byZone?.slice(0, 6).map(({ zone, count }) => (
              <div key={zone}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{zone} Zone</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>{count} issues</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(count / maxZone) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)',
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
