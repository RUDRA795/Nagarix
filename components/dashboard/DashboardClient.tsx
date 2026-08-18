'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, Map, Zap } from 'lucide-react';
import Link from 'next/link';
import { getCategoryIcon, getStatusLabel, timeAgo } from '@/lib/utils';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/overview').then(r => r.json()),
      fetch('/api/issues?severity=Critical&status=Reported&limit=5').then(r => r.json()),
    ]).then(([analyticsData, issuesData]) => {
      setAnalytics(analyticsData);
      setCriticalIssues(issuesData.issues || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, margin: '80px auto 16px' }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading Command Center...</div>
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
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 'var(--space-2)' }}>
            Municipal Command Center
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Nagpur Civic Overview
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="demo-banner">
            ⚠ Demo Data — Platform Preview
          </div>
          <Link href="/dashboard/copilot" className="btn btn-secondary btn-sm">
            <Zap size={14} />
            AI Copilot
          </Link>
          <Link href="/map" className="btn btn-primary btn-sm">
            <Map size={14} />
            City Map
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>📋</div>
          <div className="kpi-label">Total Issues</div>
          <div className="kpi-value">{ov?.total?.toLocaleString() ?? '—'}</div>
          <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>All time · Demo data</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>⏳</div>
          <div className="kpi-label">Active Issues</div>
          <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>{ov?.active?.toLocaleString() ?? '—'}</div>
          <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>{ov?.pending} pending assignment</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
          <div className="kpi-label">Resolved</div>
          <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{ov?.resolved?.toLocaleString() ?? '—'}</div>
          <div className="kpi-change" style={{ color: 'var(--color-success)' }}>{ov?.resolutionRate}% resolution rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🚨</div>
          <div className="kpi-label">SLA Breaches</div>
          <div className="kpi-value" style={{ color: ov && ov.slaBreach > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {ov?.slaBreach?.toLocaleString() ?? '—'}
          </div>
          <div className="kpi-change" style={{ color: ov && ov.criticalActive > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
            {ov?.criticalActive} critical unresolved
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Category Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Issues by Category</h3>
            <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {analytics?.byCategory.map(({ category, count }) => (
              <div key={category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getCategoryIcon(category)} {category}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)' }}>{count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={
                    {
                      height: '100%',
                      width: `${(count / maxCategory) * 100}%`,
                      background: 'var(--gradient-brand)',
                      borderRadius: 3,
                      transition: 'width 0.6s ease',
                    }
                  } />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Issues by Zone</h3>
            <Map size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {analytics?.byZone.filter(z => z.zone).map(({ zone, count }, idx) => (
              <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{zone}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxZone) * 100}%`, background: idx < 3 ? 'var(--color-danger)' : 'var(--accent-blue)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 24, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Issues */}
      {criticalIssues.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
              Critical Issues — Immediate Attention Required
            </h3>
            <Link href="/dashboard/issues" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Issue</th>
                <th>Category</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {criticalIssues.map(issue => (
                <tr key={issue.ticketId}>
                  <td>
                    <Link href={`/track?id=${issue.ticketId}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                      {issue.ticketId}
                    </Link>
                  </td>
                  <td style={{ maxWidth: 240 }}>
                    <div className="truncate" style={{ fontSize: 'var(--text-sm)' }}>{issue.title}</div>
                    {issue.slaBreach && <span style={{ fontSize: '10px', color: 'var(--color-danger)', fontWeight: 700 }}>SLA BREACH</span>}
                  </td>
                  <td><span style={{ fontSize: 'var(--text-xs)' }}>{getCategoryIcon(issue.category)} {issue.category}</span></td>
                  <td><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{issue.zone || '—'}</span></td>
                  <td><span className={`badge status-${issue.status.toLowerCase().replace('_', '-')}`}>{getStatusLabel(issue.status)}</span></td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{timeAgo(issue.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trend Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} />
            14-Day Trend
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                {analytics?.trend.map(t => (
                  <th key={t.date} style={{ textAlign: 'center', minWidth: 52 }}>{t.date}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>Reported</td>
                {analytics?.trend.map(t => (
                  <td key={t.date} style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: t.reported > 0 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: t.reported > 0 ? 700 : 400 }}>{t.reported || '—'}</td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>Resolved</td>
                {analytics?.trend.map(t => (
                  <td key={t.date} style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: t.resolved > 0 ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: t.resolved > 0 ? 700 : 400 }}>{t.resolved || '—'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
