import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const zone = searchParams.get('zone');

    const where: Record<string, unknown> = {
      latitude: { not: null },
      longitude: { not: null },
    };
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (zone) where.zone = zone;

    const issues = await prisma.civicIssue.findMany({
      where,
      select: {
        id: true, ticketId: true, category: true, title: true,
        severity: true, status: true, latitude: true, longitude: true,
        zone: true, wardNumber: true, wardName: true, slaBreach: true,
        createdAt: true,
      },
      take: 500,
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('[Map Issues]', error);
    return NextResponse.json({ error: 'Failed to fetch map data' }, { status: 500 });
  }
}
