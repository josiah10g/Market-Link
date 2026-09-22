import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, MapPin, Phone, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const Register = () => {
  const [role, setRole] = useState('customer'); // 'customer' or 'vendor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Abuja');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState({ vendors: 0, orders: 0 });

  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/platform/stats');
        if (res.data.success) {
          setPlatformStats({
            vendors: res.data.vendors ?? 0,
            orders: res.data.orders ?? 0
          });
        }
      } catch (e) {
        // Fallback to 0 if unreachable
        setPlatformStats({ vendors: 0, orders: 0 });
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your display name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!phone.trim()) {
      setError('Please provide your phone number so vendors can coordinate delivery.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setError('Please enter a valid phone number (e.g. 08012345678).');
      return;
    }

    if (!address.trim()) {
      setError('Please provide your delivery address or neighborhood in Abuja.');
      return;
    }

    try {
      setLoading(true);
      const effectiveCategory = category === 'Other' 
        ? (customCategory.trim() || 'General') 
        : category;

      const user = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: cleanPhone,
        city: city.trim(),
        address: address.trim(),
        role,
        businessName: role === 'vendor' ? businessName : undefined,
        category: role === 'vendor' ? effectiveCategory : undefined
      });

      success(`Welcome to MarketLink, ${user.name.split(' ')[0]}!`);

      if (user.role === 'vendor') {
        navigate('/vendor');
      } else {
        navigate('/vendors');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-split-container"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr'
      }}
    >
      {/* Left Column: Split-Screen Marketing Panel matching mockup */}
      <div
        className="register-left-panel"
        style={{
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--line)',
          padding: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '4rem' }}>
            <img src="/favicon.svg" alt="MarketLink" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Market<span style={{ color: 'var(--lime)' }}>Link</span>
            </span>
          </Link>

          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--lime)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}
          >
            | Join MarketLink
          </div>

          <h2
            className="heading-display"
            style={{
              fontSize: '2.4rem',
              lineHeight: 1.2,
              marginBottom: '1.25rem',
              color: 'var(--ink)'
            }}
          >
            Bring your business online in minutes.
          </h2>

          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Set up your storefront, manage inventory, and receive real orders — no more chasing customers on WhatsApp threads.
          </p>
        </div>

        {/* Marketing Proof Points (Reflecting real live database counts) */}
        <div style={{ display: 'flex', gap: '3rem', borderTop: '1px solid var(--line)', paddingTop: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)' }}>
              {Number(platformStats.vendors || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Active vendors</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)' }}>
              {Number(platformStats.orders || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Orders fulfilled</div>
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div
        className="register-form-column"
        style={{
          padding: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <Link
            to="/"
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.95rem',
              fontSize: '0.8125rem'
            }}
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>

        <h1 className="heading-display" style={{ fontSize: '1.85rem', marginBottom: '0.3rem', color: 'var(--ink)' }}>
          Create your account
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Choose how you'll use MarketLink.
        </p>

        {/* Role Toggle matching mockup */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '4px',
            marginBottom: '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setRole('customer')}
            style={{
              padding: '0.55rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: role === 'customer' ? 'var(--surface-2)' : 'transparent',
              color: role === 'customer' ? 'var(--lime)' : 'var(--muted)',
              transition: 'all 0.15s'
            }}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('vendor')}
            style={{
              padding: '0.55rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: role === 'vendor' ? 'var(--surface-2)' : 'transparent',
              color: role === 'vendor' ? 'var(--lime)' : 'var(--muted)',
              transition: 'all 0.15s'
            }}
          >
            Vendor
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-cancelled-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Display Name */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={13} color="var(--lime)" /> Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Name"
              className="form-input"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={13} color="var(--lime)" /> Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="form-input"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={13} color="var(--lime)" /> Phone number (for delivery updates)
            </label>
            
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                // Strictly allow only digits and optional leading '+'
                const val = e.target.value.replace(/[^0-9+]/g, '');
                setPhone(val);
              }}
              onKeyDown={(e) => {
                // Prevent typing letters, symbols, e, E, -, .
                if (['e', 'E', '-', '.', ',', ' '].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="08012345678"
              className="form-input"
              required
            />
          </div>

          {/* City & Address */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={13} color="var(--lime)" /> Neighborhood / Delivery address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Your location"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }} className="auth-row-2col">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={13} color="var(--lime)" /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={13} color="var(--lime)" /> Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="form-input"
                  style={{
                    paddingRight: '2.5rem',
                    borderColor: confirmPassword && confirmPassword !== password ? '#EF4444' : undefined
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '-0.35rem', marginBottom: '0.75rem' }}>
              Passwords do not match
            </p>
          )}

          {/* Additional Vendor Details if vendor selected */}
          {role === 'vendor' && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Business / Storefront Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Amaka's Kitchen"
                  className="form-input"
                  required={role === 'vendor'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Business Category</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{
                      cursor: 'pointer',
                      fontWeight: 500,
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--line-light)'
                    }}
                  >
                    <option value="Food">🍲 Food & Catering</option>
                    <option value="Fashion">✂️ Fashion & Tailoring</option>
                    <option value="Beauty">💅 Beauty & Hair</option>
                    <option value="Repairs">🔧 Repairs & Tech</option>
                    <option value="Groceries">🥬 Fresh Groceries & Provisions</option>
                    <option value="General">📦 General Services</option>
                    <option value="Other">✨ Other (Specify your business)</option>
                  </select>
                </div>

                {category === 'Other' && (
                  <div style={{ marginTop: '0.65rem' }}>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter your specific category (e.g. Handmade Crafts, Photography)"
                      className="form-input"
                      style={{
                        borderColor: 'var(--lime)',
                        backgroundColor: 'var(--surface-2)'
                      }}
                      required={category === 'Other'}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security & privacy assurance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 0.75rem',
              margin: '1.25rem 0',
              fontSize: '0.75rem',
              color: 'var(--muted)'
            }}
          >
            <ShieldCheck size={16} color="var(--lime)" style={{ flexShrink: 0 }} />
            <span>Encrypted credentials & secure local commerce standards.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--lime)', fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </form>
      </div>

      {/* Full-screen Loading Overlay for Register account creation */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 14, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            gap: '1.25rem'
          }}
        >
          <div style={{ position: 'relative', width: '56px', height: '56px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid rgba(185, 255, 102, 0.15)',
                borderRadius: '50%'
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid transparent',
                borderTopColor: 'var(--lime)',
                borderRightColor: 'rgba(185, 255, 102, 0.5)',
                borderRadius: '50%',
                animation: 'marketLinkSpin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                boxShadow: '0 0 20px rgba(185, 255, 102, 0.3)'
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem' }}>
              Setting up your {role === 'vendor' ? 'storefront' : 'account'}...
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
              {role === 'vendor'
                ? 'Registering your business details and provisioning your vendor console'
                : 'Configuring your secure customer profile and delivery address'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
