'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {
  Layers, Map as MapIcon, X, Navigation, Search,
  Sparkles, AlertTriangle, CheckCircle, Clock, Building,
  Compass, ShieldAlert, BarChart3, Maximize,
  Minimize, RefreshCw, AlertCircle, FileText, Tag, MapPin,
  ExternalLink, ChevronRight, Eye, Phone, Share2
} from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_LIST, NAGPUR_ZONES, getCategoryIcon, getStatusLabel, timeAgo, formatDateTime } from '@/lib/utils';
import { useTheme } from '@/lib/theme/ThemeContext';

const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 };

// Nagpur Zone Centroids for smooth camera pan & bounds
const ZONE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Dharampeth':   { lat: 21.1385, lng: 79.0730 },
  'Laxmi Nagar':  { lat: 21.1467, lng: 79.1050 },
  'Hanuman Nagar':{ lat: 21.1238, lng: 79.0942 },
  'Dhantoli':     { lat: 21.1280, lng: 79.0820 },
  'Nehru Nagar':  { lat: 21.1560, lng: 79.0975 },
  'Gandhibagh':   { lat: 21.1460, lng: 79.0820 },
  'Satranjipura': { lat: 21.1620, lng: 79.0680 },
  'Lakadganj':    { lat: 21.1340, lng: 79.1180 },
  'Ashi Nagar':   { lat: 21.1150, lng: 79.1060 },
  'Mangalwari':   { lat: 21.1520, lng: 79.0910 },
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
  imageUrl?: string | null;
}

interface SpatialCluster {
  id: string;
  name: string;
  centroid: { lat: number; lng: number };
  radiusMeters: number;
  issueCount: number;
  dominantCategory: string;
  dominantSeverity: string;
  zone: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface NearMeItem {
  ticketId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  locality: string | null;
  latitude: number;
  longitude: number;
  distanceFormatted: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterCirclesRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);

  const { theme } = useTheme();

