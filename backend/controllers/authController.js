const bcrypt = require('bcryptjs');
const db = require('../config/db');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Register a new user (Customer or Vendor)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city, address, role, businessName, category } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existingUser.rows.length > 0) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Ensure columns exist gracefully if database was created previously
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Abuja';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);

    // Insert user
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, city, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, city, address, role, created_at`,
      [name.trim(), normalizedEmail, passwordHash, phone ? phone.trim() : null, city ? city.trim() : 'Abuja', address ? address.trim() : null, role || 'customer']
    );
    const newUser = userRes.rows[0];

    // If role is vendor, also create a pending vendor profile
    let vendorProfile = null;
    if (role === 'vendor') {
      const vendorRes = await client.query(
        `INSERT INTO vendors (user_id, business_name, description, category, phone, address, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          newUser.id,
          businessName || `${name}'s Store`,
          `Welcome to ${businessName || name + "'s Store"} on MarketLink.`,
          category || 'General',
          phone || null,
          address || 'Abuja, Nigeria',
          'pending'
        ]
      );
      vendorProfile = vendorRes.rows[0];
    }

    await client.query('COMMIT');

    // Synchronize to Supabase Auth tab if available so user shows in Supabase Authentication dashboard
    try {
      const { supabase } = require('../config/supabase');
      if (supabase) {
        await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            id: newUser.id,
            name: newUser.name,
            role: newUser.role,
            phone: newUser.phone,
            city: newUser.city,
            address: newUser.address
          }
        });
      }
    } catch (syncErr) {
      // Non-blocking if already exists or Supabase Auth unavailable
      console.warn('[Supabase Auth Sync Warning]:', syncErr.message);
    }

    const token = generateToken(newUser.id, newUser.role);

    // Asynchronously dispatch welcome email via Nodemailer
    sendWelcomeEmail({
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    }).catch(err => console.warn('[WELCOME EMAIL WARNING]', err.message));

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        city: newUser.city,
        address: newUser.address,
        role: newUser.role,
        avatar_url: null,
        token,
        vendor: vendorProfile
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const userRes = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (userRes.rows.length === 0) {
    return res.status(401).json({ success: false, message: 'No account found with this email address. Please check your email or sign up.' });
  }

  const user = userRes.rows[0];

  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Please try again or click "Forgot password?".' });
  }

  // If vendor, attach vendor storefront data
  let vendorProfile = null;
  if (user.role === 'vendor') {
    const vendorRes = await db.query('SELECT * FROM vendors WHERE user_id = $1', [user.id]);
    if (vendorRes.rows.length > 0) {
      vendorProfile = vendorRes.rows[0];
    }
  }

  const token = generateToken(user.id, user.role);

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      address: user.address,
      role: user.role,
      avatar_url: user.avatar_url || vendorProfile?.logo_url || null,
      token,
      vendor: vendorProfile
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const userRes = await db.query(
    'SELECT id, name, email, phone, city, address, role, avatar_url, is_active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (userRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = userRes.rows[0];
  let vendorProfile = null;
  if (user.role === 'vendor') {
    const vendorRes = await db.query('SELECT * FROM vendors WHERE user_id = $1', [user.id]);
    if (vendorRes.rows.length > 0) {
      vendorProfile = vendorRes.rows[0];
    }
  }

  res.json({
    success: true,
    data: {
      ...user,
      avatar_url: user.avatar_url || vendorProfile?.logo_url || null,
      vendor: vendorProfile
    }
  });
});

// @desc    Get all users for admin management
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const { supabase } = require('../config/supabase');
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, city, address, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.json({ success: true, data });
  }

  const { rows } = await db.query(
    'SELECT id, name, email, phone, city, address, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ success: true, data: rows });
});

// @desc    Promote or demote user role (Appoint or remove Admin)
// @route   PUT /api/auth/users/:id/role
// @access  Private (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['customer', 'vendor', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  // Prevent admin from accidentally demoting themselves
  if (parseInt(id, 10) === req.user.id && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'You cannot remove your own admin privileges' });
  }

  const { supabase } = require('../config/supabase');
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, name, email, role')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.json({ success: true, message: `Role updated to ${role}`, data });
  }

  const { rows } = await db.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: `Role updated to ${role}`, data: rows[0] });
});

