'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, LayoutDashboard, Sparkles, FileText, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">🏙️</div>
            <div>
              <div className="nav-logo-text">
                Nagari<span style={{ color: 'var(--accent-orange)' }}>X</span>
              </div>
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

          {/* Actions & Theme Switcher */}
          <div className="nav-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme === 'dark' ? '#fbbf24' : 'var(--accent-purple)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                transition: 'all 0.2s ease',
              }}
            >
              {mounted ? (
                theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />
              ) : (
                <Sun size={17} />
              )}
            </button>

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
          background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-subtle)',
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

          <div style={{ padding: 'var(--space-2) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Theme Mode</span>
            <button
              type="button"
              onClick={() => { toggleTheme(); setMobileOpen(false); }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', gap: 6, alignItems: 'center' }}
            >
              {theme === 'dark' ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
            </button>
          </div>
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
