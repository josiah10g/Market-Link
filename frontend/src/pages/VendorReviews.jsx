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
        {/* Header matching screenshot 4 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            | Customer feedback
          </div>
          <h1 className="heading-display" style={{ fontSize: '2.4rem', marginBottom: '0.3rem', color: 'var(--ink)' }}>
            Reviews
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            What customers are saying about your store.
          </p>
        </div>

        {/* Rating Breakdown Card - only display calculated rating if reviews exist */}
        {summary.rating_count > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '2.5rem',
              alignItems: 'center',
              padding: '2rem 2.5rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              marginBottom: '2.5rem',
              maxWidth: '680px'
            }}
          >
            {/* Left: Big Number & Review count */}
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '3.2rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                {Number(summary.rating).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Average rating · {summary.rating_count} {summary.rating_count === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Right: Star Bar Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter((r) => Math.round(Number(r.rating)) === stars).length;
                const pct = summary.rating_count > 0 ? `${Math.round((count / summary.rating_count) * 100)}%` : '0%';
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                    <span style={{ width: '12px' }}>{stars}</span>
                    <div style={{ flexGrow: 1, height: '4px', backgroundColor: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: pct, height: '100%', backgroundColor: stars >= 4 ? 'var(--lime)' : 'var(--muted)' }} />
                    </div>
                    <span style={{ width: '20px', textAlign: 'right', color: 'var(--muted)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: '1.25rem 1.75rem',
              marginBottom: '2rem',
              maxWidth: '420px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'var(--surface)'
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--muted)' }}>
              No reviews
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', borderLeft: '1px solid var(--line)', paddingLeft: '1rem' }}>
              0 customer ratings recorded yet.
            </div>
          </div>
        )}

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
