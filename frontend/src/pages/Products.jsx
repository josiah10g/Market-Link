import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Store, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { LoadingState, EmptyState, ErrorState } from '../components/StateIndicators';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mismatchModal, setMismatchModal] = useState(null);

  const [searchParams] = useSearchParams();
  const vendorFilter = searchParams.get('vendor_id');

  const [currentVendor, setCurrentVendor] = useState(null);
  const navigate = useNavigate();

  const { switchVendorAndAdd } = useCart();

  const categories = ['All', 'Meals', 'Snacks', 'Traditional', 'Suits', 'Hairstyling', 'Makeup', 'Screens', 'Hardware'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      if (vendorFilter) params.append('vendor_id', vendorFilter);
      if (sort === 'price_asc') params.append('sort', 'price_asc');
      if (sort === 'price_desc') params.append('sort', 'price_desc');

      const { data } = await api.get(`/products?${params.toString()}`);
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (vendorFilter) {
      api.get(`/vendors/${vendorFilter}`).then(res => {
        if (res.data.success) {
          setCurrentVendor(res.data.data);
        }
      }).catch(() => setCurrentVendor(null));
    } else {
      setCurrentVendor(null);
    }
  }, [category, sort, vendorFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, padding: '2.5rem 0 4rem' }}>
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="heading-display" style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--ink)' }}>
              {currentVendor ? currentVendor.business_name : 'Browse Catalog'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              {currentVendor
                ? `${currentVendor.description || 'Verified local vendor'} · ${currentVendor.city || 'Abuja'}`
                : 'Real-time stock and transparent turnaround times directly from local Abuja businesses.'}
            </p>

            {vendorFilter && (
              <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--surface-2)', border: '1px solid var(--lime)', padding: '0.35rem 0.85rem', borderRadius: '4px' }}>
                <Store size={14} color="var(--lime)" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>
                  Viewing items from: <strong>{currentVendor?.business_name || `Vendor #${vendorFilter}`}</strong>
                </span>
                <button
                  onClick={() => navigate('/products')}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}
                  title="Clear vendor filter"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Search, Category & Sort Controls */}
          <div
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
            {/* Category Tags */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: category === cat ? 'var(--lime)' : 'var(--line)',
                    backgroundColor: category === cat ? 'var(--lime-soft)' : 'var(--surface)',
                    color: category === cat ? 'var(--lime)' : 'var(--muted)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <form onSubmit={handleSearch} style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="form-input"
                  style={{ paddingLeft: '2.1rem', paddingRight: '0.8rem', paddingBlock: '0.45rem' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </form>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="form-input"
                style={{ width: 'auto', paddingBlock: '0.45rem', fontSize: '0.8125rem' }}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <LoadingState message="Loading catalog items..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filter tags or search terms."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onVendorMismatch={(mismatchDetails) => setMismatchModal(mismatchDetails)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Vendor Mismatch Warning Modal (Strict Single-Vendor Cart Policy) */}
      {mismatchModal && (
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.75rem' }}>
              Replace items in cart?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Your cart currently contains items from <strong style={{ color: 'var(--ink)' }}>{mismatchModal.currentVendor}</strong>. MarketLink orders are fulfilled per single vendor.
              Would you like to clear your cart and start a new order with <strong style={{ color: 'var(--lime)' }}>{mismatchModal.newVendor}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMismatchModal(null)}
                className="btn btn-outline"
                style={{ padding: '0.5rem 1rem' }}
              >
                Keep Current Cart
              </button>
              <button
                onClick={() => {
                  switchVendorAndAdd(
                    mismatchModal.pendingProduct,
                    mismatchModal.pendingVendor,
                    mismatchModal.pendingQuantity
                  );
                  setMismatchModal(null);
                }}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Clear & Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
