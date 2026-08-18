'use client';

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, MapPin, Tag, Calendar, User, Building } from 'lucide-react';
import { getCategoryIcon, getStatusLabel, formatDateTime, timeAgo } from '@/lib/utils';

interface TimelineEntry {
  id: string;
  status: string;
  note: string | null;
  actor: string | null;
  createdAt: string;
}

interface Issue {
  ticketId: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  zone: string | null;
  wardNumber: number | null;
  wardName: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  department: string | null;
  slaDeadline: string | null;
  slaBreach: boolean;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  Reported: 'var(--color-reported)',
  AI_Verified: 'var(--color-ai-verified)',
  Assigned: 'var(--color-assigned)',
  In_Progress: 'var(--color-in-progress)',
  Resolved: 'var(--color-resolved)',
  Citizen_Verified: 'var(--color-citizen-verified)',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'var(--color-critical)',
  High: 'var(--color-high)',
  Medium: 'var(--color-medium)',
  Low: 'var(--color-low)',
};

export function TrackComplaint() {
  const [query, setQuery] = useState('');
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setIssue(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/issues/${query.trim().toUpperCase()}`);
      if (res.status === 404) {
        setError('No complaint found with this ticket ID. Please check and try again.');
      } else if (!res.ok) {
        setError('Failed to fetch complaint. Please try again.');
      } else {
        const data = await res.json();
        setIssue(data.issue);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const isResolved = issue?.status === 'Resolved' || issue?.status === 'Citizen_Verified';
  const isBreached = issue?.slaBreach;

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-4)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              placeholder="Enter Ticket ID (e.g. NX-2026-000001)"
              style={{ paddingLeft: 42, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
            {loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : <Search size={16} />}
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </form>

      {/* Try Sample */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '-var(--space-6)', marginBottom: 'var(--space-6)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        Try:
        {['NX-2026-000001', 'NX-2026-000010', 'NX-2026-000025'].map(id => (
          <button key={id} onClick={() => { setQuery(id); }} className="btn btn-ghost btn-sm" style={{ fontFamily: 'var(--font-mono)', padding: '2px 8px', fontSize: '11px' }}>{id}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto var(--space-4)' }} />
          <div style={{ color: 'var(--text-secondary)' }}>Fetching complaint data...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-danger)', margin: '0 auto var(--space-4)' }} />
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Complaint Not Found</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{error}</div>
        </div>
      )}

      {/* Issue Details */}
      {issue && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Header Card */}
          <div className="card-elevated">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                  {issue.ticketId}
                </div>
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
                  {getCategoryIcon(issue.category)} {issue.title}
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span className={`badge severity-${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                  <span className={`badge status-${issue.status.toLowerCase().replace('_', '-')}`}>{getStatusLabel(issue.status)}</span>
                  <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)' }}>{issue.category}</span>
                  {issue.slaBreach && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>⚠ SLA Breach</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {isResolved ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontWeight: 700 }}>
                    <CheckCircle size={20} />
                    Resolved
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-warning)' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: 'var(--text-sm)' }}>In Progress</span>
                  </div>
                )}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                  Reported {timeAgo(issue.createdAt)}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {issue.description}
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
              {issue.zone && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-blue)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>LOCATION</div>
                    <div style={{ fontSize: 'var(--text-sm)' }}>{issue.locality || issue.wardName || issue.zone}</div>
                    {issue.zone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{issue.zone} Zone{issue.wardNumber ? ` · Ward ${issue.wardNumber}` : ''}</div>}
                  </div>
                </div>
              )}
              {issue.department && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Building size={14} style={{ color: 'var(--accent-purple)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTMENT</div>
                    <div style={{ fontSize: 'var(--text-sm)' }}>{issue.department}</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>REPORTED</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{formatDateTime(issue.createdAt)}</div>
                </div>
              </div>
              {issue.slaDeadline && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Clock size={14} style={{ color: isBreached ? 'var(--color-danger)' : 'var(--color-warning)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SLA DEADLINE</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: isBreached ? 'var(--color-danger)' : 'inherit' }}>{formatDateTime(issue.slaDeadline)}</div>
                  </div>
                </div>
              )}
            </div>

            {issue.resolutionNote && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)', marginBottom: 4 }}>RESOLUTION NOTE</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{issue.resolutionNote}</div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {issue.timeline && issue.timeline.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)' }}>Status Timeline</h3>
              <div className="timeline">
                {issue.timeline.map((entry, idx) => {
                  const isLast = idx === issue.timeline.length - 1;
                  const dotColor = STATUS_COLORS[entry.status] || 'var(--accent-blue)';
                  return (
                    <div key={entry.id} className="timeline-item">
                      <div className="timeline-dot" style={{ borderColor: dotColor, background: isLast ? dotColor : 'var(--bg-primary)' }} />
                      <div className="timeline-content">
                        <div className="timeline-meta">
                          <span className="timeline-status" style={{ color: dotColor }}>{getStatusLabel(entry.status)}</span>
                          <span className="timeline-time">{timeAgo(entry.createdAt)}</span>
                        </div>
                        {entry.note && <div className="timeline-note">{entry.note}</div>}
                        {entry.actor && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>— {entry.actor}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
