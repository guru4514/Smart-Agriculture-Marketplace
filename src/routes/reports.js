const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit a report (buyer or farmer can report)
router.post('/', auth, async (req, res) => {
  try {
    const { reportedId, reason, description } = req.body;
    
    if (!reportedId || !reason) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedId);
    if (!reportedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Can't report yourself
    if (req.user._id.toString() === reportedId) {
      return res.status(400).json({ msg: 'You cannot report yourself' });
    }

    const report = new Report({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      description
    });

    await report.save();

    res.json({ msg: 'Report submitted successfully. Our team will review it.', report });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get my reports (user's own submitted reports)
router.get('/my', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('reported', 'name role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
