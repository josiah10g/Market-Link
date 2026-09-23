import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut, CheckSquare, Users, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ role = 'vendor', businessName = 'Store', activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '');

  useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash || '');
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const isVendor = role === 'vendor';

  const vendorManageLinks = [
    { id: 'dashboard', label: 'Dashboard', path: '/vendor', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
    { id: 'products', label: 'Products', path: '/vendor/products', icon: Package },
    { id: 'reviews', label: 'Reviews', path: '/vendor/reviews', icon: Star },
  ];

  const vendorStoreLinks = [
    { id: 'settings', label: 'Store settings', path: '/vendor/settings', icon: Settings },
    { id: 'payouts', label: 'Payouts', path: '/vendor/settings#payouts', icon: ShoppingBag },
  ];

  const adminPlatformLinks = [
    { id: 'overview', label: 'Overview', path: '/admin#overview', hash: '#overview', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors', path: '/admin#vendors', hash: '#vendors', icon: CheckSquare, badge: '3 pending' },
    { id: 'users', label: 'Users', path: '/admin#users', hash: '#users', icon: Users },
    { id: 'orders', label: 'All orders', path: '/admin#orders', hash: '#orders', icon: ShoppingBag },
    { id: 'reviews', label: 'Reviews', path: '/admin#reviews', hash: '#reviews', icon: Star },
  ];

  const adminSystemLinks = [
    { id: 'categories', label: 'Categories', path: '/admin#categories', hash: '#categories', icon: Package },
    { id: 'settings', label: 'Settings', path: '/admin#settings', hash: '#settings', icon: Settings },
  ];

  const renderNavLink = (link) => {
    let isLinkActive = false;

    if (role === 'admin') {
      // In admin dashboard, use activeTab if passed, or strictly match current hash
      if (activeTab) {
        isLinkActive = activeTab === link.id;
      } else {
        const effectiveHash = currentHash || '#overview';
        isLinkActive = (link.hash === effectiveHash);
      }
    } else {
      // In vendor dashboard, match pathname exactly (or with hash if applicable)
      if (link.path.includes('#')) {
        isLinkActive = (location.pathname + currentHash === link.path);
      } else {
        isLinkActive = (location.pathname === link.path && !currentHash);
      }
    }

    return (
      <Link
        key={link.label}
        to={link.path}
        onClick={(e) => {
          if (role === 'admin' && onTabChange) {
            e.preventDefault();
            onTabChange(link.id);
            window.history.pushState(null, '', link.path);
            setCurrentHash(link.hash || '');
            window.dispatchEvent(new Event('hashchange'));
            return;
          }

          if (link.path.includes('#')) {
            const [targetPath, targetHash] = link.path.split('#');
            if (location.pathname === targetPath && targetHash) {
              e.preventDefault();
              window.history.pushState(null, '', link.path);
              setCurrentHash('#' + targetHash);
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
          justifyContent: 'space-between',
          gap: '0.65rem',
          padding: '0.55rem 0.75rem',
          borderRadius: 'var(--radius)',
          fontSize: '0.8125rem',
          fontWeight: isLinkActive ? 600 : 500,
          color: isLinkActive ? 'var(--lime)' : 'var(--muted)',
          backgroundColor: isLinkActive ? 'rgba(185, 255, 102, 0.08)' : 'transparent',
          borderLeft: isLinkActive ? '2px solid var(--lime)' : '2px solid transparent',
          transition: 'all 0.15s ease',
          textDecoration: 'none'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span>{link.label}</span>
        </span>

        {link.badge && role === 'admin' && (
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(185, 255, 102, 0.12)',
              color: 'var(--lime)',
              border: '1px solid rgba(185, 255, 102, 0.25)',
              letterSpacing: '0.02em'
            }}
          >
            {link.badge}
          </span>
        )}
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
      <div style={{ marginBottom: '2.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <img src="/favicon.svg" alt="MarketLink" style={{ width: '26px', height: '26px', borderRadius: '5px' }} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Market<span style={{ color: 'var(--lime)' }}>Link</span>
          </span>
        </Link>
        {!isVendor && (
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem', paddingLeft: '2rem' }}>
            Admin console
          </div>
        )}
      </div>

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
            {/* PLATFORM section */}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
              PLATFORM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1.75rem' }}>
              {adminPlatformLinks.map(renderNavLink)}
            </div>

            {/* SYSTEM section */}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
              SYSTEM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {adminSystemLinks.map(renderNavLink)}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Profile & Sign Out Bar (Admin / Vendor) */}
      <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--line)', marginTop: 'auto' }}>
        {isVendor ? (
          <div style={{ marginBottom: '0.85rem' }}>
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
        ) : (
          <div
            onClick={() => {
              if (onTabChange) {
                onTabChange('settings');
                window.location.hash = '#settings';
              } else {
                navigate('/admin#settings');
              }
            }}
            title="Click to edit administrator details"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '0.85rem',
              cursor: 'pointer',
              padding: '0.35rem 0.4rem',
              borderRadius: 'var(--radius)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(185, 255, 102, 0.15)',
                color: 'var(--lime)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', lineHeight: 1.2 }}>
                Super admin · Edit details
              </div>
            </div>
          </div>
        )}

        {/* Distinct Sign Out Button */}
        <button
          onClick={logout}
          title="Sign out of your account"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '0.55rem',
            padding: '0.5rem 0.65rem',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            color: 'var(--status-cancelled)',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'var(--status-cancelled)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
