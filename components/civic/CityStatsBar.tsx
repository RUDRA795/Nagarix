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

const INITIAL_STATS: Analytics = {
  overview: {
    total: 60,
    active: 38,
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
    { icon: AlertTriangle, value: data.overview.total, label: 'Total Issues', color: 'var(--accent-blue)' },
    { icon: Clock,         value: data.overview.active, label: 'Active', color: 'var(--color-warning)' },
    { icon: CheckCircle,   value: data.overview.resolved, label: 'Resolved', color: 'var(--color-success)' },
    { icon: AlertCircle,   value: data.overview.slaBreach, label: 'SLA Breach', color: 'var(--color-danger)' },
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
