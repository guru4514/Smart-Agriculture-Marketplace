const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

module.exports = async function (req, res, next) {
  const header = req.header('Authorization') || req.header('authorization');
  if (!header) return res.status(401).json({ msg: 'No token, authorization denied' });

  const parts = header.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : header;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    console.error('Auth middleware error', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
