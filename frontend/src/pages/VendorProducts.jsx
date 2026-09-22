import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Image as ImageIcon, Upload, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, ArrowUpDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const VendorProducts = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc, stock_asc

  // Add Product Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Meals');
  const [customProdCategory, setCustomProdCategory] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdLeadTime, setNewProdLeadTime] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Meals');
  const [customEditProdCategory, setCustomEditProdCategory] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdLeadTime, setEditProdLeadTime] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState(false);

  // Delete Confirm
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/products/vendor/mine');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Quick Active/Inactive Toggle
  const handleToggleActive = async (prod) => {
    try {
      const updatedStatus = !prod.is_active;
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_active: updatedStatus } : p))
      );

      await api.put(`/products/${prod.id}`, { is_active: updatedStatus });
      success(`"${prod.name}" marked as ${updatedStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toastError('Could not update active status');
      fetchProducts();
    }
  };

  // Add Product submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newProdPrice.replace(/,/g, ''));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toastError('Please enter a valid positive price.');
      return;
    }

    const parsedStock = parseInt(newProdStock.replace(/,/g, ''), 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toastError('Stock quantity cannot be negative.');
      return;
    }

    try {
      setSavingProduct(true);
      let uploadedUrl = null;

      if (imageFile) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const uploadRes = await api.post('/products/upload-image', {
          imageBase64: base64Data,
          filename: imageFile.name
        });

        if (uploadRes.data.success) {
          uploadedUrl = uploadRes.data.imageUrl;
        }
      }

      const effectiveCategory = newProdCategory === 'Other'
        ? (customProdCategory.trim() || 'General')
        : newProdCategory;

      await api.post('/products', {
        name: newProdName.trim(),
        description: newProdDesc.trim(),
        price: parsedPrice,
        category: effectiveCategory,
        stock_quantity: parsedStock,
        lead_time: newProdLeadTime.trim() || 'Same-Day',
        image_url: uploadedUrl
      });

      setIsAddOpen(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setCustomProdCategory('');
      setNewProdStock('10');
      setImageFile(null);
      setImagePreview('');
      success(`"${newProdName}" added to catalog successfully!`);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not add product';
      toastError(msg);
    } finally {
      setSavingProduct(false);
    }
  };

  // Open Edit
  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setEditProdName(prod.name || '');
    setEditProdDesc(prod.description || '');
    setEditProdPrice(prod.price ? Number(prod.price).toLocaleString() : '');

    const standardCategories = ['Meals', 'Snacks', 'Traditional', 'Fashion', 'Hairstyling', 'Makeup', 'Screens', 'Hardware'];
    if (standardCategories.includes(prod.category)) {
      setEditProdCategory(prod.category);
      setCustomEditProdCategory('');
    } else {
      setEditProdCategory('Other');
      setCustomEditProdCategory(prod.category || '');
    }

    setEditProdStock(prod.stock_quantity !== undefined ? String(prod.stock_quantity) : '0');
    setEditProdLeadTime(prod.lead_time || '');
    setEditImageFile(null);
    setEditImagePreview(prod.image_url || '');
  };

  // Update Product submit
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const parsedPrice = parseFloat(editProdPrice.replace(/,/g, ''));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toastError('Please enter a valid positive price.');
      return;
    }

    const parsedStock = parseInt(editProdStock.replace(/,/g, ''), 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toastError('Stock quantity cannot be negative.');
      return;
    }

    try {
      setUpdatingProduct(true);
      let uploadedUrl = editImagePreview;

      if (editImageFile) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(editImageFile);
        });

        const uploadRes = await api.post('/products/upload-image', {
          imageBase64: base64Data,
          filename: editImageFile.name
        });
        if (uploadRes.data.success) {
          uploadedUrl = uploadRes.data.imageUrl;
        }
      }

      const finalCategory = editProdCategory === 'Other'
        ? (customEditProdCategory.trim() || 'General')
        : editProdCategory;

      await api.put(`/products/${editingProduct.id}`, {
        name: editProdName.trim(),
        description: editProdDesc.trim(),
        price: parsedPrice,
        category: finalCategory,
        stock_quantity: parsedStock,
        lead_time: editProdLeadTime.trim() || 'Same-Day',
        image_url: uploadedUrl
      });

      success(`"${editProdName}" updated successfully!`);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not update product';
      toastError(msg);
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your catalog?`)) return;
    try {
      setDeletingId(id);
      await api.delete(`/products/${id}`);
      success(`"${name}" removed from catalog.`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not delete product');
    } finally {
      setDeletingId(null);
    }
  };

  // Category list derived
  const allCategories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filtering & Sorting
  const filteredProducts = products
    .filter((p) => {
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'stock_asc') return Number(a.stock_quantity) - Number(b.stock_quantity);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Sidebar role="vendor" businessName={user?.name || 'Vendor'} />

      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {/* Header matching screenshot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              | Catalog
            </div>
            <h1 className="heading-display" style={{ fontSize: '2.4rem', marginBottom: '0.3rem', color: 'var(--ink)' }}>
              Products
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              Manage what customers can order from your store.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.55rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Plus size={15} /> Add product
          </button>
        </div>

        {/* Filter Tabs & Search Bar matching screenshot */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {/* Status / Category Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'all', label: `All (${products.length})` },
              { id: 'active', label: `Active (${products.filter(p => p.is_active).length})` },
              { id: 'inactive', label: `Inactive (${products.filter(p => !p.is_active).length})` },
              { id: 'low_stock', label: `Low stock (${products.filter(p => p.stock_quantity <= 5).length})` }
            ].map((tab) => {
              const isActive = (tab.id === 'all' && categoryFilter === 'All') || categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id === 'all' ? 'All' : tab.id)}
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
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input right aligned matching screenshot */}
          <div style={{ minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search products..."
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

        {/* 4-Column Product Grid matching Screenshot 3 */}
        {loading ? (
          <LoadingState message="Loading catalog..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : filteredProducts.length === 0 ? (
          <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--ink)', fontWeight: 600 }}>No products found</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {searchQuery || categoryFilter !== 'All' ? 'No items match your active filters.' : 'Your store catalog is currently empty.'}
            </p>
            <button onClick={() => setIsAddOpen(true)} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
              <Plus size={14} /> Add First Product
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}
          >
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Image or Name Placeholder Header Box */}
                <div
                  style={{
                    height: '110px',
                    backgroundColor: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid var(--line)',
                    position: 'relative'
                  }}
                >
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                      {prod.name}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    {prod.category}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)', marginBottom: '0.6rem' }}>
                    {prod.name}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', marginBottom: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>
                      ₦{Number(prod.price).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: prod.is_active ? 'var(--lime)' : 'var(--muted)' }}>
                      {prod.is_active ? `• ${prod.stock_quantity} left` : '• Inactive'}
                    </span>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
                    <button
                      onClick={() => openEditProduct(prod)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--ink)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(prod.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--status-cancelled)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product Modal */}
        {isAddOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2.5rem 1rem',
              overflowY: 'auto'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddOpen(false);
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                margin: 'auto',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 16px 40px rgba(0,0,0,0.7)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)' }}>
                  Add Product / Service
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct}>
                <div className="form-group">
                  <label className="form-label">Item / Service Name</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Egusi Soup & Pounded Yam"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input
                    type="text"
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Ingredients or service scope"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label">Price (₦)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newProdPrice}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setNewProdPrice(raw ? Number(raw).toLocaleString() : '');
                      }}
                      placeholder="4,500"
                      className="form-input"
                      style={{ fontWeight: 600, color: 'var(--ink)' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="form-input"
                      style={{ cursor: 'pointer', backgroundColor: 'var(--surface-2)' }}
                    >
                      <option value="Meals">Meals & Cooked Food</option>
                      <option value="Snacks">Snacks & Pastries</option>
                      <option value="Traditional">Traditional Delicacies</option>
                      <option value="Fashion">Tailoring & Fashion</option>
                      <option value="Hairstyling">Hairstyling & Braids</option>
                      <option value="Makeup">Makeup & Glam</option>
                      <option value="Screens">Phone & Screen Repair</option>
                      <option value="Hardware">Laptop & Hardware Tech</option>
                      <option value="Other">Other (Custom)</option>
                    </select>
                  </div>
                </div>

                {newProdCategory === 'Other' && (
                  <div className="form-group" style={{ marginTop: '-0.35rem' }}>
                    <label className="form-label">Custom Category</label>
                    <input
                      type="text"
                      value={customProdCategory}
                      onChange={(e) => setCustomProdCategory(e.target.value)}
                      placeholder="Enter custom category name"
                      className="form-input"
                      style={{ borderColor: 'var(--lime)', backgroundColor: 'var(--surface-2)' }}
                      required={newProdCategory === 'Other'}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newProdStock}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setNewProdStock(raw ? Number(raw).toLocaleString() : '');
                      }}
                      placeholder="10"
                      className="form-input"
                      style={{ fontWeight: 600, color: 'var(--ink)' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lead Time / Turnaround</label>
                    <input
                      type="text"
                      value={newProdLeadTime}
                      onChange={(e) => setNewProdLeadTime(e.target.value)}
                      placeholder="e.g. Same-day or 24-48 hrs"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="form-input"
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                    {savingProduct ? 'Uploading...' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2.5rem 1rem',
              overflowY: 'auto'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingProduct(null);
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                margin: 'auto',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 16px 40px rgba(0,0,0,0.7)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)' }}>
                  Edit Product #{editingProduct.id}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateProduct}>
                <div className="form-group">
                  <label className="form-label">Item / Service Name</label>
                  <input
                    type="text"
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input
                    type="text"
                    value={editProdDesc}
                    onChange={(e) => setEditProdDesc(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label">Price (₦)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editProdPrice}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setEditProdPrice(raw ? Number(raw).toLocaleString() : '');
                      }}
                      className="form-input"
                      style={{ fontWeight: 600, color: 'var(--ink)' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={editProdCategory}
                      onChange={(e) => setEditProdCategory(e.target.value)}
                      className="form-input"
                      style={{ cursor: 'pointer', backgroundColor: 'var(--surface-2)' }}
                    >
                      <option value="Meals">Meals & Cooked Food</option>
                      <option value="Snacks">Snacks & Pastries</option>
                      <option value="Traditional">Traditional Delicacies</option>
                      <option value="Fashion">Tailoring & Fashion</option>
                      <option value="Hairstyling">Hairstyling & Braids</option>
                      <option value="Makeup">Makeup & Glam</option>
                      <option value="Screens">Phone & Screen Repair</option>
                      <option value="Hardware">Laptop & Hardware Tech</option>
                      <option value="Other">Other (Custom)</option>
                    </select>
                  </div>
                </div>

                {editProdCategory === 'Other' && (
                  <div className="form-group" style={{ marginTop: '-0.35rem' }}>
                    <label className="form-label">Custom Category</label>
                    <input
                      type="text"
                      value={customEditProdCategory}
                      onChange={(e) => setCustomEditProdCategory(e.target.value)}
                      className="form-input"
                      style={{ borderColor: 'var(--lime)', backgroundColor: 'var(--surface-2)' }}
                      required={editProdCategory === 'Other'}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editProdStock}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setEditProdStock(raw ? Number(raw).toLocaleString() : '');
                      }}
                      className="form-input"
                      style={{ fontWeight: 600, color: 'var(--ink)' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lead Time / Turnaround</label>
                    <input
                      type="text"
                      value={editProdLeadTime}
                      onChange={(e) => setEditProdLeadTime(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Edit Product Media */}
                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditImageFile(file);
                        setEditImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="form-input"
                  />
                  {editImagePreview && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <img src={editImagePreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setEditingProduct(null)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updatingProduct}>
                    {updatingProduct ? 'Saving...' : 'Save Product Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorProducts;
