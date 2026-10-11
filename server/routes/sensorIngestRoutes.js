const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const ThresholdSetting = require('../models/ThresholdSetting');
const Crop = require('../models/Crop');
const { checkThresholdsAndCreateAlerts } = require('../services/alertService');
const { calculatePestRisk } = require('../services/pestRiskEngine');

// Middleware to check ESP32 API Key
async function authenticateEsp32Device(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'] || req.body.apiKey;
  const settings = await ThresholdSetting.findOne();
  const validKey = settings ? settings.deviceApiKey : 'agrisense_esp32_secret_key_2026';

  if (!apiKey || apiKey.replace('Bearer ', '') !== validKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing ESP32 API key in x-api-key header.'
    });
  }
  next();
}

/**
 * POST /api/sensors/ingest
 * Dedicated endpoint for ESP32 Microcontrollers sending field telemetry
 */
router.post('/ingest', authenticateEsp32Device, async (req, res) => {
  try {
    const {
      deviceId = 'ESP32_AGRI_NODE_01',
      cropName = 'Wheat',
      fieldPlot = 'Plot 1',
      soilMoisture,
      soilTemperature,
      ambientHumidity,
      soilPh = 6.5,
      batteryLevel = 90
    } = req.body;

    if (soilMoisture === undefined || soilTemperature === undefined || ambientHumidity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload. soilMoisture, soilTemperature, and ambientHumidity are required.'
      });
    }

    // Ingest as physical reading - strictly marked non-simulated
    const reading = await SensorReading.create({
      deviceId,
      cropName,
      fieldPlot,
      soilMoisture: Number(soilMoisture),
      soilTemperature: Number(soilTemperature),
      ambientHumidity: Number(ambientHumidity),
      soilPh: Number(soilPh),
      batteryLevel: Number(batteryLevel),
      isSimulated: false,
      dataSource: 'physical_esp32',
      timestamp: new Date()
    });

    // Run risk engine
    const pestRisk = calculatePestRisk({
      temperature: reading.soilTemperature,
      humidity: reading.ambientHumidity,
      soilMoisture: reading.soilMoisture,
      soilPh: reading.soilPh,
      cropName: reading.cropName
    });

    // Check thresholds and trigger alerts
    const alertsTriggered = await checkThresholdsAndCreateAlerts(reading, pestRisk);

    res.status(201).json({
      success: true,
      message: 'ESP32 Telemetry ingested successfully.',
      readingId: reading._id,
      isSimulated: false,
      dataSource: 'physical_esp32',
      pestRiskLevel: pestRisk.level,
      alertsTriggered: alertsTriggered.length
    });
  } catch (err) {
    console.error('ESP32 Ingestion Error:', err);
    res.status(500).json({ success: false, message: 'Server error processing ESP32 telemetry' });
  }
});

/**
 * POST /api/sensors/simulate
 * Explicit Demonstration Mode Generator
 * Creates realistic sample data clearly labelled as simulated
 */
router.post('/simulate', async (req, res) => {
  try {
    const { cropName, scenario = 'optimal' } = req.body;
    const crop = (await Crop.findOne(cropName ? { name: cropName } : {})) || {
      name: 'Wheat',
      fieldPlot: 'Plot 1 North'
    };

    let soilMoisture = 55;
    let soilTemperature = 23.5;
    let ambientHumidity = 62;
    let soilPh = 6.7;

    // Apply scenario parameters
    if (scenario === 'dry_stress') {
      soilMoisture = 24.5; // low moisture
      soilTemperature = 32.0;
      ambientHumidity = 35;
      soilPh = 6.9;
    } else if (scenario === 'high_fungal_risk') {
      soilMoisture = 76.0;
      soilTemperature = 24.0;
      ambientHumidity = 88; // high humidity
      soilPh = 6.4;
    } else if (scenario === 'waterlogged') {
      soilMoisture = 89.0;
      soilTemperature = 21.0;
      ambientHumidity = 82;
      soilPh = 5.9;
    } else {
      // Normal random walk
      soilMoisture = Number((48 + Math.random() * 22).toFixed(1));
      soilTemperature = Number((20 + Math.random() * 8).toFixed(1));
      ambientHumidity = Number((55 + Math.random() * 20).toFixed(1));
      soilPh = Number((6.2 + Math.random() * 0.8).toFixed(1));
    }

    // MANDATORY TRANSPARENCY: Marked as isSimulated: true
    const reading = await SensorReading.create({
      deviceId: 'ESP32_SIMULATED_DEMO_NODE',
      cropName: crop.name,
      fieldPlot: crop.fieldPlot,
      soilMoisture,
      soilTemperature,
      ambientHumidity,
      soilPh,
      batteryLevel: Math.floor(80 + Math.random() * 19),
      isSimulated: true,
      dataSource: 'demo_simulation',
      timestamp: new Date()
    });

    const pestRisk = calculatePestRisk({
      temperature: reading.soilTemperature,
      humidity: reading.ambientHumidity,
      soilMoisture: reading.soilMoisture,
      soilPh: reading.soilPh,
      cropName: reading.cropName
    });

    const alertsTriggered = await checkThresholdsAndCreateAlerts(reading, pestRisk);

    res.status(201).json({
      success: true,
      message: 'Demonstration telemetry packet generated.',
      data: reading,
      isSimulated: true,
      transparencyNotice: 'NOTICE: This is simulated data generated for software testing and demonstration.',
      pestRisk,
      alertsTriggered: alertsTriggered.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
