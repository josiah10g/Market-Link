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
const { uploadImage } = require('../controllers/productController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Image upload route for vendor banners/logos
router.post('/upload-image', protect, requireRole(['vendor', 'admin']), uploadImage);

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
    body('status').isIn(['approved', 'suspended', 'pending', 'rejected']).withMessage('Status must be approved, suspended, pending, or rejected'),
    validate
  ],
  updateVendorStatus
);

module.exports = router;
