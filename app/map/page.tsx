import { Metadata } from 'next';
import { MapPageClient } from '@/components/map/MapPageClient';

export const metadata: Metadata = {
  title: 'City Map',
  description: 'Explore Nagpur civic issues on an interactive map — filter by category, severity, zone, and status.',
};

export default function MapPage() {
  return <MapPageClient />;
}
