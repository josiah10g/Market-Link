import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import api from '../api/axios';

export const Home = () => {
  const [vendors, setVendors] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [platformStats, setPlatformStats] = useState({ vendors: 0, orders: 0, rating: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [vendorsRes, productsRes, statsRes] = await Promise.all([
          api.get('/vendors?limit=4'),
          api.get('/products?limit=4'),
          api.get('/platform/stats')
        ]);

        if (vendorsRes.data.success) {
          setVendors(vendorsRes.data.data.slice(0, 3));
        }
        if (productsRes.data.success) {
          setPopularProducts(productsRes.data.data);
        }
        if (statsRes.data.success) {
          setPlatformStats(statsRes.data);
        }
      } catch (err) {
        console.error('Home data load error:', err);
        setError('Could not connect to MarketLink services. Please ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, paddingBottom: '4rem' }}>
        {/* Hero Section matching mockup exactly */}
        <section style={{ padding: '3.5rem 0 2.5rem' }}>
          <div className="container">
            <div
              className="responsive-hero-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '3rem',
                alignItems: 'center'
              }}
            >
              {/* Left Column: Heading & Platform Pitch */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: 'var(--lime)',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--lime)' }} />
                  Live in Abuja
                </div>

                <h1
                  className="heading-display"
                  style={{
                    fontSize: '2.85rem',
                    lineHeight: 1.15,
                    marginBottom: '1.25rem',
                    color: 'var(--ink)'
                  }}
                >
                  Order from real vendors near you.
                </h1>

                <p
                  style={{
                    fontSize: '1rem',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    maxWidth: '480px',
                    marginBottom: '2rem'
                  }}
                >
                  MarketLink connects customers with local food, tailors, beauty and repair businesses — with real order tracking, not another WhatsApp thread.
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Link to="/vendors" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                    Browse Vendors
                  </Link>
                  <Link to="/register" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                    Become a Vendor
                  </Link>
                </div>

                {/* Hero Platform Metrics (Live from Supabase) */}
                <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3rem', borderTop: '1px solid var(--line)', paddingTop: '1.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {platformStats.vendors}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Active vendors</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {platformStats.orders}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Orders fulfilled</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--lime)' }}>
                      {platformStats.rating ? `${platformStats.rating}★` : 'New'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Avg. customer rating</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Vendor Index List (Deliberately avoids generic repeated card grid) */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    borderBottom: '1px solid var(--line)',
                    backgroundColor: 'var(--surface-2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                    Featured Abuja Storefronts
                  </span>
                  <Link to="/vendors" style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 500 }}>
                    View all →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {vendors.length > 0 ? (
                    vendors.map((vendor, index) => (
                      <Link
                        key={vendor.id}
                        to={`/vendors`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.1rem 1.25rem',
                          borderBottom: index < vendors.length - 1 ? '1px solid var(--line)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                          e.currentTarget.style.paddingLeft = '1.45rem';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.paddingLeft = '1.25rem';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: 600 }}>
                            #0{index + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>
                              {vendor.business_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              {vendor.city} · {vendor.category}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-progress" style={{ fontSize: '0.6875rem' }}>
                            {vendor.category}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--lime)', fontWeight: 600 }}>
                            {vendor.rating ? `${vendor.rating} ★` : 'New'}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      Loading vendor list...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular This Week Section */}
        <section style={{ padding: '2rem 0 3rem' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="heading-display" style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                  Popular this week
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  Top trending items and bookable services from verified Abuja merchants
                </p>
              </div>
              <Link to="/products" className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}>
                View all products
              </Link>
            </div>

            {loading ? (
              <LoadingState message="Loading catalog..." />
            ) : error ? (
              <ErrorState message={error} />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Order Lifecycle Stepper matching reference banner */}
        <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', backgroundColor: 'var(--surface)', padding: '2rem 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                State Machine Order Pipeline
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '800px',
                margin: '0 auto'
              }}
            >
              {[
                { label: 'Pending', desc: 'Order received', active: true },
                { label: 'Accepted', desc: 'Vendor confirmed', active: true },
                { label: 'In Progress', desc: 'Processing / fulfillment', active: true },
                { label: 'Ready', desc: 'Available for pickup', active: false },
                { label: 'Completed', desc: 'Delivered & closed', active: false }
              ].map((step, idx, arr) => (
                <React.Fragment key={step.label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.35rem' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: step.active ? 'var(--lime)' : 'var(--line-light)',
                        boxShadow: step.active ? '0 0 10px rgba(185, 255, 102, 0.4)' : 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step.active ? 'var(--ink)' : 'var(--muted)' }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div
                      style={{
                        flexGrow: 1,
                        height: '1px',
                        backgroundColor: step.active && arr[idx + 1].active ? 'var(--lime)' : 'var(--line)',
                        margin: '0 0.5rem',
                        marginBottom: '1rem'
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '2rem 0', backgroundColor: 'var(--bg)', color: 'var(--muted)', fontSize: '0.8125rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            MarketLink · Multi-Vendor Commerce Platform 2026
          </div>
          <div>
            All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
