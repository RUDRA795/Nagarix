import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const zone = searchParams.get('zone');
    const ward = searchParams.get('ward');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (zone) where.zone = zone;
    if (ward) where.wardNumber = parseInt(ward);

    const [issues, total] = await Promise.all([
      prisma.civicIssue.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true, ticketId: true, category: true, title: true,
          severity: true, status: true, priority: true,
          zone: true, wardNumber: true, wardName: true, locality: true,
          latitude: true, longitude: true, department: true,
          slaBreach: true, source: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.civicIssue.count({ where }),
    ]);

    return NextResponse.json({
      issues,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Issues GET]', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, description, wardNumber, locality, latitude, longitude, severity, contactPhone, reportedBy } = body;

    if (!category || !description) {
      return NextResponse.json({ error: 'category and description are required' }, { status: 400 });
    }

    const DEPT_MAP: Record<string, string> = {
      'Road/Pothole': 'Road Maintenance Department',
      'Garbage': 'NMC Solid Waste Management',
      'Drainage': 'Drainage Department',
      'Water Supply': 'NMC Water Works',
      'Waterlogging': 'Drainage Department',
      'Streetlight': 'Electrical Department',
      'Traffic Signal': 'Traffic Department',
      'Tree/Green': 'Garden Department',
      'Public Toilet': 'NMC Sanitation',
      'Other': 'General Administration',
    };

    let ward = null;
    if (wardNumber) {
      ward = await prisma.ward.findUnique({ where: { wardNumber: parseInt(wardNumber) } });
    }

    const count = await prisma.civicIssue.count();
    const ticketId = `NX-2026-${String(count + 1).padStart(6, '0')}`;

    const issueSeverity = severity || 'Medium';
    const priorityMap: Record<string, number> = { Low: 4, Medium: 3, High: 2, Critical: 1 };
    const priority = priorityMap[issueSeverity] || 3;
    const slaHours = issueSeverity === 'Critical' ? 24 : issueSeverity === 'High' ? 48 : issueSeverity === 'Medium' ? 72 : 168;

    const issue = await prisma.civicIssue.create({
      data: {
        ticketId,
        category,
        title: title || description.substring(0, 80),
        description,
        wardNumber: ward?.wardNumber || (wardNumber ? parseInt(wardNumber) : null),
        wardName: ward?.wardName || null,
        zone: ward?.zone || null,
        locality: locality || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        severity: issueSeverity,
        priority,
        status: 'Reported',
        department: DEPT_MAP[category] || 'General Administration',
        contactPhone: contactPhone || null,
        reportedBy: reportedBy || null,
        slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
        source: 'citizen',
        timeline: {
          create: {
            status: 'Reported',
            note: 'Issue reported via NagariX platform',
            actor: 'Citizen',
          },
        },
      },
      include: { timeline: true },
    });

    return NextResponse.json({ issue, ticketId: issue.ticketId }, { status: 201 });
  } catch (error) {
    console.error('[Issues POST]', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
