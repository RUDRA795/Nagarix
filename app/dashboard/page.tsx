import { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Municipal Command Center',
  description: 'NagariX Municipal Command Center — real-time civic analytics, KPIs, and issue management for Nagpur.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
