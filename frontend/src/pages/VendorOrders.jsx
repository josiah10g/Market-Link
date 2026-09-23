import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, X, Eye, Phone, MapPin, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const VendorOrders = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/orders/vendor');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch vendor orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(orderId);
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        if (newStatus === 'accepted') {
          success(`Order accepted! Ready for processing.`);
        } else if (newStatus === 'cancelled') {
          success(`Order declined and cancelled.`);
        } else {
          success(`Order status updated to "${newStatus.replace('_', ' ')}"`);
        }
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Status update failed';
      toastError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatusAction = (order) => {
    if (actionLoading === order.id) {
      return <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Updating...</span>;
    }

    switch (order.status) {
      case 'pending':
        return (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleUpdateStatus(order.id, 'accepted')}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              Accept
            </button>
            <button
              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
              className="btn btn-danger"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              Cancel
            </button>
          </div>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'in_progress')}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: 'var(--lime)', borderColor: 'var(--lime)' }}
          >
            Start
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'ready')}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            Mark Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'completed')}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: '#10B981', borderColor: '#10B981', color: '#fff' }}
          >
            Mark Completed
          </button>
        );
      default:
        return <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Closed</span>;
    }
  };

  // Status tabs config
  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'ready', label: 'Ready' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      o.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Sidebar role="vendor" businessName={user?.name || 'Vendor'} />

      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {/* Header matching screenshot */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            | Order management
          </div>
          <h1 className="heading-display" style={{ fontSize: '2.4rem', marginBottom: '0.3rem', color: 'var(--ink)' }}>
            Orders
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Every order placed with your store, in one place.
          </p>
        </div>

        {/* Filter Tabs & Search Bar on the same row matching user screenshot */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* Status Tabs */}
          <div
            className="responsive-orders-tabs"
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem'
            }}
          >
            {[
              { key: 'all', label: 'All', count: orders.length },
              { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
              { key: 'accepted', label: 'Accepted', count: orders.filter(o => o.status === 'accepted').length },
              { key: 'in_progress', label: 'In progress', count: orders.filter(o => o.status === 'in_progress').length },
              { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
              { key: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
              { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: isActive ? 'var(--lime)' : 'var(--muted)',
                    padding: '0.2rem 0.4rem',
                    borderBottom: isActive ? '2px solid var(--lime)' : '2px solid transparent',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Search Input right aligned matching screenshot */}
          <div style={{ minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search order code or custom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                fontSize: '0.8125rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                borderRadius: 'var(--radius)'
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading && orders.length === 0 ? (
          <LoadingState message="Loading vendor orders..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOrders} />
        ) : filteredOrders.length === 0 ? (
          <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--ink)', fontWeight: 600 }}>No orders found</p>
            <p style={{ fontSize: '0.85rem' }}>
              {statusFilter !== 'all' ? `There are no orders matching status "${statusFilter}".` : 'No incoming orders have been placed yet.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>PLACED</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                    <td>
                      <div style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        #{o.order_code}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{o.customer_name}</div>
                    </td>
                    <td style={{ color: 'var(--ink)', fontSize: '0.8125rem' }}>
                      {o.items?.map((it) => `${it.product_name} × ${it.quantity}`).join(', ') || 'Item'}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--ink)' }}>
                      ₦{Number(o.total_amount).toLocaleString()}
                    </td>
                    <td>
                      <span 
                        className={`badge ${
                          o.status === 'pending' ? 'badge-pending' :
                          o.status === 'in_progress' ? 'badge-progress' :
                          o.status === 'accepted' ? 'badge-progress' :
                          o.status === 'ready' ? 'badge-ready' :
                          o.status === 'completed' ? 'badge-completed' : 'badge-cancelled'
                        }`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {o.status === 'in_progress' ? 'In progress' : o.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {o.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'accepted')}
                              disabled={actionLoading === o.id}
                              className="btn btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                              disabled={actionLoading === o.id}
                              className="btn btn-outline"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--muted)', borderColor: 'var(--line)' }}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {o.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'in_progress')}
                            disabled={actionLoading === o.id}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--lime)', borderColor: 'var(--lime)' }}
                          >
                            Start progress
                          </button>
                        )}
                        {o.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'ready')}
                            disabled={actionLoading === o.id}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            Mark ready
                          </button>
                        )}
                        {o.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'completed')}
                            disabled={actionLoading === o.id}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--lime)', borderColor: 'var(--lime)' }}
                          >
                            Mark completed
                          </button>
                        )}
                        {(o.status === 'completed' || o.status === 'cancelled') && (
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--muted)', borderColor: 'var(--line)' }}
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Detail Modal / Drawer */}
        {selectedOrder && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1.5rem'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedOrder(null);
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.75rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
                      Order #{selectedOrder.order_code}
                    </h3>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Placed {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Customer Info Section */}
              <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Customer Details
                </div>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.95rem' }}>{selectedOrder.customer_name}</div>
                {selectedOrder.customer_phone && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <Phone size={13} color="var(--lime)" /> {selectedOrder.customer_phone}
                  </div>
                )}
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.35rem' }}>
                  <MapPin size={13} color="var(--lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{selectedOrder.delivery_address}</span>
                </div>
                {selectedOrder.notes && (
                  <div style={{ marginTop: '0.65rem', padding: '0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px', borderLeft: '3px solid var(--lime)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Delivery Note / Instructions:</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>{selectedOrder.notes}</span>
                  </div>
                )}
              </div>

              {/* Payment Details Section */}
              <div style={{ backgroundColor: 'var(--surface-2)', padding: '0.9rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Payment Mode
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>
                    {selectedOrder.payment_method?.replace('_', ' ') || 'Pay on delivery'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Payment Status
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedOrder.payment_status === 'paid' ? 'var(--lime)' : 'var(--status-pending)' }}>
                    {selectedOrder.payment_status === 'paid' ? '✓ Paid (Paystack Online)' : 'Pay on Delivery'}
                  </div>
                  {selectedOrder.payment_reference && (
                    <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--muted)' }}>
                      Ref: {selectedOrder.payment_reference}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Items Ordered
                </div>
                <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--line)' : 'none',
                        backgroundColor: 'var(--surface)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          ₦{Number(item.price).toLocaleString()} × {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>
                        ₦{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Total Payable</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--lime)' }}>
                    ₦{Number(selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Update Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Change status:</span>
                <div>{renderStatusAction(selectedOrder)}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorOrders;
