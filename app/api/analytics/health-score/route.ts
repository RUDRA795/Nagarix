import { NextResponse } from 'next/server';
import { getCityHealthIndex } from '@/lib/analytics/healthScore';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const healthIndex = await getCityHealthIndex();
    return NextResponse.json(healthIndex);
  } catch (error) {
    console.error('[Health Score API Error]:', error);
    return NextResponse.json({ error: 'Failed to calculate civic health score' }, { status: 500 });
  }
}
