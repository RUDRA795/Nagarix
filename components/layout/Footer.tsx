import Link from 'next/link';
import { MapPin, Shield, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="nav-logo-icon" style={{ width: 36, height: 36 }}>🏙️</div>
              <div>
                <div className="nav-logo-text">NagariX</div>
                <div className="nav-logo-sub">Urban Intelligence</div>
              </div>
            </div>
            <p className="footer-brand-desc">
              AI-powered smart city platform for Nagpur. Connecting citizens,
              civic intelligence, and municipal action for a better Nagpur.
            </p>
            <div className="flex items-center gap-2 mt-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <MapPin size={12} />
              <span>Nagpur, Maharashtra, India</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="footer-col-title">Platform</div>
            <Link href="/" className="footer-link">Home</Link>
            <Link href="/map" className="footer-link">City Map</Link>
            <Link href="/report" className="footer-link">Report Issue</Link>
            <Link href="/track" className="footer-link">Track Complaint</Link>
          </div>

          {/* Dashboard */}
          <div>
            <div className="footer-col-title">Command Center</div>
            <Link href="/dashboard" className="footer-link">Overview</Link>
            <Link href="/dashboard/issues" className="footer-link">Issues</Link>
            <Link href="/dashboard/analytics" className="footer-link">Analytics</Link>
            <Link href="/dashboard/copilot" className="footer-link">AI Copilot</Link>
          </div>

          {/* Info */}
          <div>
            <div className="footer-col-title">Information</div>
            <span className="footer-link" style={{ cursor: 'default' }}>About NMC</span>
            <span className="footer-link" style={{ cursor: 'default' }}>Privacy Policy</span>
            <span className="footer-link" style={{ cursor: 'default' }}>Terms of Use</span>
            <span className="footer-link" style={{ cursor: 'default' }}>Accessibility</span>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © 2026 NagariX — Nagpur Municipal Corporation Smart City Initiative.{' '}
            <span style={{ color: 'var(--color-warning)' }}>⚠ Demo Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Shield size={12} style={{ color: 'var(--color-success)' }} />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} style={{ color: 'var(--accent-blue)' }} />
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
