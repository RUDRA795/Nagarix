import { prisma } from '@/lib/prisma';
import * as turf from '@turf/turf';

export interface SpatialCluster {
  id: string;
  name: string;
  centroid: { lat: number; lng: number };
  radiusMeters: number;
  issueCount: number;
  dominantCategory: string;
  dominantSeverity: string;
  zone: string;
  wardNumbers: number[];
  issues: Array<{ ticketId: string; title: string; category: string; severity: string; status: string; lat: number; lng: number }>;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface RecurringProblem {
  id: string;
  category: string;
  locality: string;
  zone: string;
  centroid: { lat: number; lng: number };
  issueCount: number;
  recurrenceScore: number; // 0 to 100
  firstReported: string;
  latestReported: string;
  explanation: string;
  tickets: string[];
}

export interface CrossDeptConflict {
  id: string;
  locationName: string;
  centroid: { lat: number; lng: number };
  departments: string[];
  categories: string[];
  issueCount: number;
  potentialCause: string;
  coordinationRecommendation: string;
  tickets: string[];
}

export interface NearMeResult {
  ticketId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  locality: string | null;
  zone: string | null;
  wardNumber: number | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  distanceFormatted: string;
}

// ── 1. GEOGRAPHIC ISSUE CLUSTERING (Incident Zones) ─────────
export async function getSpatialClusters(): Promise<SpatialCluster[]> {
  const issues = await prisma.civicIssue.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      status: { notIn: ['Resolved', 'Citizen_Verified'] },
    },
    select: {
      id: true, ticketId: true, title: true, category: true,
      severity: true, status: true, latitude: true, longitude: true,
      zone: true, wardNumber: true, locality: true,
    },
  });

  if (issues.length === 0) return [];

  // Group into geographic clusters within ~600m radius
  const clusters: SpatialCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < issues.length; i++) {
    const root = issues[i];
    if (visited.has(root.id) || root.latitude === null || root.longitude === null) continue;

    const clusterIssues = [root];
    visited.add(root.id);
    const rootPoint = turf.point([root.longitude, root.latitude]);

    for (let j = i + 1; j < issues.length; j++) {
      const candidate = issues[j];
      if (visited.has(candidate.id) || candidate.latitude === null || candidate.longitude === null) continue;

      const candPoint = turf.point([candidate.longitude, candidate.latitude]);
      const distKm = turf.distance(rootPoint, candPoint, { units: 'kilometers' });

      if (distKm <= 0.65) { // within 650m
        clusterIssues.push(candidate);
        visited.add(candidate.id);
      }
    }

    if (clusterIssues.length >= 2) {
      // Calculate cluster centroid
      const points = turf.featureCollection(
        clusterIssues.map(ci => turf.point([ci.longitude!, ci.latitude!]))
      );
      const center = turf.center(points);
      const centerLng = center.geometry.coordinates[0];
      const centerLat = center.geometry.coordinates[1];

      // Calculate max radius
      let maxDistMeters = 200;
      clusterIssues.forEach(ci => {
        const d = turf.distance(center, turf.point([ci.longitude!, ci.latitude!]), { units: 'kilometers' }) * 1000;
        if (d > maxDistMeters) maxDistMeters = Math.round(d);
      });

      // Dominant category
      const catCount: Record<string, number> = {};
      const sevCount: Record<string, number> = {};
      const wards: Set<number> = new Set();

      clusterIssues.forEach(ci => {
        catCount[ci.category] = (catCount[ci.category] || 0) + 1;
        sevCount[ci.severity] = (sevCount[ci.severity] || 0) + 1;
        if (ci.wardNumber) wards.add(ci.wardNumber);
      });

      const dominantCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      const hasCritical = clusterIssues.some(ci => ci.severity === 'Critical');
      const hasHigh = clusterIssues.some(ci => ci.severity === 'High');

      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        name: `${root.locality || root.zone || 'Nagpur'} Incident Cluster`,
        centroid: { lat: centerLat, lng: centerLng },
        radiusMeters: maxDistMeters + 50,
        issueCount: clusterIssues.length,
        dominantCategory,
        dominantSeverity: hasCritical ? 'Critical' : hasHigh ? 'High' : 'Medium',
        zone: root.zone || 'Nagpur Central',
        wardNumbers: Array.from(wards),
        issues: clusterIssues.map(ci => ({
          ticketId: ci.ticketId,
          title: ci.title,
          category: ci.category,
          severity: ci.severity,
          status: ci.status,
          lat: ci.latitude!,
          lng: ci.longitude!,
        })),
        riskLevel: hasCritical ? 'Critical' : hasHigh ? 'High' : 'Medium',
      });
    }
  }

  return clusters.sort((a, b) => b.issueCount - a.issueCount);
}

