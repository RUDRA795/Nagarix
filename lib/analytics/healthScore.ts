import { prisma } from '@/lib/prisma';

export interface DimensionScore {
  category: string;
  score: number;
  total: number;
  active: number;
  resolved: number;
  slaBreach: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Critical';
}

export interface WardHealthScore {
  wardNumber: number;
  wardName: string;
  zone: string;
  population?: number | null;
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Critical';
  totalIssues: number;
  activeIssues: number;
  resolvedIssues: number;
  resolutionRate: number;
  slaBreaches: number;
  topCategory: string;
}

export interface CityHealthIndex {
  overallScore: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Critical';
  totalIssues: number;
  activeIssues: number;
  resolvedIssues: number;
  cityResolutionRate: number;
  totalSlaBreaches: number;
  dimensions: DimensionScore[];
  wardRankings: WardHealthScore[];
  updatedAt: string;
}

function calculateScore(total: number, active: number, critical: number, breaches: number, resolved: number): number {
  if (total === 0) return 95;
  const resolutionRate = total > 0 ? (resolved / total) * 100 : 100;
  const raw = 100 - (active * 1.4) - (critical * 4.0) - (breaches * 5.0) + (resolutionRate * 0.25);
  return Math.max(15, Math.min(99, Math.round(raw)));
}

function getScoreStatus(score: number): 'Excellent' | 'Good' | 'Fair' | 'Critical' {
  if (score >= 82) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 52) return 'Fair';
  return 'Critical';
}

export async function getCityHealthIndex(): Promise<CityHealthIndex> {
  const [total, issues, wards] = await Promise.all([
    prisma.civicIssue.count(),
    prisma.civicIssue.findMany({
      select: {
        category: true,
        status: true,
        severity: true,
        slaBreach: true,
        wardNumber: true,
        zone: true,
      },
    }),
    prisma.ward.findMany({
      orderBy: { wardNumber: 'asc' },
    }),
  ]);

  const activeIssues = issues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
  const resolvedIssues = issues.filter(i => ['Resolved', 'Citizen_Verified'].includes(i.status)).length;
  const criticalIssues = issues.filter(i => i.severity === 'Critical' && !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
  const totalSlaBreaches = issues.filter(i => i.slaBreach).length;
  const cityResolutionRate = total > 0 ? Math.round((resolvedIssues / total) * 100) : 100;

  const overallScore = calculateScore(total, activeIssues, criticalIssues, totalSlaBreaches, resolvedIssues);

  // 5 Core Urban Dimensions
  const CORE_CATEGORIES = ['Road/Pothole', 'Water Supply', 'Drainage', 'Garbage', 'Streetlight'];
  const dimensions: DimensionScore[] = CORE_CATEGORIES.map(category => {
    const catIssues = issues.filter(i => i.category === category);
    const catTotal = catIssues.length;
    const catActive = catIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
    const catResolved = catIssues.filter(i => ['Resolved', 'Citizen_Verified'].includes(i.status)).length;
    const catCritical = catIssues.filter(i => i.severity === 'Critical' && !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
    const catBreaches = catIssues.filter(i => i.slaBreach).length;

    const score = calculateScore(catTotal, catActive, catCritical, catBreaches, catResolved);
    return {
      category,
      score,
      total: catTotal,
      active: catActive,
      resolved: catResolved,
      slaBreach: catBreaches,
      status: getScoreStatus(score),
    };
  });

  // Ward-by-Ward Rankings
  const wardRankings: WardHealthScore[] = wards.map(w => {
    const wIssues = issues.filter(i => i.wardNumber === w.wardNumber);
    const wTotal = wIssues.length;
    const wActive = wIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
    const wResolved = wIssues.filter(i => ['Resolved', 'Citizen_Verified'].includes(i.status)).length;
    const wCritical = wIssues.filter(i => i.severity === 'Critical' && !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
    const wBreaches = wIssues.filter(i => i.slaBreach).length;
    const wResRate = wTotal > 0 ? Math.round((wResolved / wTotal) * 100) : 100;

    // Top Category
    const catCounts: Record<string, number> = {};
    wIssues.forEach(i => {
      catCounts[i.category] = (catCounts[i.category] || 0) + 1;
    });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Road/Pothole';

    const score = calculateScore(wTotal, wActive, wCritical, wBreaches, wResolved);
    return {
      wardNumber: w.wardNumber,
      wardName: w.wardName,
      zone: w.zone,
      population: w.population,
      score,
      status: getScoreStatus(score),
      totalIssues: wTotal,
      activeIssues: wActive,
      resolvedIssues: wResolved,
      resolutionRate: wResRate,
      slaBreaches: wBreaches,
      topCategory: topCat,
    };
  }).sort((a, b) => b.score - a.score); // Highest health score first

  return {
    overallScore,
    status: getScoreStatus(overallScore),
    totalIssues: total,
    activeIssues,
    resolvedIssues,
    cityResolutionRate,
    totalSlaBreaches,
    dimensions,
    wardRankings,
    updatedAt: new Date().toISOString(),
  };
}
