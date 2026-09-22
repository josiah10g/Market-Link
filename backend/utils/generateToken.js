const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'marketlink_super_secret_jwt_key_2026_dev_secure',
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
