const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getMe, getAllUsers, updateUserRole, updateProfile } = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Display / Full name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional({ checkFalsy: true }).trim().matches(/^[0-9+\s()-]{7,20}$/).withMessage('Please enter a valid phone number'),
    body('city').optional().trim(),
    body('address').optional().trim(),
    body('role').optional().isIn(['customer', 'vendor']).withMessage('Role must be customer or vendor'),
    validate
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  loginUser
);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin User Management Routes (Appoint & Remove Admin)
router.get('/users', protect, requireRole('admin'), getAllUsers);
router.put('/users/:id/role', protect, requireRole('admin'), updateUserRole);

module.exports = router;
