import { NextResponse } from 'next/server';
import { getSlaOverview } from '@/lib/analytics/slaEngine';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const slaData = await getSlaOverview();
    return NextResponse.json(slaData);
  } catch (error) {
    console.error('[SLA Risk API Error]:', error);
    return NextResponse.json({ error: 'Failed to calculate SLA risk overview' }, { status: 500 });
  }
}
