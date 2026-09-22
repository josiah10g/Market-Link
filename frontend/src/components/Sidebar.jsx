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

  const vendorManageLinks = [
    { label: 'Dashboard', path: '/vendor', icon: LayoutDashboard },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
    { label: 'Products', path: '/vendor/products', icon: Package },
    { label: 'Reviews', path: '/vendor/reviews', icon: Star },
  ];

  const vendorStoreLinks = [
    { label: 'Store settings', path: '/vendor/settings', icon: Settings },
    { label: 'Payouts', path: '/vendor/settings#payouts', icon: ShoppingBag },
  ];

  const adminLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Vendors', path: '/admin#vendors', icon: CheckSquare },
    { label: 'Users', path: '/admin#users', icon: Users },
    { label: 'All orders', path: '/admin#orders', icon: ShoppingBag },
    { label: 'Settings', path: '/admin#settings', icon: Settings },
  ];

  const renderNavLink = (link) => {
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.55rem 0.75rem',
          borderRadius: 'var(--radius)',
          fontSize: '0.8125rem',
          fontWeight: isLinkActive ? 600 : 500,
          color: isLinkActive ? 'var(--lime)' : 'var(--muted)',
          backgroundColor: isLinkActive ? 'rgba(185, 255, 102, 0.08)' : 'transparent',
          borderLeft: isLinkActive ? '2px solid var(--lime)' : '2px solid transparent',
          transition: 'all 0.15s ease'
        }}
      >
        <span>{link.label}</span>
      </Link>
    );
  };

  return (
    <aside
      style={{
        width: '230px',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1.1rem',
        flexShrink: 0
      }}
    >
      {/* Brand logo in sidebar */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem' }}>
        <img src="/favicon.svg" alt="MarketLink" style={{ width: '26px', height: '26px', borderRadius: '5px' }} />
        <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Market<span style={{ color: 'var(--lime)' }}>Link</span>
        </span>
      </Link>

      {/* Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {isVendor ? (
          <>
            {/* MANAGE section */}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
              MANAGE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1.75rem' }}>
              {vendorManageLinks.map(renderNavLink)}
            </div>

            {/* STORE section */}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
              STORE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {vendorStoreLinks.map(renderNavLink)}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
              PLATFORM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {adminLinks.map(renderNavLink)}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Storefront Status Badge (as shown in all screenshots: Amaka's Kitchen - Approved · Live) */}
      {isVendor && (
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--line)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--lime)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {businessName || user?.vendor?.business_name || "Amaka's Kitchen"}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', paddingLeft: '0.85rem' }}>
            Approved · Live
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
