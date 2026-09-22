import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, RefreshCw, Award, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const VendorReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ rating: null, rating_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/reviews/vendor/mine');
      if (res.data.success) {
        setReviews(res.data.data);
        setSummary({
          rating: res.data.rating,
          rating_count: res.data.rating_count
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Sidebar role="vendor" businessName={user?.name || 'Vendor'} />

      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: '0.35rem', color: 'var(--ink)' }}>
              Customer Reviews
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Feedback and ratings submitted by customers after completing their orders.
            </p>
          </div>

          <button
            onClick={fetchReviews}
            className="btn btn-outline"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Rating Summary Header Banner */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            border: '1px solid var(--line)',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius)',
                backgroundColor: 'rgba(185, 255, 102, 0.1)',
                border: '1px solid rgba(185, 255, 102, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Award size={32} color="var(--lime)" />
            </div>

            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Store Reputation
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.2rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--lime)' }}>
                  {summary.rating ? Number(summary.rating).toFixed(1) : '—'}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/ 5.0</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', marginBottom: '0.35rem' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  fill={summary.rating && s <= Math.round(Number(summary.rating)) ? 'var(--lime)' : 'transparent'}
                  color={summary.rating && s <= Math.round(Number(summary.rating)) ? 'var(--lime)' : 'var(--line-light)'}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600 }}>
              Based on {summary.rating_count || reviews.length} verified order {reviews.length === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <LoadingState message="Loading store reviews..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReviews} />
        ) : reviews.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            <MessageSquare size={36} color="var(--line-light)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
              No reviews yet
            </p>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
              When customers complete orders from your storefront, they will be invited to leave a star rating and feedback here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.95rem' }}>
                        {rev.customer_name}
                      </span>
                      {rev.order_code && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--surface-2)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            color: 'var(--lime)',
                            border: '1px solid var(--line)'
                          }}
                        >
                          Order #{rev.order_code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <Calendar size={12} />
                      {new Date(rev.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Stars */}
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <Star
                        key={starVal}
                        size={15}
                        fill={starVal <= rev.rating ? 'var(--lime)' : 'transparent'}
                        color={starVal <= rev.rating ? 'var(--lime)' : 'var(--line-light)'}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                    "{rev.comment}"
                  </p>
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                    No written comment provided.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorReviews;
