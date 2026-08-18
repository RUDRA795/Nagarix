import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      total,
      byStatus,
      bySeverity,
      byCategory,
      byZone,
      slaBreach,
      resolvedToday,
      criticalActive,
    ] = await Promise.all([
      prisma.civicIssue.count(),
      prisma.civicIssue.groupBy({ by: ['status'], _count: true }),
      prisma.civicIssue.groupBy({ by: ['severity'], _count: true }),
      prisma.civicIssue.groupBy({ by: ['category'], _count: true, orderBy: { _count: { category: 'desc' } } }),
      prisma.civicIssue.groupBy({ by: ['zone'], _count: true, orderBy: { _count: { zone: 'desc' } } }),
      prisma.civicIssue.count({ where: { slaBreach: true } }),
      prisma.civicIssue.count({
        where: {
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.civicIssue.count({
        where: { severity: 'Critical', status: { notIn: ['Resolved', 'Citizen_Verified'] } },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count; });

    const active = (statusMap['Reported'] || 0)
      + (statusMap['AI_Verified'] || 0)
      + (statusMap['Assigned'] || 0)
      + (statusMap['In_Progress'] || 0);

    const resolved = (statusMap['Resolved'] || 0) + (statusMap['Citizen_Verified'] || 0);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Trend data: last 14 days
    const trendData = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [reported, resolved_count] = await Promise.all([
        prisma.civicIssue.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.civicIssue.count({ where: { resolvedAt: { gte: start, lte: end } } }),
      ]);

      trendData.push({
        date: start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        reported,
        resolved: resolved_count,
      });
    }

    return NextResponse.json({
      overview: {
        total,
        active,
        resolved,
        slaBreach,
        resolvedToday,
        criticalActive,
        resolutionRate,
        pending: statusMap['Reported'] || 0,
      },
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count })),
      byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
      byZone: byZone.filter(z => z.zone).map(z => ({ zone: z.zone, count: z._count })),
      trend: trendData,
    });
  } catch (error) {
    console.error('[Analytics Overview]', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
