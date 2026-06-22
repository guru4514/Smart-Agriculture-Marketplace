const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// Generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Register -> returns token
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, location, password, role } = req.body;
    if (!name || !password || !role) return res.status(400).json({ msg: 'Missing required fields' });

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(400).json({ msg: 'User already exists with same email or phone' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({ 
      name, email, phone, location, 
      password: hash, role,
      verificationToken,
      verificationExpires,
      emailVerified: !email // If no email, mark as verified
    });
    await user.save();

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // In production, send verification email here
    console.log(`Verification link: http://localhost:${process.env.PORT || 4000}/api/auth/verify/${verificationToken}`);

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        phone: user.phone, 
        email: user.email,
        emailVerified: user.emailVerified 
      },
      msg: email ? 'Please check your email to verify your account' : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Login -> returns token
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ msg: 'Missing fields' });

    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, role: user.role, phone: user.phone, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send('<h1>Invalid or expired verification link</h1><a href="/login.html">Go to Login</a>');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.send('<h1>Email verified successfully!</h1><p>You can now access all features.</p><a href="/login.html">Login</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
