import { Metadata } from 'next';
import { TrackComplaint } from '@/components/civic/TrackComplaint';

export const metadata: Metadata = {
  title: 'Track Complaint',
  description: 'Track the status of your NagariX civic complaint by ticket ID.',
};

export default function TrackPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-12) var(--space-6)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="page-header" style={{ border: 'none', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 'var(--space-3)' }}>
            Citizen Portal
          </div>
          <h1 className="page-title">Track Your Complaint</h1>
          <p className="page-subtitle">Enter your ticket ID (e.g. NX-2026-000001) to check the latest status and resolution progress.</p>
        </div>
        <TrackComplaint />
      </div>
    </div>
  );
}
