const jwt = require('jsonwebtoken');
const db = require('../config/db');


const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'marketlink_super_secret_jwt_key_2026_dev_secure');
    
    const { rows } = await db.query(
      'SELECT id, name, email, phone, role, avatar_url, is_active, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
    }

    if (!rows[0].is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};


const requireRole = (...roles) => {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowed.join(', ')}] role(s)`
      });
    }
    next();
  };
};

module.exports = { protect, requireRole };
