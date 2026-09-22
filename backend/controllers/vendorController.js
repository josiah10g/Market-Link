const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all approved vendors (public, with category filter & search)
// @route   GET /api/vendors
// @access  Public
const getVendors = asyncHandler(async (req, res) => {
  const { category, search, city } = req.query;

  let query = `
    SELECT v.*, u.email, u.name as owner_name
    FROM vendors v
    JOIN users u ON v.user_id = u.id
    WHERE v.status = 'approved'
  `;
  const params = [];

  if (category && category !== 'All') {
    params.push(category);
    query += ` AND LOWER(v.category) = LOWER($${params.length})`;
  }

  if (city) {
    params.push(`%${city}%`);
    query += ` AND v.city ILIKE $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (v.business_name ILIKE $${params.length} OR v.description ILIKE $${params.length})`;
  }

  query += ` ORDER BY v.rating DESC NULLS LAST, v.total_orders DESC`;

  const { rows } = await db.query(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: rows
  });
});

// @desc    Get single vendor by ID with active products
// @route   GET /api/vendors/:id
// @access  Public
const getVendorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendorRes = await db.query(
    `SELECT v.*, u.email, u.name as owner_name
     FROM vendors v
     JOIN users u ON v.user_id = u.id
     WHERE v.id = $1`,
    [id]
  );

  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor storefront not found' });
  }

  const vendor = vendorRes.rows[0];

  // Fetch products
  const productsRes = await db.query(
    `SELECT * FROM products WHERE vendor_id = $1 AND is_active = true ORDER BY created_at DESC`,
    [id]
  );

  // Fetch latest reviews
  const reviewsRes = await db.query(
    `SELECT r.*, u.name as customer_name
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     WHERE r.vendor_id = $1
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...vendor,
      products: productsRes.rows,
      reviews: reviewsRes.rows
    }
  });
});

// @desc    Get current vendor's profile
// @route   GET /api/vendors/me/profile
// @access  Private (Vendor only)
const getMyVendorProfile = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM vendors WHERE user_id = $1',
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }

  res.json({ success: true, data: rows[0] });
});

// @desc    Update current vendor's profile / store settings
// @route   PUT /api/vendors/me/profile
// @access  Private (Vendor only)
const updateMyVendorProfile = asyncHandler(async (req, res) => {
  const { business_name, description, category, phone, address, city, logo_url, banner_url } = req.body;

  const { rows } = await db.query(
    `UPDATE vendors
     SET business_name = COALESCE($1, business_name),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         phone = COALESCE($4, phone),
         address = COALESCE($5, address),
         city = COALESCE($6, city),
         logo_url = COALESCE($7, logo_url),
         banner_url = COALESCE($8, banner_url)
     WHERE user_id = $9
     RETURNING *`,
    [business_name, description, category, phone, address, city, logo_url, banner_url, req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }

  res.json({ success: true, data: rows[0] });
});

// @desc    Admin: get all vendors (all statuses, with statistics)
// @route   GET /api/vendors/admin/all
// @access  Private (Admin only)
const getAdminVendors = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT v.*, u.email as user_email, u.name as user_name, u.created_at as registered_at
    FROM vendors v
    JOIN users u ON v.user_id = u.id
  `;
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    query += ` WHERE v.status = $1`;
  }

  query += ` ORDER BY v.created_at DESC`;

  const { rows } = await db.query(query, params);

  res.json({ success: true, count: rows.length, data: rows });
});

// @desc    Admin: approve, suspend, or reactivate vendor
// @route   PUT /api/vendors/:id/status
// @access  Private (Admin only)
const updateVendorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved', 'suspended', 'pending'

  if (!['approved', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be approved, suspended, or pending.' });
  }

  const { rows } = await db.query(
    `UPDATE vendors
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  res.json({ success: true, message: `Vendor status updated to ${status}`, data: rows[0] });
});

module.exports = {
  getVendors,
  getVendorById,
  getMyVendorProfile,
  updateMyVendorProfile,
  getAdminVendors,
  updateVendorStatus
};
