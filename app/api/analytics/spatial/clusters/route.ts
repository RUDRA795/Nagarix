import { NextResponse } from 'next/server';
import { getSpatialClusters } from '@/lib/analytics/spatialEngine';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const clusters = await getSpatialClusters();
    return NextResponse.json({ clusters, totalClusters: clusters.length });
  } catch (error) {
    console.error('[Spatial Clusters API Error]:', error);
    return NextResponse.json({ error: 'Failed to compute spatial clusters' }, { status: 500 });
  }
}
