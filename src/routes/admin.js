const express = require('express');
const User = require('../models/User');
const ContactLog = require('../models/ContactLog');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
};

// Get dashboard stats
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        farmers: await User.countDocuments({ role: 'farmer' }),
        buyers: await User.countDocuments({ role: 'buyer' }),
        blocked: await User.countDocuments({ isBlocked: true }),
        unverified: await User.countDocuments({ emailVerified: false, email: { $exists: true, $ne: null } })
      },
      contactLogs: {
        total: await ContactLog.countDocuments(),
        last24h: await ContactLog.countDocuments({ viewedAt: { $gte: new Date(Date.now() - 24*60*60*1000) } }),
        last7d: await ContactLog.countDocuments({ viewedAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } })
      },
      reports: {
        total: await Report.countDocuments(),
        pending: await Report.countDocuments({ status: 'pending' }),
        resolved: await Report.countDocuments({ status: 'resolved' })
      }
    };
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get all users with filters
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { role, blocked, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (blocked !== undefined) query.isBlocked = blocked === 'true';

    const users = await User.find(query)
      .select('-password -verificationToken')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Block/unblock user
router.patch('/users/:id/block', auth, requireAdmin, async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.isBlocked = isBlocked;
    user.blockReason = isBlocked ? blockReason : null;
    user.blockedAt = isBlocked ? new Date() : null;
    await user.save();

    res.json({ msg: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update user reputation
router.patch('/users/:id/reputation', auth, requireAdmin, async (req, res) => {
  try {
    const { reputation } = req.body;
    if (reputation < 0 || reputation > 100) {
      return res.status(400).json({ msg: 'Reputation must be between 0 and 100' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.reputation = reputation;
    await user.save();

    res.json({ msg: 'Reputation updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get all reports
router.get('/reports', auth, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = status !== 'all' ? { status } : {};

    const reports = await Report.find(query)
      .populate('reporter', 'name email role')
      .populate('reported', 'name email role reputation isBlocked')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Review report
router.patch('/reports/:id/review', auth, requireAdmin, async (req, res) => {
  try {
    const { status, action } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ msg: 'Report not found' });

    report.status = status;
    report.action = action;
    report.reviewedAt = new Date();
    report.reviewedBy = req.user._id;
    await report.save();

    // Apply action
    if (action && report.reported) {
      const reportedUser = await User.findById(report.reported);
      if (reportedUser) {
        if (action === 'reputation-reduced') {
          reportedUser.reputation = Math.max(0, reportedUser.reputation - 10);
          reportedUser.reportCount = (reportedUser.reportCount || 0) + 1;
          reportedUser.lastReportDate = new Date();
        } else if (action === 'blocked') {
          reportedUser.isBlocked = true;
          reportedUser.blockReason = report.reason;
          reportedUser.blockedAt = new Date();
        }
        await reportedUser.save();
      }
    }

    res.json({ msg: 'Report reviewed', report });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get contact logs with filters
router.get('/contact-logs', auth, requireAdmin, async (req, res) => {
  try {
    const { buyerId, farmerId, days = 7, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (buyerId) query.buyer = buyerId;
    if (farmerId) query.farmer = farmerId;
    if (days) {
      query.viewedAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const logs = await ContactLog.find(query)
      .populate('buyer', 'name email role reputation')
      .populate('farmer', 'name email location')
      .sort({ viewedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ContactLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Export contact logs to CSV
router.get('/contact-logs/export', auth, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const query = {
      viewedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };

    const logs = await ContactLog.find(query)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .sort({ viewedAt: -1 })
      .lean();

    const fields = [
      { label: 'Date', value: (row) => new Date(row.viewedAt).toISOString() },
      { label: 'Buyer Name', value: 'buyer.name' },
      { label: 'Buyer Email', value: 'buyer.email' },
      { label: 'Buyer Phone', value: 'buyer.phone' },
      { label: 'Farmer Name', value: 'farmer.name' },
      { label: 'Farmer Email', value: 'farmer.email' },
      { label: 'Farmer Phone', value: 'farmer.phone' },
      { label: 'IP Address', value: 'ipAddress' },
      { label: 'User Agent', value: 'userAgent' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(logs);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="contact-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
