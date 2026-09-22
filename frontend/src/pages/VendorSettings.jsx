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
        {/* Header matching screenshot 5 */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            | Storefront
          </div>
          <h1 className="heading-display" style={{ fontSize: '2.4rem', marginBottom: '0.3rem', color: 'var(--ink)' }}>
            Store settings
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Update how customers see your business on MarketLink.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading storefront settings..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProfile} />
        ) : (
          <form onSubmit={handleSave} style={{ maxWidth: '640px' }}>
            {/* Store approval status card matching screenshot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                marginBottom: '2.5rem'
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Store approval status
              </span>
              <span className="badge badge-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--lime)' }} />
                Approved
              </span>
            </div>

            {/* Business details section matching screenshot */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Business details
              </h3>

              {/* Logo upload box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '1.5rem',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('logoFileInput')?.click()}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'rgba(185, 255, 102, 0.1)',
                    border: '1px solid rgba(185, 255, 102, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--lime)',
                    fontSize: '0.95rem'
                  }}
                >
                  {businessName ? businessName.slice(0, 2).toUpperCase() : 'AK'}
                </div>
                <div>
                  <span style={{ color: 'var(--lime)', fontWeight: 500, fontSize: '0.8125rem' }}>
                    Click to upload
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginLeft: '0.35rem' }}>
                    a new store logo — square image, at least 200×200px.
                  </span>
                </div>
                <input
                  type="file"
                  id="logoFileInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setLogoFile(file);
                  }}
                />
              </div>

              {/* Business Name Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                  Business name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', fontSize: '0.875rem' }}
                  required
                />
              </div>

              {/* Short Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                  Short description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="form-input"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              {/* Category & Phone Number 2-col */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', fontSize: '0.875rem', cursor: 'pointer' }}
                  >
                    <option value="Food">Food</option>
                    <option value="Meals">Meals</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Repairs">Repairs</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                    Phone number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080 1234 5678"
                    className="form-input"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Location section matching screenshot */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Location
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="12 Aminu Kano Crescent, Wuse II"
                    className="form-input"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Abuja"
                    className="form-input"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Cancel & Save changes buttons right aligned matching screenshot */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={fetchProfile}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  padding: '0.5rem 1rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  padding: '0.55rem 1.4rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius)'
                }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default VendorSettings;
