import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut, CheckSquare, Users, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ role = 'vendor', businessName = 'Store' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const isVendor = role === 'vendor';

  const vendorLinks = [
    { label: 'Dashboard', path: '/vendor', icon: LayoutDashboard },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
    { label: 'Products', path: '/vendor/products', icon: Package },
    { label: 'Reviews', path: '/vendor/reviews', icon: Star },
    { label: 'Store settings', path: '/vendor/settings', icon: Settings },
  ];

  const adminLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Vendors', path: '/admin#vendors', icon: CheckSquare },
    { label: 'Users', path: '/admin#users', icon: Users },
    { label: 'All orders', path: '/admin#orders', icon: ShoppingBag },
    { label: 'Settings', path: '/admin#settings', icon: Settings },
  ];

  const links = isVendor ? vendorLinks : adminLinks;

  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 1rem',
        flexShrink: 0
      }}
    >
      {/* Brand logo in sidebar */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
        <img src="/favicon.svg" alt="MarketLink" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
        <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Market<span style={{ color: 'var(--lime)' }}>Link</span>
        </span>
      </Link>

      {/* Nav section tag */}
      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
        {isVendor ? 'Manage' : 'Platform'}
      </div>

      {/* Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1 }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isLinkActive = link.path.includes('#')
            ? location.pathname + currentHash === link.path
            : location.pathname === link.path;

          return (
            <Link
              key={link.label}
              to={link.path}
              onClick={(e) => {
                if (link.path.includes('#')) {
                  const [targetPath, targetHash] = link.path.split('#');
                  if (location.pathname === targetPath && targetHash) {
                    e.preventDefault();
                    window.history.pushState(null, '', link.path);
                    const el = document.getElementById(targetHash);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.dispatchEvent(new Event('hashchange'));
                  }
                }
              }}
              className={`sidebar-nav-link ${isLinkActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-glow-indicator" />
              <Icon size={18} className="sidebar-nav-icon" />
              <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
