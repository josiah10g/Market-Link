const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage
} = require('../controllers/productController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Public routes
router.get('/', getProducts);

// Image upload route (Allowed for all authenticated users: customer, vendor, admin)
router.post('/upload-image', protect, requireRole(['customer', 'vendor', 'admin']), uploadImage);

// Vendor protected routes
router.get('/vendor/mine', protect, requireRole('vendor'), getMyProducts);

router.get('/:id', getProductById);

router.post(
  '/',
  protect,
  requireRole('vendor'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be 0 or more'),
    body('lead_time').optional().trim(),
    validate
  ],
  createProduct
);

router.put(
  '/:id',
  protect,
  requireRole('vendor'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be 0 or more'),
    body('lead_time').optional().trim(),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
    validate
  ],
  updateProduct
);

router.delete('/:id', protect, requireRole('vendor'), deleteProduct);

module.exports = router;
