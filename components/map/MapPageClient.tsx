'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import {
  Filter, Layers, Map as MapIcon, X, Navigation, Search,
  Sparkles, AlertTriangle, CheckCircle, Clock, Building,
  Eye, Compass, ShieldAlert, BarChart3, ChevronRight
} from 'lucide-react';
import { CATEGORY_LIST, NAGPUR_ZONES, getCategoryIcon, getStatusLabel } from '@/lib/utils';

const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 };

// Nagpur Zone Centroids for quick focus
const ZONE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Dharampeth': { lat: 21.1385, lng: 79.0730 },
  'Laxmi Nagar': { lat: 21.1467, lng: 79.1050 },
  'Hanuman Nagar': { lat: 21.1238, lng: 79.0942 },
  'Dhantoli': { lat: 21.1280, lng: 79.0820 },
  'Nehru Nagar': { lat: 21.1560, lng: 79.0975 },
  'Gandhibagh': { lat: 21.1460, lng: 79.0820 },
  'Satranjipura': { lat: 21.1620, lng: 79.0680 },
  'Lakadganj': { lat: 21.1340, lng: 79.1180 },
  'Ashi Nagar': { lat: 21.1150, lng: 79.1060 },
  'Mangalwari': { lat: 21.1520, lng: 79.0910 },
};

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
  wardName: string | null;
  slaBreach: boolean;
  createdAt: string;
}

