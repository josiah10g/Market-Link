const express = require('express');
const { body } = require('express-validator');
const { createReview, getVendorReviews, getMyVendorReviews } = require('../controllers/reviewController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/vendor/mine', protect, requireRole('vendor'), getMyVendorReviews);
router.get('/vendor/:vendorId', getVendorReviews);

router.post(
  '/',
  protect,
  requireRole('customer'),
  [
    body('order_id').isInt().withMessage('Valid order_id is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().trim(),
    validate
  ],
  createReview
);

module.exports = router;
