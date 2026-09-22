import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Camera, Check, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Abuja');
  const [address, setAddress] = useState(user?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post('/products/upload-image', {
        imageBase64: base64Data,
        filename: file.name
      });

      if (res.data.success) {
        setAvatarUrl(res.data.imageUrl);
        success('Profile photo uploaded! Click "Save Changes" to apply.');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name,
        phone,
        city,
        address,
        avatar_url: avatarUrl
      };

      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await api.put('/auth/profile', payload);

      if (res.data.success) {
        // Update local session & auth context
        const updatedUser = { ...user, ...res.data.data };
        localStorage.setItem('marketlink_user', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        
        success('Profile updated successfully! Taking you back to your dashboard...');
        setNewPassword('');
        setConfirmPassword('');

        // Redirect back to user's dashboard based on role
        setTimeout(() => {
          if (updatedUser.role === 'vendor') {
            navigate('/vendor');
          } else if (updatedUser.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/orders');
          }
        }, 800);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, padding: '3rem 0 5rem' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              | Account Settings
            </div>
            <h1 className="heading-display" style={{ fontSize: '2.2rem', color: 'var(--ink)' }}>
              Manage Profile
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Update your personal details, location, phone number, and security password.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '2rem'
            }}
          >
            {/* Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--line)' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-2)',
                    border: '2px solid var(--lime)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--lime)'
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    name?.charAt(0) || 'U'
                  )}
                </div>

                <label
                  htmlFor="avatar-upload"
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--lime)',
                    color: 'var(--bg)',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                  }}
                  title="Change profile photo"
                >
                  <Camera size={14} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>{name || 'User Profile'}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                  {user?.role?.toUpperCase()} • {user?.email}
                </p>
                {uploadingAvatar && <p style={{ fontSize: '0.75rem', color: 'var(--lime)', marginTop: '0.25rem' }}>Uploading photo...</p>}
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={13} color="var(--lime)" /> Full / Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={13} color="var(--lime)" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    title="Email cannot be changed"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={13} color="var(--lime)" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9+]/g, '');
                      setPhone(val);
                    }}
                    onKeyDown={(e) => {
                      if (['e', 'E', '-', '.', ',', ' '].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="08012345678"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }} className="auth-row-2col">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={13} color="var(--lime)" /> Neighborhood / Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Maitama, Abuja"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password Change Section */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={14} color="var(--lime)" /> Change Password
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                  Leave blank if you don't want to change your current password.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