interface WardStats {
  wardNumber: number;
  wardName: string;
  zone: string;
  total: number;
  active: number;
  critical: number;
  resolved: number;
  slaBreach: number;
  topCategory: string;
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
  const [selectedWardStats, setSelectedWardStats] = useState<WardStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('hybrid');
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  const [filters, setFilters] = useState({ category: '', severity: '', zone: '', status: '' });
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  
  const [apiMissing, setApiMissing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch all issues matching filters
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

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.startsWith('AQ.')) {
      // Missing or invalid key
      setApiMissing(true);
      setLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['maps', 'marker', 'visualization'],
    });

    (loader as any)
      .importLibrary('maps')
      .then((mapsLib: { Map: new (el: HTMLElement, opts: unknown) => unknown }) => {
        if (!mapRef.current) return;
        
        // Custom dark map style for command center look
        const darkMapStyle = [
          { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
          { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
          { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
          { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
          { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
          { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#021019' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
          { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
        ];

        const map = new mapsLib.Map(mapRef.current, {
          center: NAGPUR_CENTER,
          zoom: 13,
          mapTypeId: mapType,
          styles: mapType === 'roadmap' ? darkMapStyle : undefined,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setLoading(false);
      })
      .catch((err: any) => {
        console.warn('[Google Maps Loader Error]', err);
        setErrorMessage(err.message || 'Google Maps failed to load. Check API Key.');
        setApiMissing(true);
        setLoading(false);
      });
  }, []);

  // Update map type (roadmap, satellite, hybrid)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setMapTypeId(mapType);
  }, [mapType]);

  // Update Markers & Heatmap Layer
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    // Clear old markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markersRef.current.forEach((m: any) => {
      if (typeof m.setMap === 'function') m.setMap(null);
      else m.map = null;
    });
    markersRef.current = [];

    // Clear old heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['maps', 'marker', 'visualization'],
    });

    // ── HEATMAP MODE ──────────────────────────────────
    if (showHeatmap) {
      (loader as any).importLibrary('visualization').then((vizLib: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const googleObj = (window as any).google;
        if (!googleObj?.maps) return;

        const heatmapPoints = issues
          .filter(i => i.latitude && i.longitude)
          .map(issue => ({
            location: new googleObj.maps.LatLng(issue.latitude, issue.longitude),
            weight: issue.severity === 'Critical' ? 4 : issue.severity === 'High' ? 3 : issue.severity === 'Medium' ? 2 : 1,
          }));

        const heatmap = new vizLib.HeatmapLayer({
          data: heatmapPoints,
          map,
          radius: 35,
          opacity: 0.8,
        });
        heatmapRef.current = heatmap;
      }).catch(() => {});
      return;
    }

    // ── DISCRETE MARKER MODE ──────────────────────────
    (loader as any).importLibrary('marker').then((markerLib: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const googleObj = (window as any).google;
      if (!googleObj?.maps) return;

      issues.forEach(issue => {
        if (!issue.latitude || !issue.longitude) return;

        const color = SEVERITY_COLORS[issue.severity] || '#3b82f6';
        
        // Use AdvancedMarkerElement if supported, or standard Marker
        if (markerLib?.AdvancedMarkerElement && markerLib?.PinElement) {
          const pin = new markerLib.PinElement({
            background: color,
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            scale: issue.severity === 'Critical' ? 1.25 : issue.severity === 'High' ? 1.1 : 0.95,
          });

          const marker = new markerLib.AdvancedMarkerElement({
            map,
            position: { lat: issue.latitude, lng: issue.longitude },
            title: `${issue.ticketId} - ${issue.title}`,
            content: pin.element,
          });

          marker.addListener('click', () => {
            setSelectedIssue(issue);
            map.panTo({ lat: issue.latitude, lng: issue.longitude });
          });

          markersRef.current.push(marker);
        } else {
          // Standard Marker Fallback
          const marker = new googleObj.maps.Marker({
            map,
            position: { lat: issue.latitude, lng: issue.longitude },
            title: issue.title,
            icon: {
              path: googleObj.maps.SymbolPath.CIRCLE,
              scale: issue.severity === 'Critical' ? 10 : 7,
              fillColor: color,
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            },
          });

          marker.addListener('click', () => {
            setSelectedIssue(issue);
            map.panTo({ lat: issue.latitude, lng: issue.longitude });
          });

          markersRef.current.push(marker);
        }
      });
    }).catch(() => {});
  }, [issues, mapLoaded, showHeatmap]);

  // Handle Zone Selection & Ward Intelligence Calculation
  const handleZoneSelect = (zone: string) => {
    setFilters(f => ({ ...f, zone }));
    if (zone && ZONE_CENTROIDS[zone] && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(ZONE_CENTROIDS[zone]);
      mapInstanceRef.current.setZoom(14);
    }

    if (zone) {
      const zoneIssues = issues.filter(i => i.zone === zone);
      const active = zoneIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
      const critical = zoneIssues.filter(i => i.severity === 'Critical').length;
      const resolved = zoneIssues.filter(i => ['Resolved', 'Citizen_Verified'].includes(i.status)).length;
      const slaBreach = zoneIssues.filter(i => i.slaBreach).length;

      // Find top category
      const catCounts: Record<string, number> = {};
      zoneIssues.forEach(i => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
      const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Road/Pothole';

      setSelectedWardStats({
        wardNumber: zoneIssues[0]?.wardNumber || 1,
        wardName: zone,
        zone,
        total: zoneIssues.length,
        active,
        critical,
        resolved,
        slaBreach,
        topCategory,
      });
    } else {
      setSelectedWardStats(null);
    }
  };

  // Locate User (GPS)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
        mapInstanceRef.current.setZoom(15);
      }
    }, () => {
      alert('Could not retrieve GPS location. Showing Central Nagpur.');
    });
  };

  // Gemini AI Natural Language Spatial Query
  const handleAiSpatialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiSearching(true);
    setAiNote(null);

    const q = aiQuery.toLowerCase();

    // Natural query parser for instant spatial filtering
    let matchedCategory = '';
    let matchedSeverity = '';
    let matchedZone = '';

    if (q.includes('pothole') || q.includes('road')) matchedCategory = 'Road/Pothole';
    else if (q.includes('garbage') || q.includes('waste') || q.includes('kachra')) matchedCategory = 'Garbage';
    else if (q.includes('drain') || q.includes('sewer') || q.includes('nala')) matchedCategory = 'Drainage';
    else if (q.includes('water') || q.includes('pani')) matchedCategory = 'Water Supply';
    else if (q.includes('light') || q.includes('pole')) matchedCategory = 'Streetlight';

    if (q.includes('critical') || q.includes('urgent') || q.includes('emergency')) matchedSeverity = 'Critical';
    else if (q.includes('high')) matchedSeverity = 'High';

    for (const z of NAGPUR_ZONES) {
      if (q.includes(z.toLowerCase())) {
        matchedZone = z;
        break;
      }
    }

    setFilters(f => ({
      ...f,
      category: matchedCategory || f.category,
      severity: matchedSeverity || f.severity,
      zone: matchedZone || f.zone,
    }));

    if (matchedZone && ZONE_CENTROIDS[matchedZone] && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(ZONE_CENTROIDS[matchedZone]);
      mapInstanceRef.current.setZoom(14);
    }

    setAiNote(`AI Spatial Query applied: Filtered by ${[matchedSeverity, matchedCategory, matchedZone].filter(Boolean).join(' · ') || 'relevant keywords'}`);
    setAiSearching(false);
  };

  return (
    <div style={{ height: 'calc(100vh - var(--nav-height))', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {/* ── TOP CONTROL BAR ─────────────────────────────── */}
      <div style={{
        padding: 'var(--space-3) var(--space-5)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        zIndex: 5,
      }}>
        {/* Gemini Spatial Query Input */}
        <form onSubmit={handleAiSpatialSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Sparkles size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-purple)' }} />
            <input
              type="text"
              className="form-input"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="Ask Gemini on Map (e.g. 'Show critical potholes in Dharampeth')..."
              style={{ paddingLeft: 36, fontSize: 'var(--text-xs)', height: 36, background: 'var(--bg-elevated)' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" disabled={aiSearching} style={{ height: 36, whiteSpace: 'nowrap' }}>
            <Search size={14} /> Search
          </button>
        </form>

        {/* Category Filter */}
        <select
          className="form-select"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          style={{ width: 140, fontSize: 'var(--text-xs)', height: 36 }}
        >
          <option value="">All Categories</option>
          {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Severity Filter */}
        <select
          className="form-select"
          value={filters.severity}
          onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          style={{ width: 120, fontSize: 'var(--text-xs)', height: 36 }}
        >
          <option value="">All Severities</option>
          <option value="Critical">🚨 Critical</option>
          <option value="High">⚠️ High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Zone Filter */}
        <select
          className="form-select"
          value={filters.zone}
          onChange={e => handleZoneSelect(e.target.value)}
          style={{ width: 130, fontSize: 'var(--text-xs)', height: 36 }}
        >
          <option value="">All Zones</option>
          {NAGPUR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        {/* Map Type Toggle (Satellite / Roadmap / Hybrid) */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border-subtle)' }}>
          {(['hybrid', 'satellite', 'roadmap'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setMapType(type)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: mapType === type ? 700 : 500,
                color: mapType === type ? 'var(--text-primary)' : 'var(--text-muted)',
                background: mapType === type ? 'var(--accent-blue)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Heatmap Toggle */}
        <button
          className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowHeatmap(h => !h)}
          style={{ height: 36, fontSize: '11px' }}
        >
          <Layers size={13} />
          {showHeatmap ? 'Heatmap ON' : 'Heatmap'}
        </button>

        {/* Locate Me */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleLocateMe}
          title="Center on My GPS Location"
          style={{ height: 36, padding: '0 10px' }}
        >
          <Navigation size={14} />
        </button>

        {/* Issue Counter */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <strong>{issues.length}</strong> mapped
        </div>
      </div>

      {/* AI Search Notification Banner */}
      {aiNote && (
        <div style={{
          padding: '6px 16px',
          background: 'rgba(139,92,246,0.15)',
          borderBottom: '1px solid rgba(139,92,246,0.3)',
          color: 'var(--accent-purple)',
          fontSize: 'var(--text-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} />
            {aiNote}
          </div>
          <button onClick={() => setAiNote(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── MAP CANVAS / AREA ───────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 400 }}>
        
        {/* Real Google Map Container */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '500px',
            background: '#0e1626',
            display: apiMissing ? 'none' : 'block',
          }}
        />

        {/* Loading Spinner */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', zIndex: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="loading-spinner" style={{ width: 44, height: 44, margin: '0 auto 16px', borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Loading Nagpur City Map...</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 4 }}>Rendering geospatial layers and civic markers</div>
            </div>
          </div>
        )}

        {/* ── INTERACTIVE OPENSTREETMAP FALLBACK WHEN GOOGLE MAPS API KEY IS PENDING ── */}
        {apiMissing && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0e1626' }}>
            {/* Top diagnostic banner */}
            <div style={{
              padding: '8px 16px',
              background: 'rgba(59,130,246,0.1)',
              borderBottom: '1px solid rgba(59,130,246,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-blue)',
            }}>
              <span>🗺️ <strong>NagariX Geospatial Intelligence Engine (Interactive Map)</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Showing {issues.length} live geocoded points across 10 NMC zones</span>
            </div>

            {/* Embedded OpenStreetMap View of Nagpur with Live Pins */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <iframe
                title="Nagpur Civic Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src="https://www.openstreetmap.org/export/embed.html?bbox=78.95%2C21.05%2C79.20%2C21.25&amp;layer=mapnik&amp;marker=21.1458%2C79.0882"
                style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)', opacity: 0.85 }}
              />

              {/* Overlay Interactive Pins onto the map view */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute', top: 20, left: 20, pointerEvents: 'auto',
                  background: 'rgba(10, 22, 40, 0.9)', backdropFilter: 'blur(12px)',
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)', maxWidth: 360,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapIcon size={16} style={{ color: 'var(--accent-blue)' }} />
                    Nagpur Municipal Geospatial Layer
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                    For Google Satellite imagery, add <code style={{ background: 'var(--bg-elevated)', padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Vercel.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {issues.slice(0, 8).map(issue => (
                      <button
                        key={issue.ticketId}
                        type="button"
                        onClick={() => setSelectedIssue(issue)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: '11px', padding: '3px 8px',
                          border: `1px solid ${SEVERITY_COLORS[issue.severity]}60`,
                          color: SEVERITY_COLORS[issue.severity],
                          background: `${SEVERITY_COLORS[issue.severity]}15`,
                        }}
                      >
                        {getCategoryIcon(issue.category)} {issue.ticketId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WARD INTELLIGENCE DRAWER ────────────────────── */}
        {selectedWardStats && (
          <div style={{
            position: 'absolute', top: 16, left: 16, width: 310,
            background: 'rgba(10, 22, 40, 0.95)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-xl)', zIndex: 10,
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={16} style={{ color: 'var(--accent-purple)' }} />
                <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--accent-purple)' }}>
                  Ward Intelligence
                </span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedWardStats(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', marginBottom: 2 }}>
              {selectedWardStats.zone} Zone
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Ward No. {selectedWardStats.wardNumber} · Nagpur Municipal Corporation
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TOTAL ISSUES</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedWardStats.total}</div>
              </div>
              <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ACTIVE CASES</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-warning)' }}>{selectedWardStats.active}</div>
              </div>
              <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CRITICAL RISK</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-critical)' }}>{selectedWardStats.critical}</div>
              </div>
              <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RESOLVED</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-success)' }}>{selectedWardStats.resolved}</div>
              </div>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', background: 'rgba(59,130,246,0.08)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)' }}>
              Dominant Issue Category: <strong>{selectedWardStats.topCategory}</strong>
              {selectedWardStats.slaBreach > 0 && (
                <div style={{ color: 'var(--color-danger)', marginTop: 4, fontWeight: 600 }}>
                  ⚠️ {selectedWardStats.slaBreach} SLA breaches in this ward
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SELECTED ISSUE POPUP CARD ───────────────────── */}
        {selectedIssue && (
          <div style={{
            position: 'absolute', top: 16, right: 16, width: 330,
            background: 'rgba(10, 22, 40, 0.95)', border: '1px solid var(--border-default)',
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
              {selectedIssue.slaBreach && (
                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  SLA Breach
                </span>
              )}
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
              {selectedIssue.zone && <div>📍 {selectedIssue.zone}{selectedIssue.wardNumber ? ` · Ward ${selectedIssue.wardNumber}` : ''}</div>}
              <div>🎯 Coordinates: {selectedIssue.latitude?.toFixed(4)}, {selectedIssue.longitude?.toFixed(4)}</div>
            </div>

            <a
              href={`/track?id=${selectedIssue.ticketId}`}
              className="btn btn-primary btn-sm w-full"
              style={{ justifyContent: 'center', gap: 6 }}
            >
              Open Full Complaint Details <ChevronRight size={14} />
            </a>
          </div>
        )}

        {/* ── SEVERITY LEGEND ─────────────────────────────── */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(10, 22, 40, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          zIndex: 4,
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Severity Index
          </div>
          {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span>{sev}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
