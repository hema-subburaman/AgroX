const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const Crop = require('../models/Crop');
const ThresholdSetting = require('../models/ThresholdSetting');
const { calculatePestRisk } = require('../services/pestRiskEngine');

// GET /api/pest/current-risk
router.get('/current-risk', async (req, res) => {
  try {
    const { cropName } = req.query;
    const settings = (await ThresholdSetting.findOne()) || {};

    const readingQuery = {};
    if (cropName && cropName !== 'All') {
      readingQuery.cropName = cropName;
    }
    const latestReading = await SensorReading.findOne(readingQuery).sort({ timestamp: -1 });

    const riskResult = calculatePestRisk({
      temperature: latestReading ? latestReading.soilTemperature : 25,
      humidity: latestReading ? latestReading.ambientHumidity : 65,
      soilMoisture: latestReading ? latestReading.soilMoisture : 55,
      soilPh: latestReading ? latestReading.soilPh : 6.8,
      cropName: cropName || (latestReading ? latestReading.cropName : 'Wheat'),
      sensitivity: settings.pestRiskSensitivity || 'standard'
    });

    res.json({
      success: true,
      data: {
        ...riskResult,
        basedOnReading: latestReading || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pest/simulate-scenario - What-if environmental scenario test
router.post('/simulate-scenario', async (req, res) => {
  try {
    const { temperature, humidity, soilMoisture, soilPh, cropName, growthStage, sensitivity } = req.body;

    const riskResult = calculatePestRisk({
      temperature: Number(temperature) || 25,
      humidity: Number(humidity) || 60,
      soilMoisture: Number(soilMoisture) || 50,
      soilPh: Number(soilPh) || 6.5,
      cropName: cropName || 'Wheat',
      growthStage: growthStage || 'Vegetative',
      sensitivity: sensitivity || 'standard'
    });

    res.json({
      success: true,
      data: riskResult
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
