import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut, CheckSquare, Users, Star, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ role = 'vendor', businessName = 'Store', activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash || '');
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

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
    let isLinkActive;

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
          setMobileMenuOpen(false);
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
      {/* Brand logo in sidebar with Account Dropdown & Mobile Hamburger */}
      <div className="sidebar-top-bar" style={{ marginBottom: '2.5rem', position: 'relative' }} ref={dropdownRef}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <img src="/favicon.svg" alt="MarketLink" style={{ width: '26px', height: '26px', borderRadius: '5px' }} />
            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Market<span style={{ color: 'var(--lime)' }}>Link</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user && (
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={`${isVendor ? 'Vendor' : 'Admin'} account menu`}
                aria-label={`${isVendor ? 'Vendor' : 'Admin'} account menu`}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--lime)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--lime)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user.name ? user.name.charAt(0).toUpperCase() : (isVendor ? 'V' : 'A')
                )}
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              className="sidebar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              title={mobileMenuOpen ? "Close menu" : "Open menu"}
              style={{
                background: mobileMenuOpen ? 'var(--lime-soft)' : 'var(--surface-2)',
                border: `1px solid ${mobileMenuOpen ? 'var(--lime)' : 'var(--line)'}`,
                borderRadius: 'var(--radius)',
                color: mobileMenuOpen ? 'var(--lime)' : 'var(--ink)',
                width: '34px',
                height: '34px',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="sidebar-subheading" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem', paddingLeft: '2rem' }}>
          {isVendor ? (businessName || user?.vendor?.business_name || 'Vendor console') : 'Admin console'}
        </div>

        {/* Dropdown Menu matching Customer Dashboard */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              width: '210px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line-light)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              zIndex: 300,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || (isVendor ? 'Vendor' : 'Admin')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                {user?.email || 'admin@marketlink.ng'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--lime)', fontWeight: 600, marginTop: '0.25rem' }}>
                {isVendor ? 'Verified Merchant' : 'Admin'}
              </div>
            </div>

            {isVendor ? (
              <Link
                to="/vendor/settings"
                onClick={() => setDropdownOpen(false)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.8125rem',
                  color: 'var(--ink)',
                  borderBottom: '1px solid var(--line)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings size={14} color="var(--lime)" />
                <span>Store Settings</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  if (onTabChange) {
                    onTabChange('settings');
                    window.location.hash = '#settings';
                  } else {
                    navigate('/admin#settings');
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.8125rem',
                  color: 'var(--ink)',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--line)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User size={14} color="var(--lime)" />
                <span>Edit Details / Settings</span>
              </button>
            )}

            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.75rem',
                fontSize: '0.8125rem',
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--line)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Settings size={14} color="var(--muted)" />
              <span>General Profile</span>
            </Link>

            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.75rem',
                fontSize: '0.8125rem',
                color: 'var(--status-cancelled)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation links & bottom bar inside collapsible container for mobile */}
      <div className={`sidebar-collapsible-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {isVendor ? (
            <>
              {/* MANAGE section */}
              <div className="sidebar-section-title" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
                MANAGE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1.75rem' }}>
                {vendorManageLinks.map(renderNavLink)}
              </div>

              {/* STORE section */}
              <div className="sidebar-section-title" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
                STORE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {vendorStoreLinks.map(renderNavLink)}
              </div>
            </>
          ) : (
            <>
              {/* PLATFORM section */}
              <div className="sidebar-section-title" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
                PLATFORM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1.75rem' }}>
                {adminPlatformLinks.map(renderNavLink)}
              </div>

              {/* SYSTEM section */}
              <div className="sidebar-section-title" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}>
                SYSTEM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {adminSystemLinks.map(renderNavLink)}
              </div>
            </>
          )}
        </nav>

        {/* Bottom Profile & Sign Out Bar */}
        <div className="sidebar-bottom-bar" style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--line)', marginTop: 'auto' }}>
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
          ) : null}

          {/* Distinct Sign Out Button */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
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
      </div>
    </aside>
  );
};

export default Sidebar;
