import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { LoadingState, EmptyState, ErrorState } from '../components/StateIndicators';
import api from '../api/axios';

export const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [availableCategories, setAvailableCategories] = useState(['All', 'Food', 'Fashion', 'Beauty', 'Repairs']);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/vendors';
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search) params.append('search', search);

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const { data } = await api.get(url);
      if (data.success) {
        setVendors(data.data);
        // Collect dynamic categories from vendors
        const foundCategories = Array.from(new Set(data.data.map(v => v.category).filter(Boolean)));
        const merged = ['All', ...new Set(['Food', 'Fashion', 'Beauty', 'Repairs', ...foundCategories])];
        setAvailableCategories(merged);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, padding: '2.5rem 0 4rem' }}>
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="heading-display" style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--ink)' }}>
              Verified Local Vendors
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              Browse approved storefronts across Abuja. Direct inventory ordering and tracking.
            </p>
          </div>

          {/* Filter Bar & Search */}
          {/* Filter Bar & Search */}
          <div
            className="admin-filter-bar"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--line)'
            }}
          >
            {/* Category Pills */}
            <div className="admin-subtabs-scroll" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: category === cat ? 'var(--lime)' : 'var(--line)',
                    backgroundColor: category === cat ? 'var(--lime-soft)' : 'var(--surface)',
                    color: category === cat ? 'var(--lime)' : 'var(--muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '340px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendor name..."
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', paddingRight: '0.8rem', paddingBlock: '0.5rem', width: '100%' }}
                />
                <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                Search
              </button>
            </form>
          </div>

          {/* Vendors Grid */}
          {loading ? (
            <LoadingState message="Discovering verified storefronts..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchVendors} />
          ) : vendors.length === 0 ? (
            <EmptyState title="No vendors found" description="Try selecting a different category or clearing search filters." />
          ) : (
            <div
              className="responsive-vendor-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className="badge badge-progress">{vendor.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--lime)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <Star size={13} fill="var(--lime)" />
                        <span>{vendor.rating ? `${vendor.rating}` : 'New'}</span>
                        {vendor.rating_count > 0 && (
                          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>({vendor.rating_count})</span>
                        )}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                      {vendor.business_name}
                    </h3>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {vendor.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                      <MapPin size={13} color="var(--lime)" />
                      <span>{vendor.address || 'Abuja, Nigeria'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {vendor.total_orders || 0} orders fulfilled
                    </span>
                    <Link
                      to={`/products?vendor_id=${vendor.id}`}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      View Catalog <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Vendors;
