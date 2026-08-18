import { NextRequest, NextResponse } from 'next/server';
import { getIssuesNearLocation } from '@/lib/analytics/spatialEngine';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '3.0');

    if (isNaN(lat) || isNaN(lng)) {
      // Default to Zero Mile Nagpur center if coordinates omitted
      const defaultResults = await getIssuesNearLocation(21.1458, 79.0882, radius);
      return NextResponse.json({
        location: 'Nagpur Central (Zero Mile Default)',
        lat: 21.1458,
        lng: 79.0882,
        radiusKm: radius,
        nearbyIssues: defaultResults,
        count: defaultResults.length,
      });
    }

    const nearby = await getIssuesNearLocation(lat, lng, radius);
    return NextResponse.json({
      lat,
      lng,
      radiusKm: radius,
      nearbyIssues: nearby,
      count: nearby.length,
    });
  } catch (error) {
    console.error('[Near Me API Error]:', error);
    return NextResponse.json({ error: 'Failed to compute near-me issues' }, { status: 500 });
  }
}