// @desc    Update current user profile (name, phone, city, address, password, avatar)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city, address, password, avatar_url } = req.body;
  const userId = req.user.id;

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (phone) updateFields.phone = phone.trim();
  if (city) updateFields.city = city.trim();
  if (address) updateFields.address = address.trim();

  if (password && password.length >= 6) {
    const salt = await bcrypt.genSalt(10);
    updateFields.password_hash = await bcrypt.hash(password, salt);
  }

  const { supabase } = require('../config/supabase');
  if (supabase) {
    // 1. Try to update user profile in Supabase table
    let userUpdatePayload = { ...updateFields };
    if (avatar_url) {
      userUpdatePayload.avatar_url = avatar_url;
    }

    let { data: updatedUser, error: updateErr } = await supabase
      .from('users')
      .update(userUpdatePayload)
      .eq('id', userId)
      .select('id, name, email, phone, city, address, role, is_active, created_at')
      .single();

    // If avatar_url column does not exist in schema cache, retry without avatar_url in users table
    if (updateErr && (updateErr.message?.includes('avatar_url') || updateErr.code === 'PGRST204')) {
      delete userUpdatePayload.avatar_url;
      const retryRes = await supabase
        .from('users')
        .update(userUpdatePayload)
        .eq('id', userId)
        .select('id, name, email, phone, city, address, role, is_active, created_at')
        .single();
      
      if (retryRes.error) {
        return res.status(500).json({ success: false, message: retryRes.error.message });
      }
      updatedUser = retryRes.data;
    } else if (updateErr) {
      return res.status(500).json({ success: false, message: updateErr.message });
    }

    // 2. If user is vendor and has uploaded an avatar, also sync it to vendor logo_url
    if (avatar_url) {
      try {
        await supabase
          .from('vendors')
          .update({ logo_url: avatar_url })
          .eq('user_id', userId);
      } catch (vendorLogoErr) {
        console.warn('[Vendor logo sync warning]:', vendorLogoErr.message);
      }
    }

    // 3. Sync password change to Supabase Auth if account exists there
    if (password && password.length >= 6 && updatedUser?.email) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === updatedUser.email.toLowerCase());
        if (existingAuth) {
          await supabase.auth.admin.updateUserById(existingAuth.id, { password });
        }
      } catch (authSyncErr) {
        console.warn('[Supabase Auth password sync warning]:', authSyncErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...updatedUser,
        avatar_url: avatar_url || updatedUser?.avatar_url || null
      }
    });
  }

  // Fallback: build dynamic SET clause from updateFields
  const keys = Object.keys(updateFields);
  if (keys.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updateFields[k]);
  values.push(userId);

  const { rows } = await db.query(
    `UPDATE users SET ${setClauses} WHERE id = $${values.length} RETURNING id, name, email, phone, city, address, role, is_active, created_at`,
    values
  );
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      ...rows[0],
      avatar_url: avatar_url || rows[0]?.avatar_url || null
    }
  });
});

// @desc    Direct password reset without SMTP requirement (Supabase & Postgres sync)
// @route   POST /api/auth/reset-password-direct
// @access  Public
const resetPasswordDirect = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Valid email and password (min 6 chars) are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const { supabase } = require('../config/supabase');
  let userUpdated = false;

  // 1. Update in Supabase users table & Supabase Auth if connected
  if (supabase) {
    try {
      const { data: supaUser, error: supaErr } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('email', normalizedEmail)
        .select('id, email, name')
        .single();

      if (!supaErr && supaUser) {
        userUpdated = true;
        // Also sync to Supabase Auth admin
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const authAcc = authUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
          if (authAcc) {
            await supabase.auth.admin.updateUserById(authAcc.id, { password: newPassword });
          }
        } catch (authErr) {
          console.warn('[Supabase Auth password sync]', authErr.message);
        }
      }
    } catch (e) {
      console.warn('[Supabase update error]', e.message);
    }
  }

  // 2. Also update in local Postgres database
  const pgRes = await db.query(
    'UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2 RETURNING id, email, name, role',
    [passwordHash, normalizedEmail]
  );

  if (pgRes.rows.length > 0 || userUpdated) {
    return res.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });
  }

  return res.status(404).json({ success: false, message: 'No account registered with this email address.' });
});

module.exports = { registerUser, loginUser, getMe, getAllUsers, updateUserRole, updateProfile, resetPasswordDirect };
