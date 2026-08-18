import { NextResponse } from 'next/server';
import { getRecurringProblems } from '@/lib/analytics/spatialEngine';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const recurring = await getRecurringProblems();
    return NextResponse.json({ recurring, totalRecurring: recurring.length });
  } catch (error) {
    console.error('[Recurring Problems API Error]:', error);
    return NextResponse.json({ error: 'Failed to compute recurring problems' }, { status: 500 });
  }
}
