const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getMe, getAllUsers, updateUserRole, updateProfile, resetPasswordDirect } = require('../controllers/authController');
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

router.post(
  '/reset-password-direct',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
  ],
  resetPasswordDirect
);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin Email Diagnostics & Test Route
router.post('/test-smtp', protect, requireRole('admin'), async (req, res) => {
  try {
    const { sendEmail } = require('../utils/emailService');
    const recipient = req.body.email || req.user.email;
    const testResult = await sendEmail({
      to: recipient,
      subject: 'MarketLink — SMTP Test Verification',
      text: 'Congratulations! Your Nodemailer SMTP integration is working successfully on MarketLink.',
      html: `
        <div style="background-color:#121816; color:#EDEFEC; padding:24px; border-radius:8px; font-family:sans-serif;">
          <h2 style="color:#B9FF66; margin-top:0;">MarketLink SMTP Verified!</h2>
          <p>This is a live test email confirming your Gmail SMTP App Password and transport configuration are functioning 100%.</p>
          <p style="font-size:12px; color:#8B978F;">Sent via Nodemailer to ${recipient} at ${new Date().toISOString()}</p>
        </div>
      `
    });

    if (testResult && testResult.messageId) {
      return res.json({ success: true, message: `Test email dispatched successfully to ${recipient}!`, messageId: testResult.messageId });
    } else {
      return res.status(500).json({ success: false, message: 'Nodemailer failed to dispatch email. Check server logs.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin User Management Routes (Appoint & Remove Admin)
router.get('/users', protect, requireRole('admin'), getAllUsers);
router.put('/users/:id/role', protect, requireRole('admin'), updateUserRole);

module.exports = router;
