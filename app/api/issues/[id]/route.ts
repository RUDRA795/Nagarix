import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issue = await prisma.civicIssue.findFirst({
      where: {
        OR: [{ id }, { ticketId: id.toUpperCase() }],
      },
      include: {
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('[Issue GET]', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note, actor, assignedTo, resolutionNote } = body;

    const issue = await prisma.civicIssue.findFirst({
      where: { OR: [{ id }, { ticketId: id.toUpperCase() }] },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolutionNote) updateData.resolutionNote = resolutionNote;

    if (status === 'Resolved' || status === 'Citizen_Verified') {
      updateData.resolvedAt = new Date();
    }

    // Check SLA breach
    if (issue.slaDeadline && new Date() > issue.slaDeadline && !['Resolved', 'Citizen_Verified'].includes(status || issue.status)) {
      updateData.slaBreach = true;
    }

    const [updated] = await prisma.$transaction([
      prisma.civicIssue.update({
        where: { id: issue.id },
        data: updateData,
        include: { timeline: { orderBy: { createdAt: 'asc' } } },
      }),
      ...(status ? [prisma.issueTimeline.create({
        data: {
          issueId: issue.id,
          status,
          note: note || `Status updated to ${status}`,
          actor: actor || 'System',
        },
      })] : []),
    ]);

    return NextResponse.json({ issue: updated });
  } catch (error) {
    console.error('[Issue PATCH]', error);
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}