  // Data states
  const [allIssues, setAllIssues] = useState<MapIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet' | 'loading'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Map Controls & Modes
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap'>('hybrid');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [spatialClusters, setSpatialClusters] = useState<SpatialCluster[]>([]);
  const [slaRiskMode, setSlaRiskMode] = useState(false);
  const [priorityMode, setPriorityMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Radar / Near Me
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [radarIssues, setRadarIssues] = useState<NearMeItem[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');

  // AI Prompt Bar
  const [aiNote, setAiNote] = useState<string | null>(null);

  // ── 1. Fetch All Issues from Database ───────────────────────
  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/map/issues');
      const data = await res.json();
      const validIssues: MapIssue[] = (data.issues || []).filter(
        (i: MapIssue) =>
          typeof i.latitude === 'number' &&
          typeof i.longitude === 'number' &&
          !isNaN(i.latitude) &&
          !isNaN(i.longitude)
      );
      setAllIssues(validIssues);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[NagariX Map Data Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // ── 2. Filter Issues Client-Side ────────────────────────────
  const filteredIssues = useMemo(() => {
    return allIssues.filter(issue => {
      if (categoryFilter && issue.category !== categoryFilter) return false;
      if (severityFilter && issue.severity !== severityFilter) return false;
      if (statusFilter && issue.status !== statusFilter) return false;
      if (zoneFilter && issue.zone !== zoneFilter) return false;
      if (wardFilter && String(issue.wardNumber) !== wardFilter) return false;
      if (priorityMode && issue.severity !== 'Critical' && issue.severity !== 'High' && !issue.slaBreach) return false;
      if (slaRiskMode && !issue.slaBreach) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          issue.ticketId.toLowerCase().includes(q) ||
          issue.title.toLowerCase().includes(q) ||
          (issue.zone && issue.zone.toLowerCase().includes(q)) ||
          (issue.wardName && issue.wardName.toLowerCase().includes(q)) ||
          (issue.category && issue.category.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [allIssues, categoryFilter, severityFilter, statusFilter, zoneFilter, wardFilter, priorityMode, slaRiskMode, searchQuery]);

  // Dynamic Statistics
  const counts = useMemo(() => ({
    total: filteredIssues.length,
    critical: filteredIssues.filter(i => i.severity === 'Critical').length,
    high: filteredIssues.filter(i => i.severity === 'High').length,
    medium: filteredIssues.filter(i => i.severity === 'Medium').length,
    low: filteredIssues.filter(i => i.severity === 'Low').length,
    slaBreach: filteredIssues.filter(i => i.slaBreach).length,
    active: filteredIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length,
  }), [filteredIssues]);

  // ── 3. Instant Spot Focus Function ──────────────────────────
  const focusOnSpot = useCallback((lat: number, lng: number, zoomLevel = 16, targetIssue?: MapIssue) => {
    if (targetIssue) {
      setSelectedIssue(targetIssue);
    }
    if (mapInstanceRef.current && mapEngine === 'google') {
      mapInstanceRef.current.panTo({ lat, lng });
      mapInstanceRef.current.setZoom(zoomLevel);
    } else if (leafletMapRef.current && mapEngine === 'leaflet') {
      leafletMapRef.current.flyTo([lat, lng], zoomLevel, { animate: true, duration: 1.2 });
    }
  }, [mapEngine]);

  // ── 4. URL Query Navigation Contract ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticketId') || params.get('ticket') || params.get('issue');
    const zoneParam = params.get('zone');
    const wardParam = params.get('ward');
    const severityParam = params.get('severity');
    const statusParam = params.get('status');
    const categoryParam = params.get('category');
    const slaParam = params.get('slaBreach') || params.get('sla');
    const latParam = parseFloat(params.get('lat') || '');
    const lngParam = parseFloat(params.get('lng') || '');
    const zoomParam = parseInt(params.get('zoom') || '', 10);

    if (ticketParam) {
      setSearchQuery(ticketParam);
      const target = allIssues.find(i => i.ticketId.toUpperCase() === ticketParam.toUpperCase());
      if (target && target.latitude && target.longitude) {
        focusOnSpot(target.latitude, target.longitude, 16, target);
      }
    }
    if (zoneParam && NAGPUR_ZONES.includes(zoneParam)) {
      setZoneFilter(zoneParam);
      if (ZONE_CENTROIDS[zoneParam]) {
        focusOnSpot(ZONE_CENTROIDS[zoneParam].lat, ZONE_CENTROIDS[zoneParam].lng, 14);
      }
    }
    if (wardParam) {
      setWardFilter(wardParam);
    }
    if (severityParam) setSeverityFilter(severityParam);
    if (statusParam) setStatusFilter(statusParam);
    if (categoryParam) setCategoryFilter(categoryParam);
    if (slaParam === 'true') setSlaRiskMode(true);

    if (!isNaN(latParam) && !isNaN(lngParam)) {
      focusOnSpot(latParam, lngParam, zoomParam || 15);
    }
  }, [allIssues, focusOnSpot]);

  // ── 5. Initialize Dual-Engine GIS Map (Google + Leaflet Failover) ──
  useEffect(() => {
    let isCancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.startsWith('AQ.')) {
      // Initialize Leaflet Engine as Fallback
      initLeafletMap();
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['maps', 'marker', 'visualization'],
    });

    (loader as any).load().then(() => {
      if (isCancelled || !mapContainerRef.current) return;

      const darkMapStyle = [
        { elementType: 'geometry', stylers: [{ color: '#0d192e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#050814' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e3a8a' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030712' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      ];

      const map = new google.maps.Map(mapContainerRef.current, {
        center: NAGPUR_CENTER,
        zoom: 13,
        mapTypeId: mapType,
        styles: theme === 'dark' && mapType === 'roadmap' ? darkMapStyle : [],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      });

      mapInstanceRef.current = map;
      setMapEngine('google');
    }).catch((err: unknown) => {
      console.warn('[Google Maps Loader Failover → Launching Leaflet Engine]:', err);
      if (!isCancelled) initLeafletMap();
    });

    function initLeafletMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Dynamically load Leaflet CSS & JS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        if (!L || !mapContainerRef.current) return;

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
        }

        const map = L.map(mapContainerRef.current, {
          center: [NAGPUR_CENTER.lat, NAGPUR_CENTER.lng],
          zoom: 13,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Dark or light styled tile layers
        const tileUrl = theme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        }).addTo(map);

        leafletMapRef.current = map;
        setMapEngine('leaflet');
      };
      document.body.appendChild(script);
    }

    return () => {
      isCancelled = true;
    };
  }, [theme]);

  // ── 6. Render Markers on Active Engine (Google or Leaflet) ──
  useEffect(() => {
    if (mapEngine === 'google' && mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      // Clear existing markers & clusters
      if (clustererRef.current) clustererRef.current.clearMarkers();
      markersRef.current.forEach(m => {
        if (typeof m.setMap === 'function') m.setMap(null);
      });
      markersRef.current = [];

      // Clear heatmap
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }

      // Heatmap Layer
      if (showHeatmap && window.google?.maps?.visualization) {
        const heatmapPoints = filteredIssues.map(i => ({
          location: new google.maps.LatLng(i.latitude, i.longitude),
          weight: i.severity === 'Critical' ? 4 : i.severity === 'High' ? 3 : 2,
        }));
        const viz = window.google.maps.visualization as any;
        const heatmap = new viz.HeatmapLayer({
          data: heatmapPoints,
          map,
          radius: 36,
          opacity: 0.85,
        });
        heatmapRef.current = heatmap;
        return;
      }

      // Pin Markers
      const createdMarkers: google.maps.Marker[] = [];
      filteredIssues.forEach(issue => {
        const isSelected = selectedIssue?.ticketId === issue.ticketId;
        const color = slaRiskMode
          ? (issue.slaBreach ? '#ef4444' : '#22c55e')
          : (SEVERITY_COLORS[issue.severity] || '#f97316');

        const svgPin = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 36 : 26}" height="${isSelected ? 46 : 34}" viewBox="0 0 24 32">
            <path fill="${color}" stroke="#ffffff" stroke-width="${isSelected ? 2.5 : 1.5}" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"/>
            <circle cx="12" cy="12" r="5" fill="#ffffff"/>
            ${issue.severity === 'Critical' ? '<circle cx="12" cy="12" r="2.5" fill="#ef4444"/>' : ''}
          </svg>
        `;

        const marker = new google.maps.Marker({
          position: { lat: issue.latitude, lng: issue.longitude },
          map,
          title: `${issue.ticketId}: ${issue.title}`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgPin)}`,
            scaledSize: new google.maps.Size(isSelected ? 36 : 26, isSelected ? 46 : 34),
            anchor: new google.maps.Point(isSelected ? 18 : 13, isSelected ? 46 : 34),
          },
          zIndex: isSelected ? 999 : issue.severity === 'Critical' ? 100 : 10,
        });

        marker.addListener('click', () => {
          setSelectedIssue(issue);
          focusOnSpot(issue.latitude, issue.longitude, 16, issue);
        });

        createdMarkers.push(marker);
      });

      markersRef.current = createdMarkers;

      // Group into Clusterer
      if (!showHeatmap && createdMarkers.length > 0) {
        clustererRef.current = new MarkerClusterer({
          map,
          markers: createdMarkers,
        });
      }
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L) return;
      const map = leafletMapRef.current;

