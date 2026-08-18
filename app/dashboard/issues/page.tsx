'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Filter, Search, AlertTriangle, CheckCircle, Clock,
  MapPin, Tag, Building, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { CATEGORY_LIST, NAGPUR_ZONES, getCategoryIcon, getStatusLabel, timeAgo } from '@/lib/utils';

interface Issue {
  id: string;
  ticketId: string;
  category: string;
  title: string;
  severity: string;
  status: string;
  zone: string | null;
  wardNumber: number | null;
  locality: string | null;
  department: string | null;
  slaBreach: boolean;
  createdAt: string;
}

export default function IssuesManagementPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [zone, setZone] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (severity) params.set('severity', severity);
    if (status) params.set('status', status);
    if (zone) params.set('zone', zone);
    params.set('page', String(page));
    params.set('limit', '15');

    try {
      const res = await fetch(`/api/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [category, severity, status, zone, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = issues.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.ticketId.toLowerCase().includes(q) ||
           i.title.toLowerCase().includes(q) ||
           (i.zone && i.zone.toLowerCase().includes(q)) ||
           (i.locality && i.locality.toLowerCase().includes(q));
  });

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', marginBottom: 'var(--space-2)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={14} /> Back to Command Center
          </Link>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Civic Issues Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            All active, pending, and resolved complaints logged across 10 NMC zones ({totalCount} records).
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button className="btn btn-secondary btn-sm" onClick={fetchIssues} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/report" className="btn btn-primary btn-sm">
            + New Complaint
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Ticket, Title, Area..."
              style={{ paddingLeft: 34, fontSize: 'var(--text-xs)', height: 36 }}
            />
          </div>

          {/* Category */}
          <select
            className="form-select"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{ fontSize: 'var(--text-xs)', height: 36 }}
          >
            <option value="">All Categories</option>
            {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Severity */}
          <select
            className="form-select"
            value={severity}
            onChange={e => { setSeverity(e.target.value); setPage(1); }}
            style={{ fontSize: 'var(--text-xs)', height: 36 }}
          >
            <option value="">All Severities</option>
            <option value="Critical">🚨 Critical</option>
            <option value="High">⚠️ High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Zone */}
          <select
            className="form-select"
            value={zone}
            onChange={e => { setZone(e.target.value); setPage(1); }}
            style={{ fontSize: 'var(--text-xs)', height: 36 }}
          >
            <option value="">All Zones</option>
            {NAGPUR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          {/* Status */}
          <select
            className="form-select"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{ fontSize: 'var(--text-xs)', height: 36 }}
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="AI_Verified">AI Verified</option>
            <option value="Assigned">Assigned</option>
            <option value="In_Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
            <div style={{ color: 'var(--text-muted)' }}>Loading civic issues...</div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No issues found</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Try adjusting your search criteria or filters.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Zone / Ward</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => (
                  <tr key={issue.ticketId}>
                    <td>
                      <Link
                        href={`/track?id=${issue.ticketId}`}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', fontWeight: 700 }}
                      >
                        {issue.ticketId}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }} className="truncate">
                        {issue.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }} className="truncate">
                        {issue.locality || issue.zone || 'Nagpur'}
                      </div>
                      {issue.slaBreach && (
                        <span style={{ fontSize: '10px', color: 'var(--color-danger)', fontWeight: 700 }}>
                          ⚠ SLA BREACH
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)' }}>
                        {getCategoryIcon(issue.category)} {issue.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge severity-${issue.severity.toLowerCase()}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {issue.zone || '—'} {issue.wardNumber ? `(W${issue.wardNumber})` : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {issue.department || 'NMC'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge status-${issue.status.toLowerCase().replace('_', '-')}`}>
                        {getStatusLabel(issue.status)}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {timeAgo(issue.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/track?id=${issue.ticketId}`} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                        Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div style={{
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}>
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total issues)
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
