'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Analytics {
  overview: {
    total: number;
    active: number;
    resolved: number;
    slaBreach: number;
  };
}

export function CityStatsBar() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const stats = data
    ? [
        { icon: AlertTriangle, value: data.overview.total, label: 'Total Issues', color: 'var(--accent-blue)' },
        { icon: Clock,         value: data.overview.active, label: 'Active', color: 'var(--color-warning)' },
        { icon: CheckCircle,   value: data.overview.resolved, label: 'Resolved', color: 'var(--color-success)' },
        { icon: AlertCircle,   value: data.overview.slaBreach, label: 'SLA Breach', color: 'var(--color-danger)' },
      ]
    : [
        { icon: AlertTriangle, value: '—', label: 'Total Issues', color: 'var(--accent-blue)' },
        { icon: Clock,         value: '—', label: 'Active', color: 'var(--color-warning)' },
        { icon: CheckCircle,   value: '—', label: 'Resolved', color: 'var(--color-success)' },
        { icon: AlertCircle,   value: '—', label: 'SLA Breach', color: 'var(--color-danger)' },
      ];

  return (
    <div className="stat-row">
      {stats.map(({ icon: Icon, value, label, color }) => (
        <div key={label} className="stat-chip">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon size={14} style={{ color }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
          </div>
          <div className="stat-chip-value" style={{ color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </div>
      ))}
    </div>
  );
}
