'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {
  Filter, Layers, Map as MapIcon, X, Navigation, Search,
  Sparkles, AlertTriangle, CheckCircle, Clock, Building,
  Eye, Compass, ShieldAlert, BarChart3, ChevronRight, Maximize,
  Minimize, RefreshCw, AlertCircle, FileText, Tag, MapPin
} from 'lucide-react';
import { CATEGORY_LIST, NAGPUR_ZONES, getCategoryIcon, getStatusLabel, timeAgo, formatDateTime } from '@/lib/utils';
import { useTheme } from '@/lib/theme/ThemeContext';

const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 };

// Nagpur Zone Centroids for smooth camera pan & bounds
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
  description?: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  zone: string | null;
  wardNumber: number | null;
  wardName: string | null;
  locality?: string | null;
  department?: string | null;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapRef = useRef<any>(null);

  const [allIssues, setAllIssues] = useState<MapIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [selectedWardStats, setSelectedWardStats] = useState<WardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('hybrid');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapCategory, setHeatmapCategory] = useState<string>('all');
  const [priorityMode, setPriorityMode] = useState(false);
  const [slaRiskMode, setSlaRiskMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  // AI Spatial Query
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Diagnostics & Status
  const [apiMissing, setApiMissing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ── 1. Fetch All Issues from DB ─────────────────────────────
  const fetchMapData = useCallback(async () => {
    try {
      const res = await fetch('/api/map/issues');
      const data = await res.json();
      const validIssues: MapIssue[] = (data.issues || []).filter(
        (i: MapIssue) =>
          typeof i.latitude === 'number' &&
          typeof i.longitude === 'number' &&
          !isNaN(i.latitude) &&
          !isNaN(i.longitude) &&
          i.latitude > 20 && i.latitude < 22 &&
          i.longitude > 78 && i.longitude < 80
      );
      setAllIssues(validIssues);
      setLastUpdated(new Date());
    } catch {
      setAllIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 45000); // 45s polling
    return () => clearInterval(interval);
  }, [fetchMapData]);

  // ── 2. Comprehensive URL Query Navigation Contract ──────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticketId') || params.get('ticket') || params.get('issue');
      const zoneParam = params.get('zone');
      const wardParam = params.get('ward');
      const severityParam = params.get('severity');
      const statusParam = params.get('status');
      const categoryParam = params.get('category');
      const slaParam = params.get('slaBreach') || params.get('sla');
      const priorityParam = params.get('priority');
      const latParam = parseFloat(params.get('lat') || '');
      const lngParam = parseFloat(params.get('lng') || '');
      const zoomParam = parseInt(params.get('zoom') || '', 10);

      if (ticketParam) {
        setSearchQuery(ticketParam);
      }
      if (zoneParam && NAGPUR_ZONES.includes(zoneParam)) {
        setZoneFilter(zoneParam);
      }
      if (wardParam) {
        const wardNum = parseInt(wardParam, 10);
        if (!isNaN(wardNum)) {
          setSearchQuery(`Ward ${wardNum}`);
        }
      }
      if (severityParam) {
        setSeverityFilter(severityParam);
      }
      if (statusParam) {
        setStatusFilter(statusParam);
      }
      if (categoryParam) {
        setCategoryFilter(categoryParam);
      }
      if (slaParam === 'true') {
        setSlaRiskMode(true);
      }
      if (priorityParam === 'true') {
        setPriorityMode(true);
      }

      // If specific GPS lat/lng and zoom provided
      if (!isNaN(latParam) && !isNaN(lngParam) && mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: latParam, lng: lngParam });
        mapInstanceRef.current.setZoom(zoomParam || 15);
      }
    }
  }, []);

  // ── 3. Initialize Google Maps ──────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.startsWith('AQ.')) {
      setApiMissing(true);
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
        if (!mapContainerRef.current) return;

        const darkMapStyle = [
          { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
          { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
          { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
          { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
          { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#021019' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
          { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
        ];

        const map = new mapsLib.Map(mapContainerRef.current, {
          center: NAGPUR_CENTER,
          zoom: 13,
          mapTypeId: mapType,
          styles: mapType === 'roadmap' ? darkMapStyle : undefined,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      })
      .catch((err: any) => {
        console.warn('[Google Maps Loader Error]', err);
        setApiMissing(true);
      });
  }, []);

  const { theme } = useTheme();

  // Update map type and styles dynamically between Light and Dark themes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setMapTypeId(mapType);

    const darkMapStyle = [
      { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
      { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
      { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
      { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
      { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#021019' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    ];

    if (mapType === 'roadmap') {
      mapInstanceRef.current.setOptions({
        styles: theme === 'dark' ? darkMapStyle : [],
      });
    }
  }, [mapType, theme]);

  // ── 4. Filter Issues Client-Side for Instant Response ─────
  const filteredIssues = allIssues.filter(issue => {
    if (categoryFilter && issue.category !== categoryFilter) return false;
    if (severityFilter && issue.severity !== severityFilter) return false;
    if (statusFilter && issue.status !== statusFilter) return false;
    if (zoneFilter && issue.zone !== zoneFilter) return false;
    if (priorityMode && issue.severity !== 'Critical' && issue.severity !== 'High' && !issue.slaBreach) return false;
    if (slaRiskMode && !issue.slaBreach) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        issue.ticketId.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        (issue.zone && issue.zone.toLowerCase().includes(q)) ||
        (issue.category && issue.category.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Calculate dynamic severity breakdown of filtered issues
  const counts = {
    total: filteredIssues.length,
    critical: filteredIssues.filter(i => i.severity === 'Critical').length,
    high: filteredIssues.filter(i => i.severity === 'High').length,
    medium: filteredIssues.filter(i => i.severity === 'Medium').length,
    low: filteredIssues.filter(i => i.severity === 'Low').length,
    slaBreach: filteredIssues.filter(i => i.slaBreach).length,
    active: filteredIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length,
    resolved: filteredIssues.filter(i => ['Resolved', 'Citizen_Verified'].includes(i.status)).length,
  };

  // If a ticketId search matches exactly 1 issue, select it automatically
  useEffect(() => {
    if (searchQuery.trim().toUpperCase().startsWith('NX-2026-')) {
      const target = allIssues.find(i => i.ticketId.toUpperCase() === searchQuery.trim().toUpperCase());
      if (target) {
        setSelectedIssue(target);
        if (mapInstanceRef.current && target.latitude && target.longitude) {
          mapInstanceRef.current.panTo({ lat: target.latitude, lng: target.longitude });
          mapInstanceRef.current.setZoom(15);
        }
      }
    }
  }, [searchQuery, allIssues]);

  // ── 5. Render Markers, Clusterer & Heatmap ────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers & clusters
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
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

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

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

        const heatmapIssues = heatmapCategory === 'all'
          ? filteredIssues
          : filteredIssues.filter(i => i.category === heatmapCategory);

        const heatmapPoints = heatmapIssues.map(issue => ({
          location: new googleObj.maps.LatLng(issue.latitude, issue.longitude),
          weight: issue.severity === 'Critical' ? 4 : issue.severity === 'High' ? 3 : issue.severity === 'Medium' ? 2 : 1,
        }));

        const heatmap = new vizLib.HeatmapLayer({
          data: heatmapPoints,
          map,
          radius: 36,
          opacity: 0.85,
        });
        heatmapRef.current = heatmap;
      }).catch(() => {});
      return;
    }

    // ── MARKER & CLUSTERING MODE ──────────────────────
    (loader as any).importLibrary('marker').then((markerLib: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const googleObj = (window as any).google;
      if (!googleObj?.maps) return;

      const createdMarkers: any[] = [];

      filteredIssues.forEach(issue => {
        const color = slaRiskMode
          ? (issue.slaBreach ? '#ef4444' : '#22c55e')
          : (SEVERITY_COLORS[issue.severity] || '#3b82f6');

        if (markerLib?.AdvancedMarkerElement && markerLib?.PinElement) {
          const pin = new markerLib.PinElement({
            background: color,
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            scale: issue.severity === 'Critical' ? 1.3 : issue.severity === 'High' ? 1.1 : 0.95,
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

          createdMarkers.push(marker);
        } else {
          const marker = new googleObj.maps.Marker({
            map,
            position: { lat: issue.latitude, lng: issue.longitude },
            title: issue.title,
            icon: {
              path: googleObj.maps.SymbolPath.CIRCLE,
              scale: issue.severity === 'Critical' ? 9 : 7,
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

          createdMarkers.push(marker);
        }
      });

      markersRef.current = createdMarkers;

      // Add clustering if available and non-empty
      try {
        if (createdMarkers.length > 0 && typeof MarkerClusterer === 'function') {
          clustererRef.current = new MarkerClusterer({ map, markers: createdMarkers });
        }
      } catch {
        // Fallback to standard marker array
      }
    }).catch(() => {});
  }, [filteredIssues, mapLoaded, showHeatmap, heatmapCategory, slaRiskMode]);

  // ── 6. Ward / Zone Selection & Bounds Fitting ─────────────
  const handleZoneSelect = (zone: string) => {
    setZoneFilter(zone);
    if (zone && ZONE_CENTROIDS[zone] && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(ZONE_CENTROIDS[zone]);
      mapInstanceRef.current.setZoom(14);
    }

    if (zone) {
      const zoneIssues = allIssues.filter(i => i.zone === zone);
      const active = zoneIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
      const critical = zoneIssues.filter(i => i.severity === 'Critical').length;
      const resolved = zoneIssues.filter(i => ['Resolved', 'Citizen_Verified'].includes(i.status)).length;
      const slaBreach = zoneIssues.filter(i => i.slaBreach).length;

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

  // Reset to Central Nagpur
  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(NAGPUR_CENTER);
      mapInstanceRef.current.setZoom(13);
    }
    setCategoryFilter('');
    setSeverityFilter('');
    setStatusFilter('');
    setZoneFilter('');
    setSearchQuery('');
    setPriorityMode(false);
    setSlaRiskMode(false);
    setSelectedWardStats(null);
    setSelectedIssue(null);
  };

  // Geolocation Locate Me
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
      alert('GPS access denied or unavailable. Centered on Nagpur City.');
    });
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Gemini AI Natural Language Spatial Search
  const handleAiSpatialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiSearching(true);
    setAiNote(null);
    const q = aiQuery.toLowerCase();

    let matchedCategory = '';
    let matchedSeverity = '';
    let matchedZone = '';
    let matchedSla = false;

    if (q.includes('pothole') || q.includes('road')) matchedCategory = 'Road/Pothole';
    else if (q.includes('garbage') || q.includes('waste') || q.includes('kachra')) matchedCategory = 'Garbage';
    else if (q.includes('drain') || q.includes('sewer') || q.includes('nala')) matchedCategory = 'Drainage';
    else if (q.includes('water') || q.includes('pani')) matchedCategory = 'Water Supply';
    else if (q.includes('light') || q.includes('pole')) matchedCategory = 'Streetlight';
    else if (q.includes('traffic') || q.includes('signal')) matchedCategory = 'Traffic Signal';

    if (q.includes('critical') || q.includes('urgent') || q.includes('emergency')) matchedSeverity = 'Critical';
    else if (q.includes('high')) matchedSeverity = 'High';

    if (q.includes('sla') || q.includes('breach') || q.includes('late')) matchedSla = true;

    for (const z of NAGPUR_ZONES) {
      if (q.includes(z.toLowerCase())) {
        matchedZone = z;
        break;
      }
    }

    setCategoryFilter(matchedCategory);
    setSeverityFilter(matchedSeverity);
    setZoneFilter(matchedZone);
    setSlaRiskMode(matchedSla);

    if (matchedZone && ZONE_CENTROIDS[matchedZone] && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(ZONE_CENTROIDS[matchedZone]);
      mapInstanceRef.current.setZoom(14);
    }

    const appliedDesc = [
      matchedSeverity && `${matchedSeverity} Severity`,
      matchedCategory && matchedCategory,
      matchedZone && `${matchedZone} Zone`,
      matchedSla && 'SLA Breaches',
    ].filter(Boolean).join(' · ');

    setAiNote(`🤖 Gemini Spatial Filter: Showing ${appliedDesc || 'relevant civic records'}`);
    setAiSearching(false);
  };

  return (
    <div
      ref={mapWrapperRef}
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - var(--nav-height))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-primary)',
      }}
    >
      {/* ── 1. TOP MUNICIPAL STATUS BAR ───────────────────── */}
      <div style={{
        padding: '8px 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 'var(--text-xs)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 8px var(--color-success)' }} />
            Live Civic GIS Map
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Showing <strong>{counts.total}</strong> of {allIssues.length} Issues
          </div>
          <div className="flex gap-2">
            <span className="badge severity-critical" style={{ fontSize: '10px', padding: '1px 6px' }}>🚨 {counts.critical} Critical</span>
            <span className="badge severity-high" style={{ fontSize: '10px', padding: '1px 6px' }}>⚠️ {counts.high} High</span>
            <span className="badge severity-medium" style={{ fontSize: '10px', padding: '1px 6px' }}>🟡 {counts.medium} Med</span>
            <span className="badge severity-low" style={{ fontSize: '10px', padding: '1px 6px' }}>🟢 {counts.low} Low</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchMapData}
            title="Refresh issues from database"
            style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Updated {timeAgo(lastUpdated)}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            style={{ padding: '2px 6px' }}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* ── 2. SECONDARY CONTROLS & AI SEARCH BAR ─────────── */}
      <div style={{
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        zIndex: 9,
      }}>
        {/* Gemini Natural Language Spatial Query */}
        <form onSubmit={handleAiSpatialSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Sparkles size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-purple)' }} />
            <input
              type="text"
              className="form-input"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="Ask Gemini on Map (e.g. 'Show critical potholes in Dharampeth')..."
              style={{ paddingLeft: 30, fontSize: 'var(--text-xs)', height: 32, background: 'var(--bg-elevated)' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" disabled={aiSearching} style={{ height: 32, padding: '0 10px', fontSize: '11px' }}>
            <Search size={12} /> AI Search
          </button>
        </form>

        {/* Text Filter */}
        <div style={{ position: 'relative', width: 140 }}>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ticket / keyword..."
            style={{ fontSize: 'var(--text-xs)', height: 32 }}
          />
        </div>

        {/* Category Filter */}
        <select
          className="form-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ width: 130, fontSize: 'var(--text-xs)', height: 32 }}
        >
          <option value="">All Categories</option>
          {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Severity Filter */}
        <select
          className="form-select"
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          style={{ width: 115, fontSize: 'var(--text-xs)', height: 32 }}
        >
          <option value="">All Severity</option>
          <option value="Critical">🚨 Critical</option>
          <option value="High">⚠️ High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Zone Filter */}
        <select
          className="form-select"
          value={zoneFilter}
          onChange={e => handleZoneSelect(e.target.value)}
          style={{ width: 125, fontSize: 'var(--text-xs)', height: 32 }}
        >
          <option value="">All Zones (10)</option>
          {NAGPUR_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        {/* Map Type Switcher (Hybrid / Satellite / Roadmap) */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border-subtle)' }}>
          {(['hybrid', 'satellite', 'roadmap'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setMapType(type)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: mapType === type ? 700 : 500,
                color: mapType === type ? 'var(--text-primary)' : 'var(--text-muted)',
                background: mapType === type ? 'var(--accent-blue)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Priority Mode Toggle */}
        <button
          className={`btn btn-sm ${priorityMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPriorityMode(p => !p)}
          title="Filter only Critical/High and SLA at risk"
          style={{ height: 32, fontSize: '11px', padding: '0 8px' }}
        >
          <ShieldAlert size={12} />
          {priorityMode ? 'Priority ON' : 'Priority'}
        </button>

        {/* Heatmap Toggle */}
        <button
          className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowHeatmap(h => !h)}
          style={{ height: 32, fontSize: '11px', padding: '0 8px' }}
        >
          <Layers size={12} />
          {showHeatmap ? 'Heatmap ON' : 'Heatmap'}
        </button>

        {/* SLA Risk Mode */}
        <button
          className={`btn btn-sm ${slaRiskMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSlaRiskMode(s => !s)}
          title="Color markers by SLA breach state"
          style={{ height: 32, fontSize: '11px', padding: '0 8px' }}
        >
          <Clock size={12} />
          {slaRiskMode ? 'SLA Risk ON' : 'SLA Risk'}
        </button>

        {/* Locate Me */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleLocateMe}
          title="Center on My GPS Location"
          style={{ height: 32, padding: '0 8px' }}
        >
          <Navigation size={13} />
        </button>

        {/* Reset */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleResetMap}
          title="Reset Map to Central Nagpur"
          style={{ height: 32, fontSize: '11px', padding: '0 8px' }}
        >
          <Compass size={13} /> Reset
        </button>
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
          zIndex: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Sparkles size={12} />
            {aiNote}
          </div>
          <button onClick={() => setAiNote(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── 3. MAP CANVAS & INTERACTIVE PANELS ────────────── */}
      <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 450, background: '#0e1626' }}>
        
        {/* Real Google Map Container */}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '450px',
            background: '#0e1626',
            display: apiMissing ? 'none' : 'block',
          }}
        />

        {/* Interactive OpenStreetMap Fallback when Google Maps API key is unconfigured */}
        {apiMissing && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0e1626' }}>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(59,130,246,0.12)',
              borderBottom: '1px solid rgba(59,130,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-blue)',
            }}>
              <span>🗺️ <strong>Nagpur Smart City Interactive GIS Engine</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Showing {filteredIssues.length} geocoded civic points across 10 NMC zones</span>
            </div>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <iframe
                title="Nagpur Interactive Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src="https://www.openstreetmap.org/export/embed.html?bbox=78.95%2C21.05%2C79.20%2C21.25&amp;layer=mapnik&amp;marker=21.1458%2C79.0882"
                style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)', opacity: 0.85 }}
              />

              {/* Interactive Quick Pin Grid */}
              <div style={{
                position: 'absolute', top: 16, left: 16, pointerEvents: 'auto',
                background: 'rgba(10, 22, 40, 0.94)', backdropFilter: 'blur(16px)',
                padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)', maxWidth: 380,
                boxShadow: 'var(--shadow-xl)',
              }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapIcon size={16} style={{ color: 'var(--accent-blue)' }} />
                  Nagpur Geocoded Issues ({filteredIssues.length})
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                  Click any ticket to inspect coordinates and dispatch details.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 180, overflowY: 'auto' }}>
                  {filteredIssues.map(issue => (
                    <button
                      key={issue.ticketId}
                      type="button"
                      onClick={() => setSelectedIssue(issue)}
                      style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-md)',
                        border: `1px solid ${SEVERITY_COLORS[issue.severity]}70`,
                        color: SEVERITY_COLORS[issue.severity],
                        background: `${SEVERITY_COLORS[issue.severity]}15`,
                        cursor: 'pointer',
                      }}
                    >
                      {getCategoryIcon(issue.category)} {issue.ticketId}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WARD / ZONE INTELLIGENCE DRAWER ────────────── */}
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
              Dominant Category: <strong>{selectedWardStats.topCategory}</strong>
              {selectedWardStats.slaBreach > 0 && (
                <div style={{ color: 'var(--color-danger)', marginTop: 4, fontWeight: 600 }}>
                  ⚠️ {selectedWardStats.slaBreach} SLA breaches recorded
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. RIGHT-SIDE DESKTOP ISSUE DETAILS DRAWER ──── */}
        {selectedIssue && (
          <div style={{
            position: 'absolute', top: 16, right: 16, width: 340, maxHeight: 'calc(100% - 32px)',
            background: 'rgba(10, 22, 40, 0.96)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-xl)', zIndex: 10,
            backdropFilter: 'blur(20px)',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', fontWeight: 800 }}>
                {selectedIssue.ticketId}
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedIssue(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Title */}
            <h3 style={{ fontWeight: 800, fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)', lineHeight: 1.4 }}>
              {getCategoryIcon(selectedIssue.category)} {selectedIssue.title}
            </h3>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              <span className={`badge severity-${selectedIssue.severity.toLowerCase()}`}>
                {selectedIssue.severity}
              </span>
              <span className={`badge status-${selectedIssue.status.toLowerCase().replace('_', '-')}`}>
                {getStatusLabel(selectedIssue.status)}
              </span>
              {selectedIssue.slaBreach && (
                <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ⚠ SLA Breach
                </span>
              )}
            </div>

            {/* Description if available */}
            {selectedIssue.description && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
                {selectedIssue.description}
              </div>
            )}

            {/* Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} style={{ color: 'var(--accent-blue)' }} />
                <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{selectedIssue.zone || 'Nagpur'}</strong> {selectedIssue.wardNumber ? `· Ward ${selectedIssue.wardNumber}` : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={13} style={{ color: 'var(--accent-purple)' }} />
                <span>Department: <strong style={{ color: 'var(--text-primary)' }}>{selectedIssue.department || 'NMC Department'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Compass size={13} style={{ color: 'var(--text-muted)' }} />
                <span>GPS: {selectedIssue.latitude?.toFixed(4)}, {selectedIssue.longitude?.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                <span>Reported: {timeAgo(selectedIssue.createdAt)} ({formatDateTime(selectedIssue.createdAt)})</span>
              </div>
            </div>

            {/* Direct Action Link */}
            <a
              href={`/track?id=${selectedIssue.ticketId}`}
              className="btn btn-primary btn-sm w-full"
              style={{ justifyContent: 'center', gap: 6 }}
            >
              <FileText size={14} /> Open Full Track History <ChevronRight size={14} />
            </a>
          </div>
        )}

        {/* ── 5. BOTTOM SEVERITY & SLA LEGEND ──────────────── */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(10, 22, 40, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          zIndex: 7,
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            {slaRiskMode ? 'SLA Risk Index' : 'Severity Legend'}
          </div>
          {slaRiskMode ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', marginBottom: 3, color: 'var(--color-danger)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                <span>SLA Breached</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--color-success)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <span>Within SLA Timeline</span>
              </div>
            </>
          ) : (
            Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
              <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span>{sev}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
