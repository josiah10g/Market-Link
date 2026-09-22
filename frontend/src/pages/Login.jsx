import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  // useToast is used inside handleSubmit via `toast` variable
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const result = await login(email, password);
      const firstName = result?.name ? result.name.split(' ')[0] : 'User';
      toast.success(`Welcome back, ${firstName}`);
      if (result?.role === 'admin') {
        navigate('/admin');
      } else if (result?.role === 'vendor') {
        navigate('/vendor');
      } else {
        navigate('/orders');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="responsive-login-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem'
      }}
    >
      {/* Top Bar with Logo & Back to Home */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/favicon.svg" alt="MarketLink Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Market<span style={{ color: 'var(--lime)' }}>Link</span>
          </span>
        </Link>

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

      {/* Centered Login Form Card */}
      <div
        className="responsive-login-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--lime)',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 12px rgba(185, 255, 102, 0.5)'
          }}
        />

        <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '2rem' }}>
          Log in to track orders and manage your account.
        </p>

        {isExpired && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-pending-bg)', border: '1px solid var(--status-pending)', color: 'var(--status-pending)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            Your session has expired. Please log in again.
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-cancelled-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--lime)', cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--lime)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>

      {/* Full-screen Loading Overlay for Login authentication */}
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
              Authenticating session...
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
              Verifying your credentials and preparing your dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
