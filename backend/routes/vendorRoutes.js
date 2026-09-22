const express = require('express');
const { body } = require('express-validator');
const {
  getVendors,
  getVendorById,
  getMyVendorProfile,
  updateMyVendorProfile,
  getAdminVendors,
  updateVendorStatus
} = require('../controllers/vendorController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendorById);

// Vendor protected routes
router.get('/me/profile', protect, requireRole('vendor'), getMyVendorProfile);
router.put(
  '/me/profile',
  protect,
  requireRole('vendor'),
  [
    body('business_name').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    validate
  ],
  updateMyVendorProfile
);

// Admin protected routes
router.get('/admin/all', protect, requireRole('admin'), getAdminVendors);
router.put(
  '/:id/status',
  protect,
  requireRole('admin'),
  [
    body('status').isIn(['approved', 'suspended', 'pending']).withMessage('Status must be approved, suspended, or pending'),
    validate
  ],
  updateVendorStatus
);

module.exports = router;