      // Clear old leaflet markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      filteredIssues.forEach(issue => {
        const isSelected = selectedIssue?.ticketId === issue.ticketId;
        const color = slaRiskMode
          ? (issue.slaBreach ? '#ef4444' : '#22c55e')
          : (SEVERITY_COLORS[issue.severity] || '#f97316');

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="width:${isSelected ? 28 : 18}px;height:${isSelected ? 28 : 18}px;border-radius:50%;background:${color};border:2px solid #ffffff;box-shadow:0 0 12px ${color};cursor:pointer;"></div>`,
          iconSize: [isSelected ? 28 : 18, isSelected ? 28 : 18],
          iconAnchor: [isSelected ? 14 : 9, isSelected ? 14 : 9],
        });

        const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedIssue(issue);
          focusOnSpot(issue.latitude, issue.longitude, 16, issue);
        });

        markersRef.current.push(marker);
      });
    }
  }, [mapEngine, filteredIssues, selectedIssue, showHeatmap, slaRiskMode, focusOnSpot]);

  // ── 7. Render Spatial Clusters Circles ──────────────────────
  const toggleClustersLayer = async () => {
    if (!showClusters) {
      try {
        const res = await fetch('/api/analytics/spatial/clusters');
        const json = await res.json();
        setSpatialClusters(json.clusters || []);
      } catch (e) {
        console.error(e);
      }
    }
    setShowClusters(prev => !prev);
  };

  // ── 8. Civic Radar / Near Me Handler ────────────────────────
  const handleCivicRadar = () => {
    setShowRadarModal(true);
    setRadarLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        focusOnSpot(latitude, longitude, 15);

        try {
          const res = await fetch(`/api/analytics/spatial/near-me?lat=${latitude}&lng=${longitude}&radius=3.5`);
          const json = await res.json();
          setRadarIssues(json.nearbyIssues || []);
        } catch {
          // Fallback
        } finally {
          setRadarLoading(false);
        }
      }, async () => {
        const res = await fetch('/api/analytics/spatial/near-me?radius=3.5');
        const json = await res.json();
        setRadarIssues(json.nearbyIssues || []);
        setRadarLoading(false);
      });
    } else {
      setRadarLoading(false);
    }
  };

  // Reset Map View
  const handleReset = () => {
    focusOnSpot(NAGPUR_CENTER.lat, NAGPUR_CENTER.lng, 13);
    setSearchQuery('');
    setCategoryFilter('');
    setSeverityFilter('');
    setStatusFilter('');
    setZoneFilter('');
    setWardFilter('');
    setPriorityMode(false);
    setSlaRiskMode(false);
    setShowHeatmap(false);
    setShowClusters(false);
    setSelectedIssue(null);
  };

  return (
    <div
      ref={mapWrapperRef}
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - var(--nav-height))',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── TOP LUXURY GLASSMORPHIC STATUS BAR ───────────────── */}
      <div className="glass-panel" style={{
        margin: '8px 12px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 'var(--text-sm)', color: 'var(--accent-orange)', letterSpacing: '0.04em' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 10px var(--color-success)' }} />
            NAGPUR CIVIC GIS COMMAND MAP
          </div>

          <div className="glass-pill">
            <span>Showing</span>
            <strong style={{ color: 'var(--accent-orange)' }}>{counts.total}</strong>
            <span>of {allIssues.length} Complaints</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge severity-critical" style={{ fontSize: '10px', padding: '2px 8px' }}>🚨 {counts.critical} Critical</span>
            <span className="badge severity-high" style={{ fontSize: '10px', padding: '2px 8px' }}>⚠️ {counts.high} High</span>
            <span className="badge severity-medium" style={{ fontSize: '10px', padding: '2px 8px' }}>🟡 {counts.medium} Med</span>
            <span className="badge severity-low" style={{ fontSize: '10px', padding: '2px 8px' }}>🟢 {counts.low} Low</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchMapData} title="Refresh database records" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Updated {timeAgo(lastUpdated)}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* ── SECONDARY CONTROLS & FILTER BAR ─────────────────── */}
      <div className="glass-panel" style={{
        margin: '0 12px 8px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        zIndex: 20,
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ticket, road, ward..."
            style={{ paddingLeft: 30, height: 32, fontSize: '11px' }}
          />
        </div>

        {/* Category Filter */}
        <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ height: 32, fontSize: '11px', width: 130 }}>
          <option value="">All Categories</option>
          {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Severity Filter */}
        <select className="form-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ height: 32, fontSize: '11px', width: 110 }}>
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
          onChange={e => {
            const z = e.target.value;
            setZoneFilter(z);
            if (z && ZONE_CENTROIDS[z]) {
              focusOnSpot(ZONE_CENTROIDS[z].lat, ZONE_CENTROIDS[z].lng, 14);
            }
          }}
          style={{ height: 32, fontSize: '11px', width: 125 }}
        >
          <option value="">All 10 Zones</option>
          {NAGPUR_ZONES.map(z => <option key={z} value={z}>{z} Zone</option>)}
        </select>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border-subtle)' }}>
          {(['hybrid', 'satellite', 'roadmap'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setMapType(mode);
                if (mapInstanceRef.current && mapEngine === 'google') {
                  mapInstanceRef.current.setMapTypeId(mode);
                }
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: mapType === mode ? 800 : 500,
                color: mapType === mode ? '#ffffff' : 'var(--text-muted)',
                background: mapType === mode ? 'var(--accent-orange)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Toggle Heatmap */}
        <button
          className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{ height: 32, fontSize: '11px', padding: '0 10px' }}
        >
          <Layers size={12} />
          {showHeatmap ? 'Heatmap ON' : 'Heatmap'}
        </button>

        {/* Toggle Clusters */}
        <button
          className={`btn btn-sm ${showClusters ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleClustersLayer}
          style={{ height: 32, fontSize: '11px', padding: '0 10px' }}
        >
          <AlertCircle size={12} />
          {showClusters ? 'Clusters ON' : 'Clusters'}
        </button>

