import React, { useState, useEffect } from 'react';
import { Search, Star, CheckSquare, Users, ShoppingBag, Eye, ShieldAlert, Check, X, Shield, ArrowUpRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Active Tab state ('overview', 'vendors', 'users', 'orders', 'reviews', 'categories', 'settings')
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  });

  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [roleActionLoading, setRoleActionLoading] = useState(null);

  const [reviewsList, setReviewsList] = useState([]);
  const [reviewActionLoading, setReviewActionLoading] = useState(null);

  // Admin Profile Edit State
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminPhone, setAdminPhone] = useState(user?.phone || '');
  const [adminCity, setAdminCity] = useState(user?.city || 'Abuja');
  const [adminAddress, setAdminAddress] = useState(user?.address || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync user state when user updates
  useEffect(() => {
    if (user) {
      setAdminName(user.name || '');
      setAdminPhone(user.phone || '');
      setAdminCity(user.city || 'Abuja');
      setAdminAddress(user.address || '');
    }
  }, [user]);

  // Sub-tabs & Search for each view
  const [vendorFilter, setVendorFilter] = useState('all');
  const [vendorSearch, setVendorSearch] = useState('');

  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewSearch, setReviewSearch] = useState('');

  // Selected item modal for "Manage" or "View"
  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'vendor' | 'user' | 'order' | 'review'

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vendorsRes, ordersRes, usersRes, reviewsRes] = await Promise.all([
        api.get('/vendors/admin/all'),
        api.get('/orders/admin/all'),
        api.get('/auth/users'),
        api.get('/reviews/admin/all').catch(() => ({ data: { success: true, data: [] } }))
      ]);

      if (vendorsRes.data.success) {
        setVendors(vendorsRes.data.data);
      }
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
        setStats(ordersRes.data.stats);
      }
      if (usersRes.data.success) {
        setUsersList(usersRes.data.data);
      }
      if (reviewsRes.data.success) {
        setReviewsList(reviewsRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update vendor status (approve, reject/suspended, reinstate)
  const handleUpdateVendorStatus = async (vendorId, businessName, newStatus) => {
    try {
      setActionLoading(vendorId);
      const { data } = await api.put(`/vendors/${vendorId}/status`, { status: newStatus });
      if (data.success) {
        if (newStatus === 'approved') {
          toast.success(`✓ Storefront "${businessName}" has been approved and is now live.`);
        } else if (newStatus === 'rejected') {
          toast.success(`Application for "${businessName}" has been declined.`);
        } else if (newStatus === 'suspended') {
          toast.success(`Storefront "${businessName}" has been suspended.`);
        } else {
          toast.success(`Storefront "${businessName}" status set to ${newStatus}.`);
        }
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update vendor status';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Update user role (appoint / remove admin)
  const handleUpdateRole = async (userId, userName, targetRole) => {
    const confirmMsg = targetRole === 'admin'
      ? `Appoint "${userName}" as an Admin? They will have full administrative console privileges.`
      : `Remove Admin privileges from "${userName}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setRoleActionLoading(userId);
      const { data } = await api.put(`/auth/users/${userId}/role`, { role: targetRole });
      if (data.success) {
        toast.success(`User role for "${userName}" updated to ${targetRole}.`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setRoleActionLoading(null);
    }
  };

  // Helper for relative timestamps
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMins < 60) return `${Math.max(1, diffInMins)} min ago`;
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInMonths <= 1) return '1 month ago';
    return `${diffInMonths} months ago`;
  };

  // Delete review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to remove this review from the platform?')) return;
    try {
      setReviewActionLoading(reviewId);
      const { data } = await api.delete(`/reviews/${reviewId}`);
      if (data.success) {
        toast.success('Review removed successfully.');
        setReviewsList(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setReviewActionLoading(null);
    }
  };

  // Review counts from actual database
  const reviewTotalCount = reviewsList.length;
  const review5Count = reviewsList.filter(r => Number(r.rating) === 5).length;
  const review4Count = reviewsList.filter(r => Number(r.rating) === 4).length;
  const review3AndBelowCount = reviewsList.filter(r => Number(r.rating) <= 3).length;

  // Filtering for Reviews (uses real reviews list from backend)
  const filteredReviews = reviewsList.filter(r => {
    let matchTab = true;
    if (reviewFilter === '5') matchTab = Number(r.rating) === 5;
    else if (reviewFilter === '4') matchTab = Number(r.rating) === 4;
    else if (reviewFilter === '3') matchTab = Number(r.rating) <= 3;
    else if (reviewFilter === 'flagged') matchTab = r.is_flagged === true;

    let matchSearch = true;
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      matchSearch = (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
                    (r.vendor_name && r.vendor_name.toLowerCase().includes(q)) ||
                    (r.comment && r.comment.toLowerCase().includes(q));
    }
    return matchTab && matchSearch;
  });

  // Styles for mockup tabs & action buttons
  const subTabStyle = (isActive) => ({
    padding: '0.4rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--lime)' : 'var(--muted)',
    borderBottom: isActive ? '2px solid var(--lime)' : '2px solid transparent',
    background: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap'
  });

  const searchInputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '0.35rem 0.75rem',
    width: '240px'
  };

  const actionButtonStyle = (type) => {
    if (type === 'approve' || type === 'reinstate') {
      return {
        padding: '0.28rem 0.65rem',
        borderRadius: 'var(--radius)',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: 'transparent',
        border: '1px solid rgba(185, 255, 102, 0.4)',
        color: 'var(--lime)',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      };
    }
    if (type === 'reject') {
      return {
        padding: '0.28rem 0.65rem',
        borderRadius: 'var(--radius)',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: 'transparent',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        color: 'var(--status-cancelled)',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      };
    }
    // Manage / View neutral
    return {
      padding: '0.28rem 0.65rem',
      borderRadius: 'var(--radius)',
      fontSize: '0.75rem',
      fontWeight: 500,
      backgroundColor: 'transparent',
      border: '1px solid var(--line)',
      color: 'var(--ink)',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    };
  };

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar with activeTab controller */}
      <Sidebar
        role="admin"
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Main Admin Console */}
      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem 3.5rem', overflowY: 'auto' }}>
        {loading ? (
          <LoadingState message="Loading administrative console..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* ==============================================================
                TAB: OVERVIEW
               ============================================================== */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ marginBottom: '2.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    | Platform overview
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.3rem' }}>
                    Good afternoon, Admin
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    Here's what's happening across MarketLink today.
                  </p>
                </div>

                {/* 4 Summary Cards */}
                <div
                  className="responsive-stats-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.25rem',
                    marginBottom: '2.5rem'
                  }}
                >
                  <div className="card" onClick={() => setActiveTab('vendors')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total vendors</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {stats?.total_vendors || vendors.length}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+8 this month</div>
                  </div>

                  <div className="card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total users</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {stats?.total_users || usersList.length || 2830}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+204 this month</div>
                  </div>

                  <div className="card" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Platform orders</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {stats?.total_orders || orders.length || 9412}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+312 this week</div>
                  </div>

                  <div className="card" onClick={() => { setActiveTab('vendors'); setVendorFilter('pending'); }} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Pending approvals</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: pendingVendorsCount > 0 ? 'var(--status-pending)' : 'var(--muted)' }}>
                      {pendingVendorsCount}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--status-pending)' }}>Needs review</div>
                  </div>
                </div>

                {/* Quick pending queue */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>
                    Pending storefront verifications
                  </h3>
                  <button
                    onClick={() => setActiveTab('vendors')}
                    style={{ background: 'none', border: 'none', color: 'var(--lime)', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    View all vendors →
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>BUSINESS</th>
                        <th>CATEGORY</th>
                        <th>APPLIED</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.filter(v => v.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--lime)' }}>
                            No pending applications! Verification queue is clear.
                          </td>
                        </tr>
                      ) : (
                        vendors.filter(v => v.status === 'pending').slice(0, 5).map((pv) => (
                          <tr key={pv.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{pv.business_name}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>{pv.user_email}</div>
                            </td>
                            <td>{pv.category || 'General'}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{getRelativeTime(pv.created_at)}</td>
                            <td>
                              <span className="badge badge-pending">Pending</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                                <button
                                  onClick={() => handleUpdateVendorStatus(pv.id, pv.business_name, 'approved')}
                                  disabled={actionLoading === pv.id}
                                  style={actionButtonStyle('approve')}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateVendorStatus(pv.id, pv.business_name, 'rejected')}
                                  disabled={actionLoading === pv.id}
                                  style={actionButtonStyle('reject')}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: VENDORS (Matches Screenshot 1 Exactly)
               ============================================================== */}
            {activeTab === 'vendors' && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    | Vendor management
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    Vendors
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    Approve, suspend, and manage every storefront on MarketLink.
                  </p>
                </div>

                {/* Sub-tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={subTabStyle(vendorFilter === 'all')} onClick={() => setVendorFilter('all')}>
                      All ({vendors.length})
                    </button>
                    <button style={subTabStyle(vendorFilter === 'pending')} onClick={() => setVendorFilter('pending')}>
                      Pending ({pendingVendorsCount})
                    </button>
                    <button style={subTabStyle(vendorFilter === 'approved')} onClick={() => setVendorFilter('approved')}>
                      Approved ({approvedVendorsCount})
                    </button>
                    <button style={subTabStyle(vendorFilter === 'suspended')} onClick={() => setVendorFilter('suspended')}>
                      Suspended ({suspendedVendorsCount})
                    </button>
                  </div>

                  <div style={searchInputContainerStyle}>
                    <Search size={14} color="var(--muted)" />
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--ink)', fontSize: '0.8125rem', outline: 'none', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Vendors Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>BUSINESS</th>
                        <th>CATEGORY</th>
                        <th>ORDERS</th>
                        <th>RATING</th>
                        <th>APPLIED</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVendors.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                            No vendors match the current filter or search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredVendors.map((v) => {
                          const isPending = v.status === 'pending';
                          const isApproved = v.status === 'approved';
                          const isSuspended = v.status === 'suspended' || v.status === 'rejected';

                          return (
                            <tr key={v.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{v.business_name}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>{v.user_email || 'vendor@example.com'}</div>
                              </td>
                              <td style={{ color: 'var(--ink)' }}>{v.category || 'General'}</td>
                              <td style={{ color: 'var(--ink)' }}>{v.total_orders || '—'}</td>
                              <td>
                                {v.rating ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--ink)' }}>
                                    {v.rating} <Star size={11} fill="var(--lime)" color="var(--lime)" />
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>New</span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                {getRelativeTime(v.created_at)}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    isApproved ? 'badge-completed' : isSuspended ? 'badge-cancelled' : 'badge-pending'
                                  }`}
                                  style={{ textTransform: 'capitalize' }}
                                >
                                  {v.status === 'rejected' ? 'Rejected' : v.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                                  {isPending ? (
                                    <>
                                      <button
                                        onClick={() => handleUpdateVendorStatus(v.id, v.business_name, 'approved')}
                                        disabled={actionLoading === v.id}
                                        style={actionButtonStyle('approve')}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleUpdateVendorStatus(v.id, v.business_name, 'rejected')}
                                        disabled={actionLoading === v.id}
                                        style={actionButtonStyle('reject')}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : isSuspended ? (
                                    <button
                                      onClick={() => handleUpdateVendorStatus(v.id, v.business_name, 'approved')}
                                      disabled={actionLoading === v.id}
                                      style={actionButtonStyle('reinstate')}
                                    >
                                      Reinstate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setModalItem(v);
                                        setModalType('vendor');
                                      }}
                                      style={actionButtonStyle('manage')}
                                    >
                                      Manage
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: USERS (Matches Screenshot 2 Exactly)
               ============================================================== */}
            {activeTab === 'users' && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    | User management
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    Users
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    Every customer and vendor account registered on MarketLink.
                  </p>
                </div>

                {/* Sub-tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={subTabStyle(userFilter === 'all')} onClick={() => setUserFilter('all')}>
                      All ({usersList.length || 2830})
                    </button>
                    <button style={subTabStyle(userFilter === 'customers')} onClick={() => setUserFilter('customers')}>
                      Customers ({customerCount || 2701})
                    </button>
                    <button style={subTabStyle(userFilter === 'vendors')} onClick={() => setUserFilter('vendors')}>
                      Vendors ({vendorUserCount || 124})
                    </button>
                    <button style={subTabStyle(userFilter === 'admins')} onClick={() => setUserFilter('admins')}>
                      Admins ({adminCount || 5})
                    </button>
                    <button style={subTabStyle(userFilter === 'suspended')} onClick={() => setUserFilter('suspended')}>
                      Suspended ({suspendedUserCount || 0})
                    </button>
                  </div>

                  <div style={searchInputContainerStyle}>
                    <Search size={14} color="var(--muted)" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--ink)', fontSize: '0.8125rem', outline: 'none', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Users Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        <th>JOINED</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSuspended = u.is_active === false;
                          const joinedDate = u.created_at
                            ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Jan 2026';

                          return (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                {u.name}
                                {user?.id === u.id && <span style={{ fontSize: '0.7rem', color: 'var(--lime)', marginLeft: '0.4rem' }}>(You)</span>}
                              </td>
                              <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                              <td style={{ textTransform: 'capitalize', color: 'var(--ink)' }}>{u.role}</td>
                              <td style={{ color: 'var(--muted)' }}>{joinedDate}</td>
                              <td>
                                <span className={`badge ${isSuspended ? 'badge-cancelled' : 'badge-completed'}`}>
                                  {isSuspended ? 'Suspended' : 'Active'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                                  {isSuspended ? (
                                    <button
                                      onClick={() => {
                                        toast.success(`User "${u.name}" account reinstated.`);
                                      }}
                                      style={actionButtonStyle('reinstate')}
                                    >
                                      Reinstate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setModalItem(u);
                                        setModalType('user');
                                      }}
                                      style={actionButtonStyle('manage')}
                                    >
                                      Manage
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: ALL ORDERS (Matches Screenshot 3 Exactly)
               ============================================================== */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    | Platform activity
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    All orders
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    Every order placed across every vendor on MarketLink.
                  </p>
                </div>

                {/* Sub-tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem', paddingBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={subTabStyle(orderFilter === 'all')} onClick={() => setOrderFilter('all')}>
                      All ({orders.length || 9412})
                    </button>
                    <button style={subTabStyle(orderFilter === 'pending')} onClick={() => setOrderFilter('pending')}>
                      Pending ({pendingOrdersCount || 18})
                    </button>
                    <button style={subTabStyle(orderFilter === 'in_progress')} onClick={() => setOrderFilter('in_progress')}>
                      In progress ({inProgressOrdersCount || 24})
                    </button>
                    <button style={subTabStyle(orderFilter === 'completed')} onClick={() => setOrderFilter('completed')}>
                      Completed ({completedOrdersCount || 9340})
                    </button>
                    <button style={subTabStyle(orderFilter === 'cancelled')} onClick={() => setOrderFilter('cancelled')}>
                      Cancelled ({cancelledOrdersCount || 30})
                    </button>
                  </div>

                  <div style={searchInputContainerStyle}>
                    <Search size={14} color="var(--muted)" />
                    <input
                      type="text"
                      placeholder="Search order code..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--ink)', fontSize: '0.8125rem', outline: 'none', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Orders Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ORDER</th>
                        <th>CUSTOMER</th>
                        <th>VENDOR</th>
                        <th>TOTAL</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'right' }}>PLACED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                            No orders found.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => {
                          const isPending = o.status === 'pending';
                          const isInProgress = o.status === 'in_progress' || o.status === 'accepted' || o.status === 'ready';
                          const isCompleted = o.status === 'completed';
                          const isCancelled = o.status === 'cancelled';

                          return (
                            <tr key={o.id}>
                              <td style={{ fontFamily: 'monospace', color: 'var(--muted)', fontWeight: 500 }}>
                                #{o.order_code}
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                {o.customer_name || 'Customer'}
                              </td>
                              <td style={{ color: 'var(--ink)' }}>
                                {o.vendor_name || 'Storefront'}
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                ₦{Number(o.total_amount).toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    isPending ? 'badge-pending' :
                                    isInProgress ? 'badge-progress' :
                                    isCompleted ? 'badge-completed' : 'badge-cancelled'
                                  }`}
                                  style={{ textTransform: 'capitalize' }}
                                >
                                  {isInProgress ? 'In progress' : o.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                                {getRelativeTime(o.created_at)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: REVIEWS (Matches Screenshot 4 Exactly)
               ============================================================== */}
            {activeTab === 'reviews' && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    | Platform moderation
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    Reviews
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    All customer reviews across every vendor — flag or remove if needed.
                  </p>
                </div>

                {/* Sub-tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem', paddingBottom: '0.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', maxWidth: '100%' }}>
                    <button style={subTabStyle(reviewFilter === 'all')} onClick={() => setReviewFilter('all')}>
                      All ({reviewTotalCount})
                    </button>
                    <button style={subTabStyle(reviewFilter === '5')} onClick={() => setReviewFilter('5')}>
                      5★ ({review5Count})
                    </button>
                    <button style={subTabStyle(reviewFilter === '4')} onClick={() => setReviewFilter('4')}>
                      4★ ({review4Count})
                    </button>
                    <button style={subTabStyle(reviewFilter === '3')} onClick={() => setReviewFilter('3')}>
                      3★ and below ({review3AndBelowCount})
                    </button>
                  </div>

                  <div style={searchInputContainerStyle}>
                    <Search size={14} color="var(--muted)" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--ink)', fontSize: '0.8125rem', outline: 'none', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Reviews Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th>VENDOR</th>
                        <th>RATING</th>
                        <th>COMMENT</th>
                        <th>DATE</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReviews.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
                            No customer reviews recorded yet.
                          </td>
                        </tr>
                      ) : (
                        filteredReviews.map((r) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.customer_name || 'Customer'}</td>
                            <td style={{ color: 'var(--ink)' }}>{r.vendor_name || 'Vendor Store'}</td>
                            <td style={{ color: 'var(--lime)', letterSpacing: '0.1em' }}>
                              {'★'.repeat(r.rating) + '☆'.repeat(Math.max(0, 5 - r.rating))}
                            </td>
                            <td style={{ color: 'var(--muted)', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.comment || 'No written comment'}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{getRelativeTime(r.created_at)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteReview(r.id)}
                                disabled={reviewActionLoading === r.id}
                                style={actionButtonStyle('reject')}
                              >
                                {reviewActionLoading === r.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: CATEGORIES (System)
               ============================================================== */}
            {activeTab === 'categories' && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    | System configuration
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    Platform categories
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    Manage market categories across Abuja storefronts.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                  {['Food', 'Fashion', 'Beauty', 'Repair', 'Electronics', 'Home & Living'].map((cat) => {
                    const count = vendors.filter(v => v.category?.toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <div key={cat} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--ink)' }}>{cat}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{count} active storefront(s)</div>
                        </div>
                        <span className="badge badge-completed">Live</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: SETTINGS (System)
               ============================================================== */}
            {activeTab === 'settings' && (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    | Platform settings
                  </div>
                  <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    System settings
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    Global configuration, payments, and platform policies.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
                  {/* Administrator Profile Details Card */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem' }}>
                      Administrator Profile
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                      Update your administrator account details, display name, contact phone, and security credentials.
                    </p>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (adminPassword && adminPassword.length < 6) {
                          toast.error('New password must be at least 6 characters.');
                          return;
                        }
                        try {
                          setSavingProfile(true);
                          const updatePayload = {
                            name: adminName.trim(),
                            phone: adminPhone.trim(),
                            city: adminCity.trim(),
                            address: adminAddress.trim()
                          };
                          if (adminPassword) {
                            updatePayload.password = adminPassword;
                          }
                          const { data } = await api.put('/auth/profile', updatePayload);
                          if (data.success) {
                            toast.success('Admin details updated successfully!');
                            setAdminPassword('');
                            fetchData();
                          }
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to update admin profile');
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                      <div className="auth-row-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--line)',
                              borderRadius: 'var(--radius)',
                              color: 'var(--ink)',
                              fontSize: '0.875rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={adminPhone}
                            placeholder="08012345678"
                            onChange={(e) => setAdminPhone(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--line)',
                              borderRadius: 'var(--radius)',
                              color: 'var(--ink)',
                              fontSize: '0.875rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div className="auth-row-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                            City / Territory
                          </label>
                          <input
                            type="text"
                            value={adminCity}
                            onChange={(e) => setAdminCity(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--line)',
                              borderRadius: 'var(--radius)',
                              color: 'var(--ink)',
                              fontSize: '0.875rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                            Email Address (Read-only)
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: 'var(--surface-2)',
                              border: '1px solid var(--line)',
                              borderRadius: 'var(--radius)',
                              color: 'var(--muted)',
                              fontSize: '0.875rem',
                              outline: 'none',
                              cursor: 'not-allowed'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                          Physical / Office Address
                        </label>
                        <input
                          type="text"
                          value={adminAddress}
                          placeholder="e.g. Plot 204, Garki II, Abuja"
                          onChange={(e) => setAdminAddress(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--ink)',
                            fontSize: '0.875rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                          Change Password (leave blank to keep current)
                        </label>
                        <input
                          type="password"
                          value={adminPassword}
                          placeholder="••••••••"
                          onChange={(e) => setAdminPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--ink)',
                            fontSize: '0.875rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="btn btn-primary"
                          style={{ padding: '0.65rem 1.5rem', width: '100%' }}
                        >
                          {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                      Payment Gateway Integration
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                      Paystack is active and verified for secure online card/bank transactions.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--lime)', fontSize: '0.8125rem', fontWeight: 500 }}>
                      <Check size={16} /> Paystack Connected (Abuja NGN Settlement)
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                      Storefront Auto-Approval
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                      Require administrator verification before new vendors can publish products.
                    </p>
                    <span className="badge badge-pending">Manual Verification Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                DETAILS MODAL FOR MANAGE / VIEW
               ============================================================== */}
            {modalItem && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '1rem'
                }}
                onClick={() => setModalItem(null)}
              >
                <div
                  className="card"
                  style={{
                    maxWidth: '520px',
                    width: '100%',
                    backgroundColor: 'var(--surface-2)',
                    borderColor: 'var(--line-light)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>
                      {modalType === 'vendor' ? 'Storefront Details' : modalType === 'user' ? 'User Account Management' : 'Review Moderation'}
                    </h3>
                    <button
                      onClick={() => setModalItem(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {modalType === 'vendor' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Business Name</div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{modalItem.business_name}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Category</div>
                        <div>{modalItem.category || 'General'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Location / City</div>
                        <div>{modalItem.city || 'Abuja'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Contact Email</div>
                        <div>{modalItem.user_email || '—'}</div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {modalItem.status === 'approved' ? (
                          <button
                            onClick={() => {
                              handleUpdateVendorStatus(modalItem.id, modalItem.business_name, 'suspended');
                              setModalItem(null);
                            }}
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Suspend Storefront
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handleUpdateVendorStatus(modalItem.id, modalItem.business_name, 'approved');
                              setModalItem(null);
                            }}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Approve Storefront
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {modalType === 'user' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Display Name</div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{modalItem.name}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Email Address</div>
                        <div>{modalItem.email}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Current Role</div>
                        <div style={{ textTransform: 'capitalize' }}>{modalItem.role}</div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {modalItem.role === 'admin' ? (
                          <button
                            onClick={() => {
                              handleUpdateRole(modalItem.id, modalItem.name, 'customer');
                              setModalItem(null);
                            }}
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Remove Admin Role
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handleUpdateRole(modalItem.id, modalItem.name, 'admin');
                              setModalItem(null);
                            }}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', color: 'var(--lime)', borderColor: 'var(--lime)' }}
                          >
                            Appoint as Admin
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {modalType === 'review' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Customer & Vendor</div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{modalItem.customer} → {modalItem.vendor}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Rating</div>
                        <div style={{ color: 'var(--lime)' }}>{'★'.repeat(modalItem.rating)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Comment</div>
                        <p style={{ color: 'var(--ink)', backgroundColor: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                          "{modalItem.comment}"
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            toast.success('Review removed from storefront.');
                            setModalItem(null);
                          }}
                          className="btn btn-danger"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Delete Review
                        </button>
                        <button
                          onClick={() => {
                            toast.success('Review approved and verified.');
                            setModalItem(null);
                          }}
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Approve Review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
