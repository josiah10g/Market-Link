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
        success(`Order status updated to "${newStatus.replace('_', ' ')}"`);
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: '0.35rem', color: 'var(--ink)' }}>
              Orders Workhorse
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Full operational order stream, customer fulfillment actions, and detailed dispatch notes.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="btn btn-outline"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh Stream
          </button>
        </div>

        {/* Status Tabs */}
        <div
          className="responsive-orders-tabs"
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--line)'
          }}
        >
          {statusTabs.map((tab) => {
            const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--lime)' : 'transparent',
                  backgroundColor: isActive ? 'var(--lime-soft)' : 'var(--surface)',
                  color: isActive ? 'var(--lime)' : 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    backgroundColor: isActive ? 'rgba(185, 255, 102, 0.2)' : 'var(--surface-2)',
                    color: isActive ? 'var(--lime)' : 'var(--muted)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search by order code or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
          />
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
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items Summary</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--lime)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        #{o.order_code}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                        {o.payment_method?.replace('_', ' ') || 'Pay on delivery'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{o.customer_name}</div>
                      {o.customer_phone && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{o.customer_phone}</div>}
                    </td>
                    <td style={{ maxWidth: '280px', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                      {o.items?.map((it) => `${it.product_name} × ${it.quantity}`).join(', ') || 'Item'}
                    </td>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-serif)', fontSize: '0.95rem' }}>
                      ₦{Number(o.total_amount).toLocaleString()}
                    </td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                        {renderStatusAction(o)}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="btn btn-ghost"
                          style={{ padding: '0.3rem', color: 'var(--muted)' }}
                          title="View order details"
                        >
                          <Eye size={15} />
                        </button>
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
