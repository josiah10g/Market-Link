import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Clock, CheckCircle2, AlertCircle, MessageSquare, ChevronDown, ChevronUp, Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { LoadingState, EmptyState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [searchParams] = useSearchParams();
  const newOrderCode = searchParams.get('new_order');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/orders/mine';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const { data } = await api.get(url);
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleOpenReview = (order) => {
    setReviewOrder(order);
    setRating(5);
    setComment('');
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewOrder) return;

    try {
      setReviewLoading(true);
      setReviewError('');

      const { data } = await api.post('/reviews', {
        order_id: reviewOrder.id,
        rating,
        comment: comment.trim() || undefined
      });

      if (data.success) {
        setReviewOrder(null);
        fetchOrders();
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  // Stats calculation matching customer dashboard mockup
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter((o) => ['pending', 'accepted', 'in_progress', 'ready'].includes(o.status)).length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? Number(o.total_amount) : 0), 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, padding: '2.5rem 0 4rem' }}>
        <div className="container">
          {/* Personalized Customer Greeting matching mockup screenshot */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              | Customer dashboard
            </div>
            <h1 className="heading-display" style={{ fontSize: '2.4rem', marginBottom: '0.3rem', color: 'var(--ink)' }}>
              Welcome, {user?.name || 'Customer'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              Here's an overview of your activity and orders on MarketLink.
            </p>
          </div>

          {/* New order banner notification */}
          {newOrderCode && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--lime-soft)',
                border: '1px solid var(--lime)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '2rem'
              }}
            >
              <CheckCircle2 size={18} color="var(--lime)" />
              <div>
                <strong style={{ color: 'var(--lime)' }}>Order Placed: #{newOrderCode}!</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink)', marginLeft: '0.5rem' }}>
                  The vendor has been notified and your inventory is locked. Track status below.
                </span>
              </div>
            </div>
          )}

          {/* 4 Stats Cards matching Customer Dashboard mockup */}
          <div
            className="responsive-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '2.5rem'
            }}
          >
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total orders</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                {totalOrdersCount}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>Since joining</div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Active orders</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 600, color: 'var(--lime)' }}>
                {activeOrdersCount}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>In progress now</div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total spent</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                ₦{totalSpent.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>Across local vendors</div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Saved vendors</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                {new Set(orders.map((o) => o.vendor_id)).size}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>Storefronts ordered from</div>
            </div>
          </div>

          {/* Filter Tabs matching mockup (All, Pending, In progress, Completed) */}
          <div
            className="responsive-orders-tabs"
            style={{
              display: 'flex',
              gap: '0.75rem',
              borderBottom: '1px solid var(--line)',
              paddingBottom: '0.75rem',
              marginBottom: '1.5rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {[
              { id: 'all', label: `All (${totalOrdersCount})` },
              { id: 'pending', label: 'Pending' },
              { id: 'in_progress', label: 'In progress' },
              { id: 'completed', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: filter === tab.id ? 'var(--lime)' : 'var(--muted)',
                  borderBottom: filter === tab.id ? '2px solid var(--lime)' : '2px solid transparent',
                  paddingBottom: '0.4rem',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List matching mockup screenshot items */}
          {loading ? (
            <LoadingState message="Loading your order activity..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchOrders} />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="You have no orders matching this filter."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {orders.map((order) => {
                const isExpanded = !!expandedOrders[order.id];
                return (
                  <div
                    key={order.id}
                    className="card"
                    style={{
                      padding: '1.1rem 1.25rem',
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <div
                      className="responsive-order-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        {/* Category initials pill */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--surface-2)',
                            border: '1px solid var(--line)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--muted)',
                            flexShrink: 0
                          }}
                        >
                          {order.vendor_category?.slice(0, 4) || 'Shop'}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>
                              {order.vendor_name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                              #{order.order_code}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                            {order.items && order.items.length > 0
                              ? `${order.items.length} ${order.items.length === 1 ? 'product' : 'products'} ordered`
                              : 'Order items'}
                          </div>

                          <div style={{ fontSize: '0.6875rem', color: '#627068', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={11} />
                            {new Date(order.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Fulfillment Status, Payment Status, Total Amount, Review Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <OrderStatusBadge status={order.status} />
                          <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                            {order.status === 'pending' ? 'Waiting for vendor to accept' :
                             order.status === 'accepted' ? 'Vendor accepted' :
                             order.status === 'in_progress' ? 'Being prepared' :
                             order.status === 'ready' ? 'Ready for pickup/dispatch' :
                             order.status === 'completed' ? 'Delivered' : 'Order closed'}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '95px' }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
                            ₦{Number(order.total_amount).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                            {order.payment_status === 'paid' ? (
                              <span style={{ color: 'var(--lime)', fontWeight: 600, background: 'rgba(185, 255, 102, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                                ✓ Paid (Paystack)
                              </span>
                            ) : (
                              <span style={{ color: 'var(--status-pending)', fontWeight: 500, background: 'rgba(245, 158, 11, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                                Pay on Delivery
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Review Button for completed orders only */}
                        {order.status === 'completed' && (
                          <div>
                            {order.has_reviewed ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Star size={12} fill="var(--lime)" /> Reviewed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenReview(order)}
                                className="btn btn-outline"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                              >
                                <MessageSquare size={12} /> Leave Review
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrders((prev) => ({
                              ...prev,
                              [order.id]: !prev[order.id]
                            }))
                          }
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="View purchased products"
                        >
                          <Package size={13} />
                          <span>{isExpanded ? 'Hide' : 'Products'}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable itemized products drawer */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '1rem',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid var(--line)',
                          backgroundColor: 'var(--surface-2)',
                          borderRadius: 'var(--radius)',
                          padding: '0.85rem 1rem'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Package size={13} color="var(--lime)" />
                          Purchased Products ({order.items?.length || 0})
                        </div>
                        {order.items && order.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {order.items.map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '0.8125rem',
                                  padding: '0.35rem 0',
                                  borderBottom: idx < order.items.length - 1 ? '1px dashed var(--line)' : 'none'
                                }}
                              >
                                <span style={{ color: 'var(--ink)' }}>
                                  <strong style={{ color: 'var(--lime)', marginRight: '0.4rem' }}>{it.quantity}x</strong>
                                  {it.product_name}
                                </span>
                                <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                                  ₦{(Number(it.price) * it.quantity).toLocaleString()} (₦{Number(it.price).toLocaleString()} each)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                            No item breakdown available for this order.
                          </div>
                        )}
                        {order.delivery_address && (
                          <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--line)', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div><strong>Delivery destination:</strong> {order.delivery_address}</div>
                            {order.payment_reference && (
                              <div style={{ fontFamily: 'monospace', color: 'var(--lime)', fontSize: '0.7rem' }}>
                                Ref: {order.payment_reference}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Review Modal for Completed Orders */}
      {reviewOrder && (
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
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem'
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.3rem' }}>
              Review {reviewOrder.vendor_name}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              Order #{reviewOrder.order_code}
            </p>

            {reviewError && (
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Rating (1 to 5 stars)</label>
                <div style={{ display: 'flex', gap: '0.5rem', margin: '0.4rem 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.2rem'
                      }}
                    >
                      <Star
                        size={22}
                        color={star <= rating ? 'var(--lime)' : 'var(--line-light)'}
                        fill={star <= rating ? 'var(--lime)' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review comments</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Tell us about the product quality, prep speed, or customer service..."
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {reviewLoading ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
