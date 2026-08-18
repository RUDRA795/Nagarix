'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, LayoutDashboard, Sparkles, FileText, Search, Menu, X, Bot } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/',                  label: 'Home',             icon: null },
  { href: '/map',               label: 'City Map',         icon: MapPin },
  { href: '/report',            label: 'Report Issue',     icon: FileText },
  { href: '/track',             label: 'Track',            icon: Search },
  { href: '/dashboard',         label: 'Command Center',   icon: LayoutDashboard },
  { href: '/dashboard/copilot', label: 'AI Copilot',       icon: Sparkles },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">🏙️</div>
            <div>
              <div className="nav-logo-text">NagariX</div>
              <div className="nav-logo-sub">Nagpur Smart City</div>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="nav-links">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link${isActive ? ' active' : ''}`}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="nav-actions">
            <Link href="/report" className="btn btn-primary btn-sm" style={{ display: 'flex', gap: '6px' }}>
              <FileText size={14} />
              Report Issue
            </Link>
            {/* Mobile Menu Toggle */}
            <button
              className="btn btn-ghost btn-icon"
              style={{ display: 'none' }}
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 'var(--nav-height)', left: 0, right: 0,
          background: 'rgba(10, 22, 40, 0.98)', borderBottom: '1px solid var(--border-subtle)',
          padding: 'var(--space-4)', zIndex: 99, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
          backdropFilter: 'blur(20px)',
        }}>
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileOpen(false)}
                style={{ padding: 'var(--space-3) var(--space-4)' }}
              >
                {Icon && <Icon size={16} />}
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
