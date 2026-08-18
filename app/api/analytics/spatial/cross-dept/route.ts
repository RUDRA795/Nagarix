import { NextResponse } from 'next/server';
import { getCrossDeptConflicts } from '@/lib/analytics/spatialEngine';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const conflicts = await getCrossDeptConflicts();
    return NextResponse.json({ conflicts, totalConflicts: conflicts.length });
  } catch (error) {
    console.error('[Cross-Dept Conflicts API Error]:', error);
    return NextResponse.json({ error: 'Failed to compute cross-department conflicts' }, { status: 500 });
  }
}
