const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current user settings
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationToken');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update contact sharing preference (farmers only)
router.patch('/contact-sharing', auth, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ msg: 'Only farmers can change contact sharing settings' });
    }

    const { allowContactSharing } = req.body;
    req.user.allowContactSharing = allowContactSharing;
    await req.user.save();

    res.json({ 
      msg: `Contact sharing ${allowContactSharing ? 'enabled' : 'disabled'}`,
      allowContactSharing: req.user.allowContactSharing 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Resend verification email
router.post('/resend-verification', auth, async (req, res) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({ msg: 'Email already verified' });
    }

    if (!req.user.email) {
      return res.status(400).json({ msg: 'No email associated with this account' });
    }

    // Generate new token
    const crypto = require('crypto');
    req.user.verificationToken = crypto.randomBytes(32).toString('hex');
    req.user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await req.user.save();

    // In production, send email here
    console.log(`Verification link: http://localhost:${process.env.PORT || 4000}/api/auth/verify/${req.user.verificationToken}`);

    res.json({ msg: 'Verification email sent (check console for link in dev mode)' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
