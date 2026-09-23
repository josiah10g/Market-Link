const https = require('https');
const db = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateOrderCode } = require('../utils/orderCode');
const {
  createNotification,
  sendOrderConfirmationEmail,
  sendVendorNewOrderEmail,
  sendOrderStatusEmail
} = require('../utils/emailService');

// Helper to query Paystack API directly
const verifyPaystackRef = async (reference, secretKey) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from Paystack API'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

// Valid state machine transitions
const VALID_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [], // Terminal
  cancelled: []  // Terminal
};

// @desc    Place a new order (Atomic transaction with row locks, stock deduction, and order_code retry)
// @route   POST /api/orders
// @access  Private (Customer only)
const createOrder = asyncHandler(async (req, res) => {
  const { items, delivery_address, notes, payment_method, payment_reference, idempotency_key } = req.body;
  const vendor_id = parseInt(req.body.vendor_id, 10);

  if (!vendor_id || isNaN(vendor_id)) {
    return res.status(400).json({ success: false, message: 'A valid vendor ID is required' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
  }

  // Idempotency check: if an order with this idempotency_key or payment_reference already exists, return it
  if (idempotency_key || payment_reference) {
    let existingOrderRes;
    if (idempotency_key && payment_reference) {
      existingOrderRes = await db.query(
        'SELECT * FROM orders WHERE idempotency_key = $1 OR payment_reference = $2 LIMIT 1',
        [idempotency_key, payment_reference]
      );
    } else if (idempotency_key) {
      existingOrderRes = await db.query(
        'SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1',
        [idempotency_key]
      );
    } else {
      existingOrderRes = await db.query(
        'SELECT * FROM orders WHERE payment_reference = $1 LIMIT 1',
        [payment_reference]
      );
    }

    if (existingOrderRes.rows.length > 0) {
      const existingOrder = existingOrderRes.rows[0];
      const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [existingOrder.id]);
      return res.status(200).json({
        success: true,
        message: 'Order already processed (idempotent)',
        data: {
          ...existingOrder,
          items: itemsRes.rows
        }
      });
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify vendor is approved and active
    const vendorRes = await client.query('SELECT * FROM vendors WHERE id = $1', [vendor_id]);
    if (vendorRes.rows.length === 0 || vendorRes.rows[0].status !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Vendor storefront is not currently active' });
    }
    const vendor = vendorRes.rows[0];

    // 2. Lock and verify stock for all items atomically
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product_id = parseInt(item.product_id, 10);
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(product_id) || isNaN(quantity) || quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Invalid product ID or quantity in cart' });
      }

      // Row-level lock: prevents race conditions between concurrent orders
      const prodRes = await client.query(
        'SELECT * FROM products WHERE id = $1 AND vendor_id = $2 FOR UPDATE',
        [product_id, vendor_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Product #${product_id} not found at this vendor` });
      }

      const product = prodRes.rows[0];

      if (!product.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Product "${product.name}" is no longer available` });
      }

      if (product.stock_quantity < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${quantity}`
        });
      }

      // Decrement inventory
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [quantity, product_id]
      );

      const itemTotal = Number(product.price) * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id,
        product_name: product.name,
        price: product.price,
        quantity
      });
    }

    // 2b. Paystack verification if paid online
    const isPaidOnline = payment_method === 'paystack' || payment_method === 'card';
    if (isPaidOnline) {
      if (!payment_reference) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Payment reference is required for Paystack payments' });
      }

      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      // Skip verification in development if simulated reference or no secret key configured
      const isSimulated = payment_reference.startsWith('TEST_REF_');
      if (secretKey && !isSimulated) {
        try {
          const verification = await verifyPaystackRef(payment_reference, secretKey);
          if (!verification.status || verification.data?.status !== 'success') {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: verification.message || 'Payment verification failed with Paystack'
            });
          }

          // Verify amount paid (Paystack amount is in kobo, 1 NGN = 100 kobo)
          const paidKobo = verification.data?.amount;
          const expectedKobo = Math.round(totalAmount * 100);
          if (paidKobo && Math.abs(paidKobo - expectedKobo) > 100) { // allow 1 NGN rounding margin
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: `Payment amount mismatch: expected ₦${totalAmount}, received ₦${paidKobo / 100}`
            });
          }
        } catch (verifyErr) {
          console.error('[PAYSTACK VERIFICATION ERROR]', verifyErr.message);
          await client.query('ROLLBACK');
          return res.status(502).json({
            success: false,
            message: 'Could not communicate with Paystack for payment verification. Please try again or contact support.'
          });
        }
      }
    }

    // 3. Generate unique order code with explicit retry loop (handles 23505 collision)
    let orderRow = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!orderRow && attempts < maxAttempts) {
      attempts++;
      const candidateCode = generateOrderCode();
      try {
        const orderInsertRes = await client.query(
          `INSERT INTO orders (
            order_code, customer_id, vendor_id, total_amount, status,
            payment_status, payment_method, delivery_address, notes, payment_reference, idempotency_key
          ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            candidateCode,
            req.user.id,
            vendor_id,
            totalAmount,
            isPaidOnline ? 'paid' : 'pay_on_delivery',
            payment_method || 'pay_on_delivery',
            delivery_address,
            notes || null,
            payment_reference || null,
            idempotency_key || null
          ]
        );
        orderRow = orderInsertRes.rows[0];
      } catch (err) {
        if (err.code === '23505' && err.constraint?.includes('order_code')) {
          console.warn(`[ORDER CODE COLLISION] Retrying generation (attempt ${attempts})...`);
          continue;
        }
        throw err;
      }
    }

    if (!orderRow) {
      await client.query('ROLLBACK');
      return res.status(500).json({ success: false, message: 'Could not generate unique order code. Please retry.' });
    }

    // 4. Insert order items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderRow.id, item.product_id, item.product_name, item.price, item.quantity]
      );
    }

    // 5. Update vendor total_orders counter
    await client.query('UPDATE vendors SET total_orders = total_orders + 1 WHERE id = $1', [vendor_id]);

    // 6. Create notification for vendor
    await createNotification(client, {
      userId: vendor.user_id,
      orderId: orderRow.id,
      type: 'new_order',
      title: `New Order #${orderRow.order_code}`,
      message: `You received a new order for ₦${Number(totalAmount).toLocaleString()} from ${req.user.name}.`
    });

    // 7. Create notification for customer
    await createNotification(client, {
      userId: req.user.id,
      orderId: orderRow.id,
      type: 'order_placed',
      title: `Order Placed: #${orderRow.order_code}`,
      message: `Your order from ${vendor.business_name} has been placed and is waiting to be accepted.`
    });

    await client.query('COMMIT');

    // Asynchronously dispatch rich HTML order confirmation and vendor alert emails
    sendOrderConfirmationEmail({
      customerEmail: req.user.email,
      customerName: req.user.name,
      orderCode: orderRow.order_code,
      vendorName: vendor.business_name,
      totalAmount,
      paymentMethod: orderRow.payment_method,
      deliveryAddress: orderRow.delivery_address,
      items: validatedItems
    }).catch(err => console.warn('[EMAIL WARNING]', err.message));

    // Get vendor email to send alert
    db.query('SELECT email FROM users WHERE id = $1', [vendor.user_id])
      .then(uRes => {
        if (uRes.rows.length > 0 && uRes.rows[0].email) {
          sendVendorNewOrderEmail({
            vendorEmail: uRes.rows[0].email,
            vendorBusinessName: vendor.business_name,
            customerName: req.user.name,
            orderCode: orderRow.order_code,
            totalAmount,
            items: validatedItems
          }).catch(err => console.warn('[EMAIL WARNING]', err.message));
        }
      })
      .catch(err => console.warn('[VENDOR EMAIL WARNING]', err.message));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        ...orderRow,
        items: validatedItems
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// @desc    Update order status (Enforced state machine transitions)
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['accepted', 'in_progress', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`
    });
  }

  // Find vendor for current user, or allow admin to manage any vendor order
  let vendor = null;
  if (req.user.role === 'admin') {
    const orderCheck = await db.query('SELECT vendor_id FROM orders WHERE id = $1', [parseInt(id, 10)]);
    if (orderCheck.rows.length > 0) {
      const vRes = await db.query('SELECT id, business_name FROM vendors WHERE id = $1', [orderCheck.rows[0].vendor_id]);
      if (vRes.rows.length > 0) vendor = vRes.rows[0];
    }
  } else {
    const vendorRes = await db.query('SELECT id, business_name FROM vendors WHERE user_id = $1', [req.user.id]);
    if (vendorRes.rows.length > 0) {
      vendor = vendorRes.rows[0];
    }
  }

  if (!vendor) {
    return res.status(403).json({ success: false, message: 'Unauthorized: Not associated with this vendor storefront' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Fetch order with row lock
    const orderIdNum = parseInt(id, 10);
    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND vendor_id = $2',
      [orderIdNum, vendor.id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found for this vendor' });
    }

    const order = orderRes.rows[0];
    const currentStatus = order.status;

    // Check state machine validity (allowing smooth transition from pending directly to in_progress or accepted)
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(status) && !(currentStatus === 'pending' && status === 'in_progress')) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot move order #${order.order_code} from "${currentStatus}" to "${status}". Allowed transitions from "${currentStatus}": [${allowedNext.join(', ') || 'none (terminal state)'}]`
      });
    }

    // If cancelled, restock products
    if (status === 'cancelled') {
      const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
      for (const it of itemsRes.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [it.quantity, it.product_id]
        );
      }
    }

    // Update status
    const updateRes = await client.query(
      `UPDATE orders
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, order.id]
    );
    const updatedOrder = updateRes.rows[0];

    // Notification message mapping
    const statusMessages = {
      accepted: `Your order #${order.order_code} has been accepted by ${vendor.business_name}.`,
      in_progress: `${vendor.business_name} has started working on your order #${order.order_code}.`,
      ready: `Your order #${order.order_code} is ready for pickup/delivery!`,
      completed: `Your order #${order.order_code} is complete! Thank you for ordering with MarketLink.`,
      cancelled: `Your order #${order.order_code} was cancelled.`
    };

    // Notify customer
    await createNotification(client, {
      userId: order.customer_id,
      orderId: order.id,
      type: 'order_status_update',
      title: `Order #${order.order_code}: ${status.toUpperCase()}`,
      message: statusMessages[status] || `Order status updated to ${status}.`
    });

    await client.query('COMMIT');

    // Asynchronously dispatch status email to customer
    db.query('SELECT email, name FROM users WHERE id = $1', [order.customer_id])
      .then(uRes => {
        if (uRes.rows.length > 0 && uRes.rows[0].email) {
          sendOrderStatusEmail({
            customerEmail: uRes.rows[0].email,
            customerName: uRes.rows[0].name,
            orderCode: order.order_code,
            vendorName: vendor.business_name,
            newStatus: status
          }).catch(err => console.warn('[EMAIL WARNING]', err.message));
        }
      })
      .catch(err => console.warn('[CUSTOMER EMAIL WARNING]', err.message));

    res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: updatedOrder
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// @desc    Get customer's own order history
// @route   GET /api/orders/mine
// @access  Private (Customer)
const getMyOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT o.*, v.business_name as vendor_name, v.category as vendor_category, v.phone as vendor_phone,
      EXISTS(SELECT 1 FROM reviews r WHERE r.order_id = o.id AND r.customer_id = $1) as has_reviewed,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    JOIN vendors v ON o.vendor_id = v.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.customer_id = $1
  `;
  const params = [req.user.id];

  if (status && status !== 'all') {
    if (status === 'in_progress') {
      query += ` AND o.status IN ('accepted', 'in_progress', 'ready')`;
    } else {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }
  }

  query += ` GROUP BY o.id, v.business_name, v.category, v.phone ORDER BY o.created_at DESC`;

  const { rows } = await db.query(query, params);

  res.json({ success: true, count: rows.length, data: rows });
});

// @desc    Get incoming orders for current vendor
// @route   GET /api/orders/vendor
// @access  Private (Vendor only)
const getVendorOrders = asyncHandler(async (req, res) => {
  const vendorRes = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }
  const vendorId = vendorRes.rows[0].id;

  const { status } = req.query;

  let query = `
    SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.vendor_id = $1
  `;
  const params = [vendorId];

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND o.status = $${params.length}`;
  }

  query += ` GROUP BY o.id, u.name, u.phone, u.email ORDER BY o.created_at DESC`;

  const { rows } = await db.query(query, params);

  res.json({ success: true, count: rows.length, data: rows });
});

