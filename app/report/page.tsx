import { Metadata } from 'next';
import { ReportForm } from '@/components/civic/ReportForm';

export const metadata: Metadata = {
  title: 'Report a Civic Issue',
  description: 'Report a civic issue in Nagpur — potholes, garbage, drainage, water supply, streetlights and more.',
};

export default function ReportPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-12) var(--space-6)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 'var(--space-3)' }}>
            Citizen Portal
          </div>
          <h1 className="page-title">Report a Civic Issue</h1>
          <p className="page-subtitle">Submit a complaint directly to the right NMC department. AI will classify and prioritize your issue automatically.</p>
        </div>
        <ReportForm />
      </div>
    </div>
  );
}