        {/* Toggle SLA Risk */}
        <button
          className={`btn btn-sm ${slaRiskMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSlaRiskMode(!slaRiskMode)}
          style={{ height: 32, fontSize: '11px', padding: '0 10px' }}
        >
          <Clock size={12} />
          {slaRiskMode ? 'SLA Risk ON' : 'SLA Risk'}
        </button>

        {/* Civic Radar / Near Me */}
        <button
          className="btn btn-sm"
          onClick={handleCivicRadar}
          style={{ height: 32, fontSize: '11px', padding: '0 12px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#ffffff', fontWeight: 800 }}
        >
          <Navigation size={12} />
          Near Me (GPS)
        </button>

        {/* Reset View */}
        <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{ height: 32, fontSize: '11px' }}>
          <Compass size={12} /> Reset
        </button>
      </div>

      {/* ── MAP CANVAS CONTAINER ─────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

        {/* ── GLASSMORPHIC INSPECTOR DRAWER (TICKET INSPECT) ──── */}
        {selectedIssue && (
          <div className="glass-modal animate-slide-up" style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 'min(420px, calc(100vw - 40px))',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            zIndex: 30,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--accent-orange)' }}>
                  {selectedIssue.ticketId}
                </div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginTop: 2, color: 'var(--text-primary)' }}>
                  {getCategoryIcon(selectedIssue.category)} {selectedIssue.title}
                </h3>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge severity-${selectedIssue.severity.toLowerCase()}`}>{selectedIssue.severity}</span>
              <span className={`badge status-${selectedIssue.status.toLowerCase().replace('_', '-')}`}>{getStatusLabel(selectedIssue.status)}</span>
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{selectedIssue.category}</span>
              {selectedIssue.slaBreach && (
                <span className="badge" style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--color-danger)', fontWeight: 800 }}>⚠ SLA BREACH</span>
              )}
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Zone / Ward:</strong> {selectedIssue.zone || 'Nagpur'} {selectedIssue.wardNumber ? `(Ward ${selectedIssue.wardNumber})` : ''}</div>
              <div><strong>Department:</strong> {selectedIssue.department || 'NMC Municipal Works'}</div>
              <div><strong>Reported:</strong> {timeAgo(selectedIssue.createdAt)} ({formatDateTime(selectedIssue.createdAt)})</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/track?id=${selectedIssue.ticketId}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <FileText size={13} /> Track Lifecycle
              </Link>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => focusOnSpot(selectedIssue.latitude, selectedIssue.longitude, 18, selectedIssue)}
                title="Zoom in close"
              >
                <Maximize size={13} /> Focus
              </button>
            </div>
          </div>
        )}

        {/* ── CIVIC RADAR PROXIMITY MODAL ─────────────────────── */}
        {showRadarModal && (
          <div className="glass-modal animate-slide-up" style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 'min(380px, calc(100vw - 40px))',
            maxHeight: 'calc(100% - 40px)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--accent-orange)' }}>
                <Navigation size={14} /> Civic Radar (Near Me)
              </div>
              <button onClick={() => setShowRadarModal(false)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {radarLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <div className="loading-spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />
                Computing geodesic distances via Turf.js...
              </div>
            ) : radarIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                No active complaints detected within 3.5 km.
              </div>
            ) : (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340 }}>
                {radarIssues.map(issue => (
                  <div
                    key={issue.ticketId}
                    onClick={() => {
                      const fullIssue = allIssues.find(i => i.ticketId === issue.ticketId);
                      focusOnSpot(issue.latitude, issue.longitude, 17, fullIssue);
                    }}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-orange)' }}>{issue.ticketId}</span>
                      <span className="badge" style={{ fontSize: '10px', background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)' }}>
                        {issue.distanceFormatted}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
                      {getCategoryIcon(issue.category)} {issue.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
