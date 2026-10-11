const express = require('express');
const router = express.Router();
const ThresholdSetting = require('../models/ThresholdSetting');

// GET settings
router.get('/', async (req, res) => {
  try {
    let settings = await ThresholdSetting.findOne();
    if (!settings) {
      settings = await ThresholdSetting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update settings
router.put('/', async (req, res) => {
  try {
    let settings = await ThresholdSetting.findOne();
    if (!settings) {
      settings = new ThresholdSetting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, message: 'Settings saved successfully', data: settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
