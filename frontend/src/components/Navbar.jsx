import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationDropdown from './NotificationDropdown';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [profileOpen]);

  return (
    <header
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0.85rem 0'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo & Wordmark */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/favicon.svg" alt="MarketLink Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Market<span style={{ color: 'var(--lime)' }}>Link</span>
          </span>
        </Link>

        {/* Center / Navigation Links (Desktop) */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/vendors" className="nav-link">
            Vendors
          </Link>
          <Link to="/products" className="nav-link">
            Browse
          </Link>
          <Link to={user ? "/orders" : "/login"} className="nav-link">
            Orders
          </Link>
          {user && user.role === 'vendor' && (
            <Link to="/vendor" className="nav-link" style={{ color: 'var(--lime)', fontWeight: 600 }}>
              Vendor Console →
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="nav-link" style={{ color: 'var(--lime)', fontWeight: 600 }}>
              Admin Console →
            </Link>
          )}
        </nav>

        {/* Right Actions: Cart, Notifications, Auth, Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Customer Cart (Only for logged-in customers — hidden on mobile, shown in hamburger) */}
          {user && user.role === 'customer' && (
            <Link
              to="/cart"
              className="desktop-cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.875rem',
                color: totalItemCount > 0 ? 'var(--lime)' : 'var(--muted)',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius)',
                backgroundColor: totalItemCount > 0 ? 'var(--lime-soft)' : 'transparent'
              }}
            >
              <ShoppingBag size={17} />
              <span>Cart ({totalItemCount})</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--ink)',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* User Notifications */}
          {user && <NotificationDropdown />}

          {/* Auth State */}
          {user ? (
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '0.35rem 0.75rem',
                  color: 'var(--ink)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--lime)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    overflow: 'hidden'
                  }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </div>
                <span className="profile-name-text">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} color="var(--muted)" />
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '180px',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                    zIndex: 200,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                      {user.role} Account
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.8125rem',
                      color: 'var(--ink)',
                      borderBottom: '1px solid var(--line)'
                    }}
                  >
                    <User size={13} color="var(--lime)" />
                    Manage Profile
                  </Link>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
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
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem' }}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8125rem' }}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer"
          style={{
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--line)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '0.9375rem', color: 'var(--ink)', padding: '0.35rem 0', fontWeight: 500 }}
          >
            Home
          </Link>
          <Link
            to="/vendors"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '0.9375rem', color: 'var(--ink)', padding: '0.35rem 0', fontWeight: 500 }}
          >
            Vendors
          </Link>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '0.9375rem', color: 'var(--ink)', padding: '0.35rem 0', fontWeight: 500 }}
          >
            Browse Catalog
          </Link>
          <Link
            to={user ? "/orders" : "/login"}
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '0.9375rem', color: 'var(--ink)', padding: '0.35rem 0', fontWeight: 500 }}
          >
            Orders Tracker
          </Link>
          {user && user.role === 'customer' && (
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '0.9375rem',
                color: totalItemCount > 0 ? 'var(--lime)' : 'var(--ink)',
                padding: '0.35rem 0',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ShoppingBag size={16} />
              <span>Cart ({totalItemCount})</span>
            </Link>
          )}
          {user && user.role === 'vendor' && (
            <Link
              to="/vendor"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.9375rem', color: 'var(--lime)', padding: '0.35rem 0', fontWeight: 600 }}
            >
              Vendor Console →
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.9375rem', color: 'var(--lime)', padding: '0.35rem 0', fontWeight: 600 }}
            >
              Admin Console →
            </Link>
          )}
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.9375rem', color: 'var(--ink)', padding: '0.35rem 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <User size={15} color="var(--lime)" /> Manage Profile
            </Link>
          )}
          {!user && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', padding: '0.5rem' }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.5rem' }}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
