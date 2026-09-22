import React, { useState, useEffect } from 'react';
import { Check, X, ShieldAlert, Star, Store, Users, ShoppingBag, Shield, ShieldCheck, UserCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [roleActionLoading, setRoleActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vendorsRes, ordersRes, usersRes] = await Promise.all([
        api.get('/vendors/admin/all'),
        api.get('/orders/admin/all'),
        api.get('/auth/users')
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

  const handleUpdateStatus = async (vendorId, newStatus) => {
    try {
      setActionLoading(vendorId);
      const { data } = await api.put(`/vendors/${vendorId}/status`, { status: newStatus });
      if (data.success) {
        toast.success(`Vendor status updated to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update vendor status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (userId, targetRole) => {
    const confirmMsg = targetRole === 'admin' 
      ? 'Appoint this user as an Admin? They will have full administrative privileges.'
      : 'Remove Admin privileges and set this user as customer?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setRoleActionLoading(userId);
      const { data } = await api.put(`/auth/users/${userId}/role`, { role: targetRole });
      if (data.success) {
        toast.success(`User role updated to ${targetRole}`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setRoleActionLoading(null);
    }
  };

  const pendingVendors = vendors.filter((v) => v.status === 'pending');
  const activeVendors = vendors.filter((v) => v.status !== 'pending');

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar Navigation */}
      <Sidebar role="admin" />

      {/* Main Admin Console */}
      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem 3rem', overflowY: 'auto' }}>
        {/* Header with Greeting matching screenshot */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            | Admin console
          </div>
          <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.3rem' }}>
            Good afternoon, Admin
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Here's what's happening across MarketLink today.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading platform overview..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* 4 Platform Metrics Cards matching Admin screenshot */}
            <div
              className="responsive-stats-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.25rem',
                marginBottom: '2.5rem'
              }}
            >
              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total vendors</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {stats?.total_vendors || vendors.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+8 this month</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total users</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {stats?.total_users || 2830}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+204 this month</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Platform orders</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {stats?.total_orders || orders.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+312 this week</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Pending approvals</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: pendingVendors.length > 0 ? 'var(--status-pending)' : 'var(--muted)' }}>
                  {pendingVendors.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-pending)' }}>Needs review</div>
              </div>
            </div>

            {/* Vendor Approvals Queue matching screenshot */}
            <div id="vendors" style={{ marginBottom: '3rem', scrollMarginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>
                  Vendor approvals
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {pendingVendors.length} storefront(s) awaiting verification
                </span>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Category</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVendors.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--lime)' }}>
                          No pending applications. Verification queue is clear!
                        </td>
                      </tr>
                    ) : (
                      pendingVendors.map((pv) => (
                        <tr key={pv.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{pv.business_name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>{pv.user_email}</div>
                          </td>
                          <td>
                            <span className="badge badge-progress" style={{ fontSize: '0.6875rem' }}>
                              {pv.category}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {new Date(pv.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="badge badge-pending">Pending</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleUpdateStatus(pv.id, 'approved')}
                                disabled={actionLoading === pv.id}
                                className="btn btn-outline"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.65rem',
                                  color: 'var(--lime)',
                                  borderColor: 'var(--lime)'
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(pv.id, 'suspended')}
                                disabled={actionLoading === pv.id}
                                className="btn btn-danger"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
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

            {/* Recently Active Vendors Table matching screenshot */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>
                  Recently active vendors
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Audit & compliance control
                </span>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Category</th>
                      <th>Orders</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVendors.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.business_name}</td>
                        <td>{v.category}</td>
                        <td>{v.total_orders || 0}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--lime)', fontWeight: 600 }}>
                            <Star size={12} fill="var(--lime)" /> {v.rating ? v.rating : 'New'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${v.status === 'approved' ? 'badge-completed' : 'badge-cancelled'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {v.status === 'approved' ? (
                            <button
                              onClick={() => handleUpdateStatus(v.id, 'suspended')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--status-cancelled)',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(v.id, 'approved')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--lime)',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Users & Admin Management */}
            <div id="users" style={{ marginTop: '2.5rem', scrollMarginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="heading-display" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} color="var(--lime)" /> User & Admin Management
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>
                    Appoint trusted users as Admins or revoke access directly from the UI
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--lime)', background: 'rgba(185, 255, 102, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(185, 255, 102, 0.2)' }}>
                  {usersList.filter(u => u.role === 'admin').length} Active Admins
                </span>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name / Display</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th>Current Role</th>
                      <th style={{ textAlign: 'right' }}>Admin Privileges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => {
                      const isCurrentUser = user && user.id === u.id;
                      const isAdmin = u.role === 'admin';
                      const isRoleLoading = roleActionLoading === u.id;

                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                            {u.name} {isCurrentUser && <span style={{ fontSize: '0.7rem', color: 'var(--lime)', marginLeft: '0.4rem' }}>(You)</span>}
                          </td>
                          <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{u.email}</td>
                          <td style={{ fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{u.city || 'Abuja'}</td>
                          <td>
                            <span 
                              className={`badge ${
                                u.role === 'admin' 
                                  ? 'badge-completed' 
                                  : u.role === 'vendor' 
                                  ? 'badge-ready' 
                                  : 'badge-pending'
                              }`}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isCurrentUser ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Current Session</span>
                            ) : isRoleLoading ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Updating...</span>
                            ) : isAdmin ? (
                              <button
                                onClick={() => handleUpdateRole(u.id, 'customer')}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: 'var(--status-cancelled)',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                                title="Remove admin privileges"
                              >
                                <X size={12} /> Remove Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateRole(u.id, 'admin')}
                                style={{
                                  background: 'rgba(185, 255, 102, 0.1)',
                                  border: '1px solid rgba(185, 255, 102, 0.3)',
                                  color: 'var(--lime)',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                                title="Promote to admin"
                              >
                                <Shield size={12} /> Appoint Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
