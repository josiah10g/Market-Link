const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all active products with filters (search, category, vendor, sort)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, vendor_id, sort, limit, offset } = req.query;

  let query = `
    SELECT p.*, v.business_name, v.category as vendor_category, v.city as vendor_city, v.status as vendor_status
    FROM products p
    JOIN vendors v ON p.vendor_id = v.id
    WHERE p.is_active = true AND v.status = 'approved'
  `;
  const params = [];

  if (category && category !== 'All') {
    params.push(category);
    query += ` AND LOWER(p.category) = LOWER($${params.length})`;
  }

  if (vendor_id) {
    params.push(vendor_id);
    query += ` AND p.vendor_id = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR v.business_name ILIKE $${params.length})`;
  }

  // Sorting
  if (sort === 'price_asc') {
    query += ` ORDER BY p.price ASC`;
  } else if (sort === 'price_desc') {
    query += ` ORDER BY p.price DESC`;
  } else {
    query += ` ORDER BY p.created_at DESC`;
  }

  if (limit) {
    params.push(parseInt(limit, 10));
    query += ` LIMIT $${params.length}`;
  }

  if (offset) {
    params.push(parseInt(offset, 10));
    query += ` OFFSET $${params.length}`;
  }

  const { rows } = await db.query(query, params);

  res.json({
    success: true,
    count: rows.length,
    data: rows
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await db.query(
    `SELECT p.*, v.business_name, v.category as vendor_category, v.city as vendor_city
     FROM products p
     JOIN vendors v ON p.vendor_id = v.id
     WHERE p.id = $1`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.json({ success: true, data: rows[0] });
});

// @desc    Get products belonging to current vendor
// @route   GET /api/products/vendor/mine
// @access  Private (Vendor only)
const getMyProducts = asyncHandler(async (req, res) => {
  // Get vendor id
  const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }

  const vendorId = vendorRes.rows[0].id;
  const { rows } = await db.query(
    `SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC`,
    [vendorId]
  );

  res.json({ success: true, count: rows.length, data: rows });
});

// @desc    Create a new product / service
// @route   POST /api/products
// @access  Private (Vendor only)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock_quantity, lead_time, image_url } = req.body;

  const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }
  const vendorId = vendorRes.rows[0].id;

  const { rows } = await db.query(
    `INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, lead_time, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      vendorId,
      name,
      description || '',
      price,
      category,
      stock_quantity || 0,
      lead_time || 'Same-Day',
      image_url || null
    ]
  );

  res.status(201).json({ success: true, data: rows[0] });
});

// @desc    Update a product (owner vendor only)
// @route   PUT /api/products/:id
// @access  Private (Vendor only)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, stock_quantity, lead_time, image_url, is_active } = req.body;

  const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }
  const vendorId = vendorRes.rows[0].id;

  const { rows } = await db.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price),
         category = COALESCE($4, category),
         stock_quantity = COALESCE($5, stock_quantity),
         lead_time = COALESCE($6, lead_time),
         image_url = COALESCE($7, image_url),
         is_active = COALESCE($8, is_active)
     WHERE id = $9 AND vendor_id = $10
     RETURNING *`,
    [name, description, price, category, stock_quantity, lead_time, image_url, is_active, id, vendorId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
  }

  res.json({ success: true, data: rows[0] });
});

// @desc    Delete a product (owner vendor only)
// @route   DELETE /api/products/:id
// @access  Private (Vendor only)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }
  const vendorId = vendorRes.rows[0].id;

  // Soft deactivate so historical orders remain valid
  const { rows } = await db.query(
    `UPDATE products SET is_active = false WHERE id = $1 AND vendor_id = $2 RETURNING id`,
    [id, vendorId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
  }

  res.json({ success: true, message: 'Product removed from catalog' });
});

// @desc    Upload product image to Supabase using backend Service Role (No anon key needed)
// @route   POST /api/products/upload-image
// @access  Private (Vendor only)
const uploadImage = asyncHandler(async (req, res) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, message: 'No image data provided' });
  }

  const { supabase } = require('../config/supabase');
  if (!supabase) {
    // If Supabase not yet configured, return local preview
    return res.json({ success: true, imageUrl: imageBase64 });
  }

  // Parse base64 string
  const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(imageBase64, 'base64');
  const contentType = matches ? matches[1] : 'image/jpeg';
  const ext = contentType.split('/')[1] || 'jpg';
  const filePath = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

  // Upload using Service Role key
  const { data, error } = await supabase.storage
    .from('products')
    .upload(filePath, buffer, {
      contentType,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }

  const { data: publicData } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);

  res.json({ success: true, imageUrl: publicData.publicUrl });
});

module.exports = {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage
};

