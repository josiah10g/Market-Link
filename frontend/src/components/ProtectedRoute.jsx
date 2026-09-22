import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}
      >
        <div style={{ position: 'relative', width: '40px', height: '40px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2.5px solid rgba(185, 255, 102, 0.15)',
              borderRadius: '50%'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2.5px solid transparent',
              borderTopColor: 'var(--lime)',
              borderRightColor: 'rgba(185, 255, 102, 0.4)',
              borderRadius: '50%',
              animation: 'marketLinkSpin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              boxShadow: '0 0 15px rgba(185, 255, 102, 0.2)'
            }}
          />
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: 500 }}>
          Verifying your session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
