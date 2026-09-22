const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Post a review for a completed order (atomic with vendor rating recompute)
// @route   POST /api/reviews
// @access  Private (Customer only)
const createReview = asyncHandler(async (req, res) => {
  const { order_id, rating, comment } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify order belongs to customer and is COMPLETED
    const orderRes = await client.query(
      'SELECT id, vendor_id, customer_id, status, order_code FROM orders WHERE id = $1',
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (order.customer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only review your own orders' });
    }

    if (order.status !== 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Reviews are only allowed after an order is completed. Current status: "${order.status}"`
      });
    }

    // 2. Insert review (guarded by UNIQUE constraint on order_id + customer_id)
    const reviewInsert = await client.query(
      `INSERT INTO reviews (order_id, customer_id, vendor_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order.id, req.user.id, order.vendor_id, rating, comment || null]
    );
    const newReview = reviewInsert.rows[0];

    // 3. Transparent controller-side recalculation of vendor rating & count
    await client.query(
      `UPDATE vendors
       SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE vendor_id = $1),
           rating_count = (SELECT COUNT(*) FROM reviews WHERE vendor_id = $1)
       WHERE id = $1`,
      [order.vendor_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been posted.',
      data: newReview
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// @desc    Get reviews for a vendor
// @route   GET /api/reviews/vendor/:vendorId
// @access  Public
const getVendorReviews = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;

  const { rows } = await db.query(
    `SELECT r.*, u.name as customer_name, o.order_code
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     JOIN orders o ON r.order_id = o.id
     WHERE r.vendor_id = $1
     ORDER BY r.created_at DESC`,
    [vendorId]
  );

  res.json({ success: true, count: rows.length, data: rows });
});

// @desc    Get all reviews for the authenticated vendor
// @route   GET /api/reviews/vendor/mine
// @access  Private (Vendor only)
const getMyVendorReviews = asyncHandler(async (req, res) => {
  const vendorRes = await db.query('SELECT id, rating, rating_count FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }
  const vendor = vendorRes.rows[0];

  const { rows } = await db.query(
    `SELECT r.*, u.name as customer_name, o.order_code
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     JOIN orders o ON r.order_id = o.id
     WHERE r.vendor_id = $1
     ORDER BY r.created_at DESC`,
    [vendor.id]
  );

  res.json({
    success: true,
    rating: vendor.rating,
    rating_count: vendor.rating_count,
    count: rows.length,
    data: rows
  });
});

module.exports = { createReview, getVendorReviews, getMyVendorReviews };
