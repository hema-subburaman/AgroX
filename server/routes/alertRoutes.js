const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET all alerts with filter
router.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Alert.countDocuments(query);
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const counts = {
      active: await Alert.countDocuments({ status: 'active' }),
      acknowledged: await Alert.countDocuments({ status: 'acknowledged' }),
      resolved: await Alert.countDocuments({ status: 'resolved' })
    };

    res.json({
      success: true,
      counts,
      data: alerts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH acknowledge alert
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged', acknowledgedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert acknowledged', data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH resolve alert
router.patch('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert resolved', data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST clear resolved alerts
router.post('/clear-resolved', async (req, res) => {
  try {
    const result = await Alert.deleteMany({ status: 'resolved' });
    res.json({ success: true, message: `Removed ${result.deletedCount} resolved alerts.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
