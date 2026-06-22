const express = require('express');
const Crop = require('../models/Crop');
const User = require('../models/User');
const ContactLog = require('../models/ContactLog');
const auth = require('../middleware/auth');
const rateLimitContact = require('../middleware/rateLimitContact');

const router = express.Router();

// Add crop (farmer) - protected
router.post('/', auth, async (req, res) => {
  try {
    const { crop_name, quantity, price } = req.body;
    const farmerId = req.user && req.user._id;
    if (!farmerId || !crop_name || !quantity || !price) return res.status(400).json({ msg: 'Missing fields' });

    if (!req.user || req.user.role !== 'farmer') return res.status(403).json({ msg: 'Only farmers can add crops' });

    const crop = new Crop({ farmer: farmerId, crop_name, quantity, price });
    await crop.save();
    res.json(crop);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// List all available crops (public but mask contact info)
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.find().populate('farmer', 'name location');
    // Don't expose phone/email in public listing
    res.json(crops);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get crops for the authenticated farmer
router.get('/my', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'farmer') return res.status(403).json({ msg: 'Only farmers can view this' });
    const crops = await Crop.find({ farmer: req.user._id });
    res.json(crops);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get crops for specific farmer (public)
router.get('/farmer/:id', async (req, res) => {
  try {
    const crops = await Crop.find({ farmer: req.params.id });
    res.json(crops);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get farmer contact info (protected - buyers only, rate limited)
router.get('/contact/:farmerId', auth, rateLimitContact, async (req, res) => {
  try {
    // Only buyers can view contact info
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ msg: 'Only authenticated buyers can view farmer contact information' });
    }

    // Check if buyer is blocked
    if (req.user.isBlocked) {
      return res.status(403).json({ msg: 'Your account has been blocked. Reason: ' + (req.user.blockReason || 'Policy violation') });
    }

    // Check buyer reputation (require minimum reputation)
    if (req.user.reputation < 20) {
      return res.status(403).json({ msg: 'Your account reputation is too low to view contact information. Please contact support.' });
    }

    // Require email verification for buyers
    if (!req.user.emailVerified && req.user.email) {
      return res.status(403).json({ msg: 'Please verify your email before viewing contact information' });
    }

    const farmer = await User.findById(req.params.farmerId).select('name phone email location allowContactSharing');
    if (!farmer) return res.status(404).json({ msg: 'Farmer not found' });

    // Check if farmer allows contact sharing
    if (farmer.allowContactSharing === false) {
      return res.status(403).json({ msg: 'This farmer has disabled contact sharing' });
    }

    // Log the contact view for audit
    const contactLog = new ContactLog({
      buyer: req.user._id,
      farmer: req.params.farmerId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    await contactLog.save();

    res.json({ 
      name: farmer.name, 
      phone: farmer.phone, 
      email: farmer.email, 
      location: farmer.location 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
