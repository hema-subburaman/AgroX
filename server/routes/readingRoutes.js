const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const { checkThresholdsAndCreateAlerts } = require('../services/alertService');
const { calculatePestRisk } = require('../services/pestRiskEngine');

// GET /api/readings - filterable and paginated readings
router.get('/', async (req, res) => {
  try {
    const { cropName, timeframe, limit = 50, page = 1, dataSource } = req.query;
    const query = {};

    if (cropName && cropName !== 'All') {
      query.cropName = cropName;
    }

    if (dataSource) {
      query.dataSource = dataSource;
    }

    if (timeframe) {
      const now = new Date();
      if (timeframe === '24h') {
        query.timestamp = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      } else if (timeframe === '7d') {
        query.timestamp = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (timeframe === '30d') {
        query.timestamp = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (pageNum - 1) * limitNum;

    const total = await SensorReading.countDocuments(query);
    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: readings,
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

// GET /api/readings/latest - Most recent reading
router.get('/latest', async (req, res) => {
  try {
    const latest = await SensorReading.findOne().sort({ timestamp: -1 });
    if (!latest) {
      return res.status(404).json({ success: false, message: 'No sensor readings found' });
    }
    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/readings - Manual entry of soil and climate readings
router.post('/', async (req, res) => {
  try {
    const {
      cropName = 'Wheat',
      fieldPlot = 'Plot 1',
      soilMoisture,
      soilTemperature,
      ambientHumidity,
      soilPh = 6.8,
      batteryLevel = 100
    } = req.body;

    if (soilMoisture === undefined || soilTemperature === undefined || ambientHumidity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'soilMoisture, soilTemperature, and ambientHumidity are required fields.'
      });
    }

    const reading = await SensorReading.create({
      deviceId: 'MANUAL_ENTRY_LOG',
      cropName,
      fieldPlot,
      soilMoisture: Number(soilMoisture),
      soilTemperature: Number(soilTemperature),
      ambientHumidity: Number(ambientHumidity),
      soilPh: Number(soilPh),
      batteryLevel: Number(batteryLevel),
      isSimulated: false,
      dataSource: 'manual_entry',
      timestamp: new Date()
    });

    // Check pest risk and trigger alerts
    const risk = calculatePestRisk({
      temperature: reading.soilTemperature,
      humidity: reading.ambientHumidity,
      soilMoisture: reading.soilMoisture,
      soilPh: reading.soilPh,
      cropName: reading.cropName
    });

    const createdAlerts = await checkThresholdsAndCreateAlerts(reading, risk);

    res.status(201).json({
      success: true,
      message: 'Reading recorded successfully',
      data: reading,
      alertsTriggered: createdAlerts.length,
      pestRisk: risk
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
