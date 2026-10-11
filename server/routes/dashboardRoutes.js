const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const ImageAnalysis = require('../models/ImageAnalysis');
const ThresholdSetting = require('../models/ThresholdSetting');
const { calculatePestRisk } = require('../services/pestRiskEngine');

// GET /api/dashboard - Aggregated metrics & recent telemetry
router.get('/', async (req, res) => {
  try {
    const settings = (await ThresholdSetting.findOne()) || {};

    // 1. Fetch crops summary
    const totalCrops = await Crop.countDocuments();
    const crops = await Crop.find().sort({ updatedAt: -1 }).limit(5);

    // 2. Fetch latest reading
    const latestReading = await SensorReading.findOne().sort({ timestamp: -1 });

    // 3. Fetch past 24 readings for charts
    const recentReadings = await SensorReading.find()
      .sort({ timestamp: -1 })
      .limit(24)
      .lean();
    // Reverse to chronological order for charts
    const chartData = recentReadings.reverse();

    // 4. Fetch active alerts
    const activeAlertsCount = await Alert.countDocuments({ status: 'active' });
    const recentAlerts = await Alert.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent Image Analyses
    const recentAnalyses = await ImageAnalysis.find()
      .sort({ analyzedAt: -1 })
      .limit(4);

    // 6. Calculate current Pest Risk based on latest readings
    const currentRisk = calculatePestRisk({
      temperature: latestReading ? latestReading.soilTemperature : 24,
      humidity: latestReading ? latestReading.ambientHumidity : 65,
      soilMoisture: latestReading ? latestReading.soilMoisture : 52,
      soilPh: latestReading ? latestReading.soilPh : 6.8,
      cropName: latestReading ? latestReading.cropName : 'Wheat',
      sensitivity: settings.pestRiskSensitivity || 'standard'
    });

    // 7. System & Sensor Mode indicators
    const hasPhysicalReading = await SensorReading.findOne({ dataSource: 'physical_esp32' });
    const isPhysicalActive = latestReading && latestReading.dataSource === 'physical_esp32';

    res.json({
      success: true,
      data: {
        summary: {
          totalCrops,
          activeAlertsCount,
          totalAnalyses: await ImageAnalysis.countDocuments(),
          latestReading: latestReading || {
            soilMoisture: 58,
            soilTemperature: 23.5,
            ambientHumidity: 65,
            soilPh: 6.8,
            isSimulated: true,
            dataSource: 'demo_simulation',
            timestamp: new Date()
          },
          sensorMode: {
            currentMode: isPhysicalActive ? 'physical' : 'demo_simulation',
            isSimulated: latestReading ? latestReading.isSimulated : true,
            hasPhysicalHistory: !!hasPhysicalReading,
            disclosure: latestReading && latestReading.isSimulated
              ? 'Demo Simulation: Values generated for software demonstration purposes.'
              : 'Physical Telemetry: Live data received from ESP32 field node.'
          }
        },
        crops,
        chartData,
        recentAlerts,
        recentAnalyses,
        currentRisk
      }
    });
  } catch (err) {
    console.error('Error in /api/dashboard:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics' });
  }
});

module.exports = router;