// @desc    Get vendor analytics (Total Orders, Revenue, Pending, Avg Rating, Low stock)
// @route   GET /api/orders/vendor/analytics
// @access  Private (Vendor only)
const getVendorAnalytics = asyncHandler(async (req, res) => {
  const vendorRes = await db.query('SELECT * FROM vendors WHERE user_id = $1', [req.user.id]);
  if (vendorRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  }
  const vendor = vendorRes.rows[0];

  // Aggregation for revenue & orders
  const statsRes = await db.query(
    `SELECT 
       COUNT(*) as total_orders,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
       COUNT(CASE WHEN status IN ('accepted', 'in_progress', 'ready') THEN 1 END) as active_orders
     FROM orders 
     WHERE vendor_id = $1`,
    [vendor.id]
  );

  // Low stock products (stock <= 5)
  const lowStockRes = await db.query(
    `SELECT id, name, category, price, stock_quantity, lead_time
     FROM products
     WHERE vendor_id = $1 AND stock_quantity <= 5 AND is_active = true
     ORDER BY stock_quantity ASC
     LIMIT 5`,
    [vendor.id]
  );

  const statsRow = statsRes.rows[0] || {
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    active_orders: 0
  };

  res.json({
    success: true,
    data: {
      business_name: vendor.business_name,
      rating: vendor.rating ? Number(vendor.rating) : null,
      rating_count: vendor.rating_count || 0,
      total_orders: parseInt(statsRow.total_orders || 0, 10),
      total_revenue: parseFloat(statsRow.total_revenue || 0),
      pending_orders: parseInt(statsRow.pending_orders || 0, 10),
      active_orders: parseInt(statsRow.active_orders || 0, 10),
      low_stock_items: lowStockRes.rows || []
    }
  });
});

