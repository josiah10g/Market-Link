import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Vendors from './pages/Vendors';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import VendorDashboard from './pages/VendorDashboard';
import VendorOrders from './pages/VendorOrders';
import VendorProducts from './pages/VendorProducts';
import VendorReviews from './pages/VendorReviews';
import VendorSettings from './pages/VendorSettings';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const { loading } = useAuth();

  // Global auth loading gate — prevents black screen flash while session is being verified
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg)',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <img src="/favicon.svg" alt="" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
          <span style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Market<span style={{ color: 'var(--lime)' }}>Link</span>
          </span>
        </div>
        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
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
          Loading your session...
        </p>
      </div>
    );
  }

  return (
    <div key={location.pathname} className="page-enter" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/products" element={<Products />} />

        {/* Customer Protected Routes (Cart, Checkout) */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        {/* Authenticated Protected Routes (All roles can manage profile & view orders) */}
        <Route element={<ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']} />}>
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Vendor Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
          <Route path="/vendor/products" element={<VendorProducts />} />
          <Route path="/vendor/reviews" element={<VendorReviews />} />
          <Route path="/vendor/settings" element={<VendorSettings />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