// ── 2. RECURRING PROBLEM DETECTOR ───────────────────────────
export async function getRecurringProblems(): Promise<RecurringProblem[]> {
  const issues = await prisma.civicIssue.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, ticketId: true, category: true, severity: true,
      latitude: true, longitude: true, locality: true, zone: true,
      createdAt: true,
    },
  });

  const recurringList: RecurringProblem[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < issues.length; i++) {
    const root = issues[i];
    if (visited.has(root.id) || root.latitude === null || root.longitude === null) continue;

    const matched = [root];
    visited.add(root.id);
    const rootPoint = turf.point([root.longitude, root.latitude]);

    for (let j = i + 1; j < issues.length; j++) {
      const candidate = issues[j];
      if (visited.has(candidate.id) || candidate.latitude === null || candidate.longitude === null) continue;

      // Must share same category and be within 400m
      if (candidate.category === root.category) {
        const candPoint = turf.point([candidate.longitude, candidate.latitude]);
        const distKm = turf.distance(rootPoint, candPoint, { units: 'kilometers' });

        if (distKm <= 0.45) { // within 450m
          matched.push(candidate);
          visited.add(candidate.id);
        }
      }
    }

    if (matched.length >= 2) {
      const firstDate = matched[0].createdAt;
      const latestDate = matched[matched.length - 1].createdAt;
      const spanDays = Math.max(1, Math.round((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Recurrence score formula: (count * 15) + (severity bonus) - (span decay)
      const hasCritical = matched.some(m => m.severity === 'Critical');
      const hasHigh = matched.some(m => m.severity === 'High');
      const score = Math.min(98, Math.max(40, Math.round((matched.length * 20) + (hasCritical ? 25 : hasHigh ? 15 : 5))));

      recurringList.push({
        id: `rec-${recurringList.length + 1}`,
        category: root.category,
        locality: root.locality || root.zone || 'Nagpur Ward',
        zone: root.zone || 'Central Zone',
        centroid: { lat: root.latitude, lng: root.longitude },
        issueCount: matched.length,
        recurrenceScore: score,
        firstReported: firstDate.toISOString(),
        latestReported: latestDate.toISOString(),
        explanation: `${matched.length} repeated ${root.category} complaints registered within 400m over a ${spanDays}-day span.`,
        tickets: matched.map(m => m.ticketId),
      });
    }
  }

  return recurringList.sort((a, b) => b.recurrenceScore - a.recurrenceScore);
}

// ── 3. CROSS-DEPARTMENT CONFLICT DETECTION ──────────────────
export async function getCrossDeptConflicts(): Promise<CrossDeptConflict[]> {
  const issues = await prisma.civicIssue.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      status: { notIn: ['Resolved', 'Citizen_Verified'] },
    },
    select: {
      id: true, ticketId: true, category: true, department: true,
      latitude: true, longitude: true, locality: true, zone: true,
    },
  });

  const conflicts: CrossDeptConflict[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < issues.length; i++) {
    const root = issues[i];
    if (visited.has(root.id) || root.latitude === null || root.longitude === null) continue;

    const matched = [root];
    visited.add(root.id);
    const rootPoint = turf.point([root.longitude, root.latitude]);

    for (let j = i + 1; j < issues.length; j++) {
      const candidate = issues[j];
      if (visited.has(candidate.id) || candidate.latitude === null || candidate.longitude === null) continue;

      // Must be from different department or distinct category within 350m
      if (candidate.department !== root.department || candidate.category !== root.category) {
        const candPoint = turf.point([candidate.longitude, candidate.latitude]);
        const distKm = turf.distance(rootPoint, candPoint, { units: 'kilometers' });

        if (distKm <= 0.38) {
          matched.push(candidate);
          visited.add(candidate.id);
        }
      }
    }

    const uniqueDepts = Array.from(new Set(matched.map(m => m.department || 'NMC')));
    const uniqueCats = Array.from(new Set(matched.map(m => m.category)));

    if (uniqueDepts.length >= 2 && matched.length >= 2) {
      let potentialCause = 'Underlying infrastructure conflict between utilities and road corridor.';
      let recommendation = 'Joint pre-inspection recommended between departments before road surface reinstatement.';

      if (uniqueCats.includes('Water Supply') && uniqueCats.includes('Road/Pothole')) {
        potentialCause = 'Subsurface water pipeline leakage potentially undermining road sub-base integrity.';
        recommendation = 'NMC Water Works must repair pipeline joint before Road Maintenance Department resurfaces.';
      } else if (uniqueCats.includes('Drainage') && uniqueCats.includes('Waterlogging')) {
        potentialCause = 'Stormwater drain blockage causing street flooding during rainfall events.';
        recommendation = 'Drainage Department desilting crew should coordinate with Traffic Department for lane management.';
      }

      conflicts.push({
        id: `conflict-${conflicts.length + 1}`,
        locationName: `${root.locality || root.zone || 'Nagpur'} Multi-Agency Hotspot`,
        centroid: { lat: root.latitude, lng: root.longitude },
        departments: uniqueDepts,
        categories: uniqueCats,
        issueCount: matched.length,
        potentialCause,
        coordinationRecommendation: recommendation,
        tickets: matched.map(m => m.ticketId),
      });
    }
  }

  return conflicts.sort((a, b) => b.issueCount - a.issueCount);
}

// ── 4. CIVIC RADAR / NEAR ME PROXIMITY CALCULATOR ───────────
export async function getIssuesNearLocation(lat: number, lng: number, maxRadiusKm = 3.0): Promise<NearMeResult[]> {
  const issues = await prisma.civicIssue.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      ticketId: true, title: true, category: true, severity: true,
      status: true, locality: true, zone: true, wardNumber: true,
      latitude: true, longitude: true,
    },
  });

  const userPoint = turf.point([lng, lat]);
  const results: NearMeResult[] = [];

  for (const issue of issues) {
    if (issue.latitude === null || issue.longitude === null) continue;
    const issuePoint = turf.point([issue.longitude, issue.latitude]);
    const distKm = turf.distance(userPoint, issuePoint, { units: 'kilometers' });

    if (distKm <= maxRadiusKm) {
      const distanceMeters = Math.round(distKm * 1000);
      const distanceFormatted = distanceMeters < 1000
        ? `${distanceMeters}m away`
        : `${distKm.toFixed(1)}km away`;

      results.push({
        ticketId: issue.ticketId,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
        locality: issue.locality,
        zone: issue.zone,
        wardNumber: issue.wardNumber,
        latitude: issue.latitude,
        longitude: issue.longitude,
        distanceMeters,
        distanceFormatted,
      });
    }
  }

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}
