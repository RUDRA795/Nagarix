'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock,
  ArrowLeft, ShieldAlert, Layers, MapPin, Zap, RefreshCw
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/utils';

interface AnalyticsData {
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
  bySeverity: Array<{ severity: string; count: number }>;
  byZone: Array<{ zone: string; count: number }>;
  trend: Array<{ date: string; reported: number; resolved: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/overview');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, margin: '80px auto 16px' }} />
        <div style={{ color: 'var(--text-muted)' }}>Calculating City Analytics...</div>
      </div>
    );
  }

  const ov = data.overview;
  const maxCategory = data.byCategory[0]?.count || 1;
  const maxZone = data.byZone[0]?.count || 1;

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', marginBottom: 'var(--space-2)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={14} /> Back to Command Center
          </Link>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Municipal Analytics & SLA Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Real-time performance indicators, resolution velocities, and zone breakdown across Nagpur.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics}>
            <RefreshCw size={14} /> Refresh Analytics
          </button>
          <Link href="/dashboard/copilot" className="btn btn-primary btn-sm">
            <Zap size={14} /> Query with Copilot
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>📈</div>
          <div className="kpi-label">Resolution Rate</div>
          <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{ov.resolutionRate}%</div>
          <div className="kpi-change" style={{ color: 'var(--color-success)' }}>{ov.resolved} of {ov.total} resolved</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🚨</div>
          <div className="kpi-label">SLA Compliance</div>
          <div className="kpi-value" style={{ color: ov.slaBreach > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {ov.total > 0 ? Math.round(((ov.total - ov.slaBreach) / ov.total) * 100) : 100}%
          </div>
          <div className="kpi-change" style={{ color: 'var(--color-danger)' }}>{ov.slaBreach} breaches logged</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>⚡</div>
          <div className="kpi-label">Critical Unresolved</div>
          <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>{ov.criticalActive}</div>
          <div className="kpi-change" style={{ color: 'var(--text-muted)' }}>Requires urgent dispatch</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>🎯</div>
          <div className="kpi-label">Total Ingestion</div>
          <div className="kpi-value">{ov.total}</div>
          <div className="kpi-change" style={{ color: 'var(--accent-blue)' }}>Across 10 NMC Zones</div>
        </div>
      </div>

      {/* Grid: Categories & Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Category Breakdown */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} style={{ color: 'var(--accent-blue)' }} />
            Category Volume Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.byCategory.map(({ category, count }) => (
              <div key={category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getCategoryIcon(category)} {category}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)' }}>{count} ({Math.round((count / ov.total) * 100)}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCategory) * 100}%`, background: 'var(--gradient-brand)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Performance */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--accent-purple)' }} />
            Zone Ingestion Density
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {data.byZone.filter(z => z.zone).map(({ zone, count }, idx) => (
              <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</span>
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

      {/* 14-Day Timeline Table */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} />
          14-Day Civic Velocity Analysis
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Velocity Metric</th>
                {data.trend.map(t => (
                  <th key={t.date} style={{ textAlign: 'center', minWidth: 50 }}>{t.date}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>Inflow (Reported)</td>
                {data.trend.map(t => (
                  <td key={t.date} style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: t.reported > 0 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: t.reported > 0 ? 700 : 400 }}>{t.reported || '—'}</td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>Outflow (Resolved)</td>
                {data.trend.map(t => (
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
