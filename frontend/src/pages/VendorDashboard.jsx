import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Upload, Image as ImageIcon, Trash2, Edit3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const VendorDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Add Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Meals');
  const [customProdCategory, setCustomProdCategory] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdLeadTime, setNewProdLeadTime] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, ordersRes, productsRes] = await Promise.all([
        api.get('/orders/vendor/analytics'),
        api.get('/orders/vendor'),
        api.get('/products/vendor/mine')
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (productsRes.data.success) setProducts(productsRes.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load vendor data.');
    } finally {
      setLoading(false);
    }
  };

  // Edit Product Modal State
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

  useEffect(() => {
    fetchData();
  }, []);

  // Open Edit Modal
  const openEditProduct = (prod) => {
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

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

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
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not update product';
      toastError(msg);
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newProdPrice.replace(/,/g, ''));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toastError('Please enter a valid positive price.');
      return;
    }

    const parsedStock = parseInt(newProdStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toastError('Stock quantity cannot be negative.');
      return;
    }

    try {
      setUploadingImage(true);
      let uploadedUrl = null;

      if (imageFile) {
        // Convert file to Base64 and send to backend
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

      setIsAddProductOpen(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setCustomProdCategory('');
      setNewProdStock('10');
      setImageFile(null);
      setImagePreview('');
      success(`"${newProdName}" added to catalog successfully!`);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not add product';
      toastError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Next status action button helper
  const renderStatusAction = (order) => {
    if (actionLoading === order.id) {
      return <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Updating...</span>;
    }

    switch (order.status) {
      case 'pending':
        return (
          <button
            onClick={() => handleTransition(order.id, 'accepted')}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Accept →
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleTransition(order.id, 'in_progress')}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', color: 'var(--status-progress)', borderColor: 'var(--status-progress)' }}
          >
            Start progress →
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => handleTransition(order.id, 'ready')}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', color: 'var(--status-ready)', borderColor: 'var(--status-ready)' }}
          >
            Mark ready →
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleTransition(order.id, 'completed')}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Mark completed →
          </button>
        );
      case 'completed':
        return (
          <span style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 500 }}>
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar Layout */}
      <Sidebar role="vendor" businessName={analytics?.business_name || user?.vendor?.business_name || "Vendor's Store"} />

      {/* Main Content Area */}
      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem 3rem', overflowY: 'auto' }}>
        {/* Header with Greeting matching mockup screenshot */}
        <div className="responsive-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              | Vendor dashboard
            </div>
            <h1 className="heading-display" style={{ fontSize: '2.4rem', color: 'var(--ink)', marginBottom: '0.3rem' }}>
              Good afternoon, {user?.name?.split(' ')[0] || 'Vendor'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              Here's how your store is doing this week.
            </p>
          </div>

          <button
            onClick={() => setIsAddProductOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.8125rem' }}
          >
            <Plus size={15} /> Add product
          </button>
        </div>

        {actionMessage && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--lime-soft)', border: '1px solid var(--lime)', color: 'var(--lime)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
            {actionMessage}
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading vendor operations..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* 4 Metrics Cards matching Vendor Dashboard screenshot */}
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
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Total orders</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {analytics?.total_orders || orders.length}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+18 this week</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Revenue</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  ₦{Number(analytics?.total_revenue || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>+12% vs last week</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Pending orders</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--status-pending)' }}>
                  {analytics?.pending_orders || 0}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-pending)' }}>Needs action</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Avg. rating</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--lime)' }}>
                  {analytics?.rating ? `${analytics.rating}` : 'New'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                  {analytics?.rating_count > 0 ? `from ${analytics.rating_count} reviews` : 'No reviews yet'}
                </div>
              </div>
            </div>

            {/* Incoming Orders Section matching mockup */}
            <div id="orders" style={{ marginBottom: '3rem', scrollMarginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>
                  Incoming orders preview
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link
                    to="/vendor/orders"
                    style={{ fontSize: '0.8125rem', color: 'var(--lime)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    View all orders ({orders.length}) →
                  </Link>
                  <button
                    onClick={fetchData}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Refresh orders"
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Placed</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                          No incoming orders yet.
                        </td>
                      </tr>
                    ) : (
                      orders.slice(0, 8).map((o) => (
                        <tr key={o.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{o.customer_name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                              #{o.order_code}
                            </div>
                          </td>
                          <td style={{ maxWidth: '280px', color: 'var(--muted)' }}>
                            {o.items?.map((it) => `${it.product_name} × ${it.quantity}`).join(', ') || 'Items'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            ₦{Number(o.total_amount).toLocaleString()}
                          </td>
                          <td>
                            <OrderStatusBadge status={o.status} />
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {renderStatusAction(o)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Store Catalog (All Products) */}
            <div id="products" style={{ marginTop: '2.5rem', scrollMarginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="heading-display" style={{ fontSize: '1.25rem' }}>
                    My storefront catalog preview
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Snapshot of products and services listed in your store.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link
                    to="/vendor/products"
                    style={{ fontSize: '0.8125rem', color: 'var(--lime)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    Manage full catalog ({products.length}) →
                  </Link>
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    <Plus size={13} /> Add item
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Lead / Turnaround</th>
                      <th style={{ textAlign: 'right' }}>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                          No products listed yet. Click "+ Add product" to start selling.
                        </td>
                      </tr>
                    ) : (
                      products.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt=""
                                  style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: 'var(--radius)',
                                    backgroundColor: 'var(--surface-2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--muted)'
                                  }}
                                >
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{prod.name}</div>
                                {prod.description && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {prod.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-progress" style={{ fontSize: '0.6875rem' }}>
                              {prod.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>₦{Number(prod.price).toLocaleString()}</td>
                          <td>
                            <span style={{ color: prod.stock_quantity <= 5 ? 'var(--status-pending)' : 'var(--ink)', fontWeight: 600 }}>
                              {prod.stock_quantity}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                            {prod.lead_time || 'None'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => openEditProduct(prod)}
                              className="btn btn-outline"
                              style={{
                                color: 'var(--lime)',
                                borderColor: 'rgba(185, 255, 102, 0.3)',
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.65rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddProductOpen && (
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
            if (e.target === e.currentTarget) setIsAddProductOpen(false);
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
                Add New Product / Service
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
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

              {/* Price and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontWeight: 700,
                        color: 'var(--lime)',
                        fontSize: '1rem',
                        pointerEvents: 'none'
                      }}
                    >
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newProdPrice}
                      onChange={(e) => {
                        // Strip non-digits
                        const raw = e.target.value.replace(/\D/g, '');
                        if (!raw) {
                          setNewProdPrice('');
                          return;
                        }
                        // Format with thousands comma
                        const formatted = Number(raw).toLocaleString();
                        setNewProdPrice(formatted);
                      }}
                      placeholder="4,500"
                      className="form-input"
                      style={{ paddingLeft: '2.2rem', fontWeight: 600, color: 'var(--ink)' }}
                      required
                    />
                  </div>
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

              {/* Stock and Lead Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">Initial Stock Quantity</label>
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
                  <label className="form-label">Lead Time / Turnaround (Optional)</label>
                  <input
                    type="text"
                    value={newProdLeadTime}
                    onChange={(e) => setNewProdLeadTime(e.target.value)}
                    placeholder="e.g. Same-day or 24-48 hrs"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Product Media Upload (No Supabase text, with instant Delete/Remove button) */}
              <div className="form-group" style={{ marginTop: '0.25rem' }}>
                <label className="form-label">Product Image</label>
                <div
                  style={{
                    border: '1px dashed var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: 'var(--surface-hover)',
                    position: 'relative'
                  }}
                >
                  <input
                    id="prod-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />

                  {imagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: '58px',
                            height: '58px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid var(--line)'
                          }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500, margin: 0 }}>
                            {imageFile?.name}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--lime)', margin: '0.2rem 0 0 0' }}>
                            Image selected and ready
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'var(--status-cancelled)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title="Remove photo"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('prod-image-input').click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', cursor: 'pointer' }}
                    >
                      <Upload size={22} style={{ color: 'var(--lime)' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500 }}>
                        Click to select product image
                      </span>
                      <span style={{ fontSize: '0.72rem' }}>
                        PNG, JPG, WebP up to 5MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="btn btn-outline"
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading Image...' : 'Publish to Catalog'}
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
                Edit Product / Service
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}
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
                  placeholder="e.g. Egusi Soup & Pounded Yam"
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
                  placeholder="Ingredients or service scope"
                  className="form-input"
                />
              </div>

              {/* Price and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontWeight: 700,
                        color: 'var(--lime)',
                        fontSize: '1rem',
                        pointerEvents: 'none'
                      }}
                    >
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editProdPrice}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        if (!raw) {
                          setEditProdPrice('');
                          return;
                        }
                        const formatted = Number(raw).toLocaleString();
                        setEditProdPrice(formatted);
                      }}
                      placeholder="4,500"
                      className="form-input"
                      style={{ paddingLeft: '2.2rem', fontWeight: 600, color: 'var(--ink)' }}
                      required
                    />
                  </div>
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
                    placeholder="Enter custom category name"
                    className="form-input"
                    style={{ borderColor: 'var(--lime)', backgroundColor: 'var(--surface-2)' }}
                    required={editProdCategory === 'Other'}
                  />
                </div>
              )}

              {/* Stock and Lead Time */}
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
                    placeholder="10"
                    className="form-input"
                    style={{ fontWeight: 600, color: 'var(--ink)' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lead Time / Turnaround (Optional)</label>
                  <input
                    type="text"
                    value={editProdLeadTime}
                    onChange={(e) => setEditProdLeadTime(e.target.value)}
                    placeholder="e.g. Same-day or 24-48 hrs"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Product Media */}
              <div className="form-group" style={{ marginTop: '0.25rem' }}>
                <label className="form-label">Product Image</label>
                <div
                  style={{
                    border: '1px dashed var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: 'var(--surface-hover)',
                    position: 'relative'
                  }}
                >
                  <input
                    id="edit-prod-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    style={{ display: 'none' }}
                  />

                  {editImagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          style={{
                            width: '58px',
                            height: '58px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid var(--line)'
                          }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500, margin: 0 }}>
                            {editImageFile ? editImageFile.name : 'Current Image'}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--lime)', margin: '0.2rem 0 0 0' }}>
                            {editImageFile ? 'New image selected' : 'Click change to replace'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-prod-image-input').click()}
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditImageFile(null);
                            setEditImagePreview('');
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--status-cancelled)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          title="Remove photo"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('edit-prod-image-input').click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', cursor: 'pointer' }}
                    >
                      <Upload size={22} style={{ color: 'var(--lime)' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500 }}>
                        Click to upload new image
                      </span>
                      <span style={{ fontSize: '0.72rem' }}>
                        PNG, JPG, WebP up to 5MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setEditImageFile(null);
                    setEditImagePreview('');
                  }}
                  className="btn btn-outline"
                  disabled={updatingProduct}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingProduct}>
                  {updatingProduct ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