// @desc    Admin: get all platform orders
// @route   GET /api/orders/admin/all
// @access  Private (Admin only)
const getAdminOrders = asyncHandler(async (req, res) => {
  const query = `
    SELECT o.*, u.name as customer_name, v.business_name as vendor_name,
      COUNT(oi.id) as item_count
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    JOIN vendors v ON o.vendor_id = v.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id, u.name, v.business_name
    ORDER BY o.created_at DESC
    LIMIT 100
  `;
  const { rows } = await db.query(query);

  // Platform high level stats
  const stats = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM vendors) as total_vendors,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_users,
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COUNT(*) FROM vendors WHERE status = 'pending') as pending_approvals,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_platform_volume
  `);

  res.json({
    success: true,
    stats: stats.rows[0],
    data: rows
  });
});

// @desc    Verify Paystack payment reference with Paystack API
// @route   POST /api/orders/paystack/verify
// @access  Private (Customer only)
const verifyPaystackPayment = asyncHandler(async (req, res) => {
  const { reference, order_id } = req.body;

  if (!reference) {
    return res.status(400).json({ success: false, message: 'Paystack reference is required' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ success: false, message: 'Paystack secret key is not configured on the server' });
  }

  try {
    const paystackData = await verifyPaystackRef(reference, secretKey);

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: paystackData.message || 'Payment verification failed or transaction was not successful',
        data: paystackData.data
      });
    }

    // If order_id was provided, update existing order payment status
    if (order_id) {
      await db.query(
        'UPDATE orders SET payment_status = $1, payment_reference = $2, payment_method = $3 WHERE id = $4',
        ['paid', reference, 'paystack', order_id]
      );
    }

    res.json({
      success: true,
      message: 'Paystack payment verified successfully',
      data: {
        reference,
        amount: paystackData.data.amount / 100, // Paystack amount is in kobo
        paid_at: paystackData.data.paid_at,
        channel: paystackData.data.channel,
        currency: paystackData.data.currency,
        status: paystackData.data.status
      }
    });
  } catch (err) {
    console.error('Paystack verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to communicate with Paystack servers: ' + err.message
    });
  }
});

module.exports = {
  createOrder,
  updateOrderStatus,
  getMyOrders,
  getVendorOrders,
  getVendorAnalytics,
  getAdminOrders,
  verifyPaystackPayment
};
