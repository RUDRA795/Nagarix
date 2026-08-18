'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

interface Analytics {
  overview: {
    total: number;
    active: number;
    resolved: number;
    slaBreach: number;
  };
}

const INITIAL_STATS: Analytics = {
  overview: {
    total: 62,
    active: 40,
    resolved: 22,
    slaBreach: 5,
  },
};

export function CityStatsBar() {
  const [data, setData] = useState<Analytics>(INITIAL_STATS);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(r => {
        if (!r.ok) throw new Error('API failed');
        return r.json();
      })
      .then(res => {
        if (res?.overview) setData(res);
      })
      .catch(() => {});
  }, []);

  const stats = [
    { icon: AlertTriangle, value: data.overview.total, label: 'Total Issues', color: 'var(--accent-blue)', href: '/map' },
    { icon: Clock,         value: data.overview.active, label: 'Active', color: 'var(--color-warning)', href: '/map?status=In_Progress' },
    { icon: CheckCircle,   value: data.overview.resolved, label: 'Resolved', color: 'var(--color-success)', href: '/map?status=Resolved' },
    { icon: AlertCircle,   value: data.overview.slaBreach, label: 'SLA Breach', color: 'var(--color-danger)', href: '/map?slaBreach=true' },
  ];

  return (
    <div className="stat-row">
      {stats.map(({ icon: Icon, value, label, color, href }) => (
        <Link
          key={label}
          href={href}
          className="stat-chip"
          style={{
            textDecoration: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
          title={`View ${label} on City Map GIS`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={14} style={{ color }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
            </div>
            <ArrowUpRight size={11} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          </div>
          <div className="stat-chip-value" style={{ color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </Link>
      ))}
    </div>
  );
}
