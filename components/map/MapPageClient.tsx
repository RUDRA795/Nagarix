'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Filter, Layers, Map as MapIcon, X } from 'lucide-react';
import { CATEGORY_LIST, NAGPUR_ZONES, getCategoryIcon, getStatusLabel } from '@/lib/utils';

const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 };

interface MapIssue {
  id: string;
  ticketId: string;
  category: string;
  title: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  zone: string | null;
  wardNumber: number | null;
  slaBreach: boolean;
  createdAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#22c55e',
};

export function MapPageClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapRef = useRef<any>(null);

  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filters, setFilters] = useState({ category: '', severity: '', zone: '', status: '' });
  const [apiMissing, setApiMissing] = useState(false);

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.zone) params.set('zone', filters.zone);
    if (filters.status) params.set('status', filters.status);

    try {
      const res = await fetch(`/api/map/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch {
      setIssues([]);
    }
  }, [filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // Init Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setApiMissing(true); setLoading(false); return; }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['maps', 'marker', 'visualization'],
    });

    (loader as any).importLibrary('maps').then((mapsLib: { Map: new (el: HTMLElement, opts: unknown) => unknown }) => {
      if (!mapRef.current) return;
      const map = new mapsLib.Map(mapRef.current, {
        center: NAGPUR_CENTER,
        zoom: 13,
        mapTypeId: 'hybrid',
        mapId: 'NAGARIX_MAP',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;
      setMapLoaded(true);
      setLoading(false);
    }).catch(() => { setApiMissing(true); setLoading(false); });
  }, []);

  // Update markers when issues or map changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markersRef.current.forEach((m: any) => { m.map = null; });
    markersRef.current = [];

    // Clear heatmap
    if (heatmapRef.current) heatmapRef.current.setMap(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['maps', 'marker', 'visualization'],
    });

    if (showHeatmap) {
      (loader as any).importLibrary('visualization').then((vizLib: { HeatmapLayer: new (opts: unknown) => { setMap: (m: unknown) => void } }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const googleObj = (window as any).google;
        if (!googleObj?.maps) return;

        const heatmapData = issues.map(issue => ({
          location: new googleObj.maps.LatLng(issue.latitude, issue.longitude),
          weight: issue.severity === 'Critical' ? 4 : issue.severity === 'High' ? 3 : issue.severity === 'Medium' ? 2 : 1,
        }));
        const heatmap = new vizLib.HeatmapLayer({
          data: heatmapData,
          map,
          radius: 30,
          opacity: 0.7,
        });
        heatmapRef.current = heatmap;
      });
      return;
    }

    // Add markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).importLibrary('marker').then((markerLib: any) => {
      for (const issue of issues) {
        const pin = new markerLib.PinElement({
          background: SEVERITY_COLORS[issue.severity] || '#3b82f6',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: issue.severity === 'Critical' ? 1.3 : 1.0,
        });

        const marker = new markerLib.AdvancedMarkerElement({
          map,
          position: { lat: issue.latitude, lng: issue.longitude },
          title: issue.title,
          content: pin.element,
        });

        marker.addListener('click', () => setSelectedIssue(issue));
        markersRef.current.push(marker);
      }
    });
  }, [issues, mapLoaded, showHeatmap]);

  return (
    <div style={{ height: 'calc(100vh - var(--nav-height))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Filter Bar */}
      <div style={{
        padding: 'var(--space-3) var(--space-5)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          <Filter size={14} />
          <span>Filters:</span>
        </div>

        {[
          { key: 'category', label: 'Category', options: CATEGORY_LIST },
          { key: 'severity', label: 'Severity', options: ['Critical', 'High', 'Medium', 'Low'] },
          { key: 'zone', label: 'Zone', options: NAGPUR_ZONES },
          { key: 'status', label: 'Status', options: ['Reported', 'AI_Verified', 'Assigned', 'In_Progress', 'Resolved'] },
        ].map(({ key, label, options }) => (
          <select
            key={key}
            className="form-select"
            value={filters[key as keyof typeof filters]}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            style={{ minWidth: 140, padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}
          >
            <option value="">All {label}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}

        <button
          className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowHeatmap(h => !h)}
        >
          <Layers size={13} />
          {showHeatmap ? 'Heatmap ON' : 'Heatmap'}
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {issues.length} issues mapped
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Map Container */}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Loading */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="loading-spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <div style={{ color: 'var(--text-muted)' }}>Loading Nagpur map...</div>
            </div>
          </div>
        )}

        {/* API Missing / Fallback View */}
        {apiMissing && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 'var(--space-6)' }}>
            <div className="card" style={{ textAlign: 'center', maxWidth: 540, width: '100%' }}>
              <MapIcon size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 12 }}>Google Maps Preview Mode</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: 16 }}>
                Add <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>.env.local</code> file for satellite view.
              </p>
              <div className="demo-banner" style={{ justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                Showing {issues.length} Geocoded Issues from Nagpur Database
              </div>

              {/* Fallback Issues List */}
              <div style={{ textAlign: 'left', maxHeight: 280, overflowY: 'auto', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', padding: 'var(--space-3)' }}>
                {issues.map(issue => (
                  <div key={issue.ticketId} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
                      <span style={{ fontSize: 14 }}>{getCategoryIcon(issue.category)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{issue.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📍 {issue.zone || 'Nagpur'} ({issue.latitude?.toFixed(4)}, {issue.longitude?.toFixed(4)}) · {issue.ticketId}</div>
                      </div>
                    </div>
                    <span className={`badge severity-${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Issue Detail Panel */}
        {selectedIssue && (
          <div style={{
            position: 'absolute', top: 16, right: 16, width: 320,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-xl)', zIndex: 10,
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                {selectedIssue.ticketId}
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedIssue(null)}>
                <X size={14} />
              </button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', lineHeight: 1.4 }}>
              {getCategoryIcon(selectedIssue.category)} {selectedIssue.title}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
              <span className={`badge severity-${selectedIssue.severity.toLowerCase()}`}>{selectedIssue.severity}</span>
              <span className={`badge status-${selectedIssue.status.toLowerCase().replace('_', '-')}`}>{getStatusLabel(selectedIssue.status)}</span>
              {selectedIssue.slaBreach && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>SLA Breach</span>}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {selectedIssue.zone && <div>📍 {selectedIssue.zone}{selectedIssue.wardNumber ? ` · Ward ${selectedIssue.wardNumber}` : ''}</div>}
              <div>📁 {selectedIssue.category}</div>
            </div>
            <a
              href={`/track?id=${selectedIssue.ticketId}`}
              className="btn btn-secondary btn-sm w-full"
              style={{ marginTop: 'var(--space-4)', justifyContent: 'center' }}
            >
              View Full Details
            </a>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(10, 22, 40, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          zIndex: 10,
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Severity</div>
          {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              {sev}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
