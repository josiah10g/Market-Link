import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, AlertCircle, Upload, Save, MapPin, Phone, Building, RefreshCw, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { LoadingState, ErrorState } from '../components/StateIndicators';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const VendorSettings = () => {
  const { user, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Meals');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Abuja');
  const [status, setStatus] = useState('pending');

  // Media
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  // Payout info state (optional demo placeholder)
  const [bankName, setBankName] = useState('Guaranty Trust Bank (GTBank)');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/vendors/me/profile');
      if (res.data.success) {
        const v = res.data.data;
        setBusinessName(v.business_name || '');
        setDescription(v.description || '');
        setPhone(v.phone || '');
        setAddress(v.address || '');
        setCity(v.city || 'Abuja');
        setStatus(v.status || 'pending');
        setLogoPreview(v.logo_url || '');
        setBannerPreview(v.banner_url || '');

        const standard = ['Meals', 'Snacks', 'Traditional', 'Fashion', 'Hairstyling', 'Makeup', 'Screens', 'Hardware'];
        if (standard.includes(v.category)) {
          setCategory(v.category);
          setCustomCategory('');
        } else {
          setCategory('Other');
          setCustomCategory(v.category || '');
        }

        setAccountName(v.business_name || '');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load store profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      let finalLogoUrl = logoPreview;
      let finalBannerUrl = bannerPreview;

      // Upload logo if new
      if (logoFile) {
        const base64Logo = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
        const uploadRes = await api.post('/products/upload-image', {
          imageBase64: base64Logo,
          filename: logoFile.name
        });
        if (uploadRes.data.success) finalLogoUrl = uploadRes.data.imageUrl;
      }

      // Upload banner if new
      if (bannerFile) {
        const base64Banner = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(bannerFile);
        });
        const uploadRes = await api.post('/products/upload-image', {
          imageBase64: base64Banner,
          filename: bannerFile.name
        });
        if (uploadRes.data.success) finalBannerUrl = uploadRes.data.imageUrl;
      }

      const finalCat = category === 'Other' ? (customCategory.trim() || 'General') : category;

      const res = await api.put('/vendors/me/profile', {
        business_name: businessName.trim(),
        description: description.trim(),
        category: finalCat,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl
      });

      if (res.data.success) {
        success('Store settings saved successfully!');
        fetchProfile();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not save store settings';
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="responsive-dashboard-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Sidebar role="vendor" businessName={user?.name || 'Vendor'} />

      <main className="responsive-dashboard-main" style={{ flexGrow: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: '0.35rem', color: 'var(--ink)' }}>
              Storefront Settings
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Manage public business branding, operational address, contact info, and payout accounts.
            </p>
          </div>

          <button
            onClick={fetchProfile}
            className="btn btn-outline"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingState message="Loading storefront settings..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProfile} />
        ) : (
          <form onSubmit={handleSave} style={{ maxWidth: '800px' }}>
            {/* Status Indicator Banner (Read-only as required) */}
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                backgroundColor: status === 'approved' ? 'rgba(16, 185, 129, 0.08)' : status === 'suspended' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                border: '1px solid',
                borderColor: status === 'approved' ? 'rgba(16, 185, 129, 0.3)' : status === 'suspended' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {status === 'approved' ? (
                  <ShieldCheck size={24} color="#10B981" />
                ) : (
                  <AlertCircle size={24} color={status === 'suspended' ? '#EF4444' : '#EAB308'} />
                )}
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.95rem' }}>
                    Store Status: <span style={{ textTransform: 'capitalize', color: status === 'approved' ? '#10B981' : status === 'suspended' ? '#EF4444' : '#EAB308' }}>{status}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {status === 'approved'
                      ? 'Your storefront is actively visible and receiving customer orders.'
                      : status === 'suspended'
                      ? 'Your storefront has been suspended by administration.'
                      : 'Your application is awaiting admin verification.'}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                Managed by Admin
              </span>
            </div>

            {/* General Store Details */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Store Identity
              </h3>

              <div className="form-group">
                <label className="form-label">Business / Brand Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Mama Put Deluxe"
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">Primary Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{ backgroundColor: 'var(--surface-2)', cursor: 'pointer' }}
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

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Abuja"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {category === 'Other' && (
                <div className="form-group" style={{ marginTop: '-0.35rem' }}>
                  <label className="form-label">Custom Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">About / Bio Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about your kitchen, workshop, specialty, and services..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Contact & Location */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Contact & Dispatch Location
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">Contact Phone (WhatsApp / Calls)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080 1234 5678"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Address / Landmark</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suite 14, Banex Plaza, Wuse 2"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Media Uploads */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Storefront Media & Branding
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="auth-row-2col">
                {/* Logo */}
                <div>
                  <label className="form-label">Store Logo</label>
                  <div
                    style={{
                      border: '1px dashed var(--line)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius)',
                      textAlign: 'center',
                      backgroundColor: 'var(--surface-2)'
                    }}
                  >
                    {logoPreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={logoPreview} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                        <label className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>
                          Change Logo
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const f = e.target.files[0];
                              if (f) {
                                setLogoFile(f);
                                setLogoPreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: 'var(--muted)' }}>
                        <Upload size={20} color="var(--lime)" />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>Upload Square Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setLogoFile(f);
                              setLogoPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="form-label">Store Banner Image</label>
                  <div
                    style={{
                      border: '1px dashed var(--line)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius)',
                      textAlign: 'center',
                      backgroundColor: 'var(--surface-2)'
                    }}
                  >
                    {bannerPreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '64px', borderRadius: 'var(--radius)', objectFit: 'cover' }} />
                        <label className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>
                          Change Banner
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const f = e.target.files[0];
                              if (f) {
                                setBannerFile(f);
                                setBannerPreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: 'var(--muted)' }}>
                        <Upload size={20} color="var(--lime)" />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>Upload Wide Banner</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setBannerFile(f);
                              setBannerPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payout & Settlement Details (Paystack Ready) */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)' }}>
                  Bank & Settlement Details
                </h3>
                <span className="badge badge-progress" style={{ fontSize: '0.6875rem' }}>Paystack Ready</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                Settlements for online customer orders will be disbursed to this verified Nigerian bank account.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Account Session & Logout Section */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' }}>
                    Account Session
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
                    Logged in as <strong style={{ color: 'var(--ink)' }}>{user?.email}</strong> ({user?.name})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-danger"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <LogOut size={16} />
                  Log Out of Store
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '0.7rem 1.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                {saving ? 'Saving Changes...' : 'Save Storefront Settings'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default VendorSettings;
