'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock,
  ArrowLeft, ShieldAlert, Layers, MapPin, Zap, RefreshCw,
  HeartPulse, ShieldCheck, AlertCircle, ArrowUpRight, Award, Compass
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/utils';
import { CityHealthIndex, WardHealthScore } from '@/lib/analytics/healthScore';
import { SlaOverview } from '@/lib/analytics/slaEngine';

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
  const [healthIndex, setHealthIndex] = useState<CityHealthIndex | null>(null);
  const [slaData, setSlaData] = useState<SlaOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [ovRes, healthRes, slaRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/analytics/health-score'),
        fetch('/api/analytics/sla-risk'),
      ]);
      const [ovJson, healthJson, slaJson] = await Promise.all([
        ovRes.json(),
        healthRes.json(),
        slaRes.json(),
      ]);
      setData(ovJson);
      setHealthIndex(healthJson);
      setSlaData(slaJson);
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
        <div style={{ color: 'var(--text-muted)' }}>Calculating Nagpur Civic Health & Analytics...</div>
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
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--accent-orange)', marginBottom: 'var(--space-2)', textDecoration: 'none', fontWeight: 700 }}>
            <ArrowLeft size={14} /> Back to Command Center
          </Link>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Nagpur Civic Health & SLA Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Grounded urban index, dynamic SLA countdowns, and ward-by-ward performance analytics.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <Link href="/map" className="btn btn-primary btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Compass size={14} /> Explore on GIS Map
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── 1. CIVIC HEALTH INDEX HERO CARD ──────────────── */}
      {healthIndex && (
        <div className="card-elevated" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', alignItems: 'center' }}>
            {/* Left: Overall Score */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-orange)', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                <HeartPulse size={14} /> NAGARIX CIVIC HEALTH INDEX
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: healthIndex.overallScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {healthIndex.overallScore}
                </span>
                <span style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)', fontWeight: 700 }}>/ 100</span>
                <span className="badge" style={{
                  background: healthIndex.status === 'Good' || healthIndex.status === 'Excellent' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: healthIndex.status === 'Good' || healthIndex.status === 'Excellent' ? 'var(--color-success)' : 'var(--color-warning)',
                  fontWeight: 800,
                  fontSize: '12px'
                }}>
                  {healthIndex.status.toUpperCase()} MUNICIPAL PERFORMANCE
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 460 }}>
                Calculated deterministically from active complaint density, critical hazard ratio, resolution velocity, and SLA breach rate across Nagpur.
              </p>
            </div>

            {/* Right: 5 Urban Dimension Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Urban Service Health by Sector
              </div>
              {healthIndex.dimensions.map(dim => (
                <div key={dim.category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 120, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{getCategoryIcon(dim.category)}</span>
                    <span className="truncate">{dim.category.split('/')[0]}</span>
                  </div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${dim.score}%`,
                      height: '100%',
                      background: dim.score >= 75 ? 'var(--color-success)' : dim.score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)',
                      borderRadius: 4,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ width: 45, textAlign: 'right', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {dim.score}/100
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. SLA RISK MONITOR CARDS ─────────────────────── */}
      {slaData && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} /> Dynamic SLA Risk Engine
            </h2>
            <Link href="/map?slaBreach=true" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-orange)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              View Breaches on Map →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 700, marginBottom: 4 }}>SAFE (&gt;50% SLA Time)</div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--color-success)' }}>{slaData.safeCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Field teams dispatched on schedule</div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontWeight: 700, marginBottom: 4 }}>WATCH (20%-50% Time)</div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--color-warning)' }}>{slaData.watchCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Mid-stage resolution window</div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: '#ea580c', fontWeight: 700, marginBottom: 4 }}>AT RISK (&lt;6h Remaining)</div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: '#ea580c' }}>{slaData.atRiskCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Requires priority municipal intervention</div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.04)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 700, marginBottom: 4 }}>SLA BREACHED</div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--color-danger)' }}>{slaData.breachedCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Escalated to Department Heads</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. RANKED WARD PERFORMANCE LEADERBOARD ───────── */}
      {healthIndex && healthIndex.wardRankings.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={20} style={{ color: 'var(--accent-orange)' }} /> Ward Performance Leaderboard
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Deterministic civic health ranking of all 23 monitored Nagpur wards.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank & Ward</th>
                  <th>Zone</th>
                  <th>Health Score</th>
                  <th>Active Issues</th>
                  <th>Resolved</th>
                  <th>Resolution %</th>
                  <th>SLA Breaches</th>
                  <th>Top Category</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {healthIndex.wardRankings.slice(0, 10).map((ward, idx) => (
                  <tr key={ward.wardNumber}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: idx < 3 ? 'var(--accent-orange)' : 'var(--text-muted)',
                          width: 20,
                        }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Ward {ward.wardNumber}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ward.wardName}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: 'var(--bg-elevated)' }}>{ward.zone}</span></td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: ward.score >= 75 ? 'var(--color-success)' : ward.score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)'
                      }}>
                        {ward.score} / 100
                      </span>
                    </td>
                    <td><span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>{ward.activeIssues}</span></td>
                    <td><span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{ward.resolvedIssues}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ward.resolutionRate}%</span>
                      </div>
                    </td>
                    <td>
                      {ward.slaBreaches > 0 ? (
                        <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>{ward.slaBreaches} Breaches</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)' }}>0 Breaches</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)' }}>
                        <span>{getCategoryIcon(ward.topCategory)}</span>
                        <span>{ward.topCategory}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/map?ward=${ward.wardNumber}`}
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: '11px', color: 'var(--accent-orange)', padding: '3px 8px' }}
                      >
                        <MapPin size={11} /> Inspect Map
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. CATEGORY BREAKDOWN & ZONE DISTRIBUTION ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Category breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} style={{ color: 'var(--accent-blue)' }} /> Category Volume Breakdown
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{data.byCategory.length} Categories</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.byCategory.map(({ category, count }) => (
              <div key={category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <span>{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 700 }}>{count} issues</span>
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

        {/* Zone density */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} style={{ color: 'var(--accent-orange)' }} /> Zone Ingestion Distribution
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>10 NMC Zones</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.byZone.map(({ zone, count }) => (
              <div key={zone}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{zone} Zone</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700 }}>{count} issues</span>
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
