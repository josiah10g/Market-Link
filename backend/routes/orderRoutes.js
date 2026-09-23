const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  updateOrderStatus,
  getMyOrders,
  getVendorOrders,
  getVendorAnalytics,
  getAdminOrders,
  verifyPaystackPayment
} = require('../controllers/orderController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();


router.post(
  '/',
  protect,
  requireRole('customer'),
  [
    body('vendor_id').isInt().withMessage('Valid vendor_id is required'),
    body('items').isArray({ min: 1 }).withMessage('Items array must contain at least one item'),
    body('items.*.product_id').isInt().withMessage('Each item must have a valid product_id'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('delivery_address').trim().notEmpty().withMessage('Delivery address is required'),
    validate
  ],
  createOrder
);

router.post(
  '/paystack/verify',
  protect,
  requireRole('customer'),
  [
    body('reference').trim().notEmpty().withMessage('Paystack reference is required'),
    validate
  ],
  verifyPaystackPayment
);

router.get('/mine', protect, requireRole('customer'), getMyOrders);


router.get('/vendor', protect, requireRole('vendor'), getVendorOrders);
router.get('/vendor/analytics', protect, requireRole('vendor'), getVendorAnalytics);
router.put(
  '/:id/status',
  protect,
  requireRole(['vendor', 'admin']),
  [
    body('status').isIn(['accepted', 'in_progress', 'ready', 'completed', 'cancelled']).withMessage('Invalid order status'),
    validate
  ],
  updateOrderStatus
);

router.get('/admin/all', protect, requireRole('admin'), getAdminOrders);

module.exports = router;
