const Alert = require('../models/Alert');
const ThresholdSetting = require('../models/ThresholdSetting');

/**
 * Checks a newly ingested sensor reading against defined thresholds.
 * Emits alerts if abnormal conditions are detected.
 */
async function checkThresholdsAndCreateAlerts(reading, pestRiskResult = null) {
  try {
    // Fetch threshold settings
    let settings = await ThresholdSetting.findOne();
    if (!settings) {
      settings = await ThresholdSetting.create({});
    }

    const {
      soilMoistureMin = 40,
      soilMoistureMax = 80,
      tempMin = 15,
      tempMax = 34,
      humidityMax = 80,
      phMin = 5.8,
      phMax = 7.5
    } = settings;

    const newAlerts = [];
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Helper to prevent duplicate recent active alerts
    async function shouldCreateAlert(alertType, fieldPlot) {
      const existing = await Alert.findOne({
        alertType,
        fieldPlot: fieldPlot || 'Plot 1',
        status: 'active',
        createdAt: { $gte: fifteenMinutesAgo }
      });
      return !existing;
    }

    // 1. Soil Moisture Low
    if (reading.soilMoisture < soilMoistureMin) {
      if (await shouldCreateAlert('SOIL_MOISTURE_LOW', reading.fieldPlot)) {
        newAlerts.push({
          alertType: 'SOIL_MOISTURE_LOW',
          severity: reading.soilMoisture < soilMoistureMin - 15 ? 'critical' : 'warning',
          title: `Low Soil Moisture in ${reading.fieldPlot || 'Field'}`,
          message: `Soil moisture dropped to ${reading.soilMoisture}%, which is below the configured threshold of ${soilMoistureMin}%. Crop may experience water deficit stress.`,
          cropName: reading.cropName || 'General',
          fieldPlot: reading.fieldPlot || 'Plot 1',
          valueDetected: `${reading.soilMoisture}%`,
          thresholdViolated: `< ${soilMoistureMin}%`,
          isSimulatedSource: !!reading.isSimulated
        });
      }
    }

    // 2. Soil Moisture High / Waterlogging
    if (reading.soilMoisture > soilMoistureMax) {
      if (await shouldCreateAlert('SOIL_MOISTURE_HIGH', reading.fieldPlot)) {
        newAlerts.push({
          alertType: 'SOIL_MOISTURE_HIGH',
          severity: 'warning',
          title: `High Soil Moisture / Waterlogging in ${reading.fieldPlot || 'Field'}`,
          message: `Soil moisture surged to ${reading.soilMoisture}% (exceeds threshold of ${soilMoistureMax}%). Risk of root zone oxygen deficiency.`,
          cropName: reading.cropName || 'General',
          fieldPlot: reading.fieldPlot || 'Plot 1',
          valueDetected: `${reading.soilMoisture}%`,
          thresholdViolated: `> ${soilMoistureMax}%`,
          isSimulatedSource: !!reading.isSimulated
        });
      }
    }

    // 3. Temperature High
    if (reading.soilTemperature > tempMax) {
      if (await shouldCreateAlert('TEMPERATURE_HIGH', reading.fieldPlot)) {
        newAlerts.push({
          alertType: 'TEMPERATURE_HIGH',
          severity: 'warning',
          title: `Elevated Temperature in ${reading.fieldPlot || 'Field'}`,
          message: `Temperature reached ${reading.soilTemperature}°C (configured max: ${tempMax}°C). May accelerate soil moisture loss and insect metabolism.`,
          cropName: reading.cropName || 'General',
          fieldPlot: reading.fieldPlot || 'Plot 1',
          valueDetected: `${reading.soilTemperature}°C`,
          thresholdViolated: `> ${tempMax}°C`,
          isSimulatedSource: !!reading.isSimulated
        });
      }
    }

    // 4. Ambient Humidity High
    if (reading.ambientHumidity > humidityMax) {
      if (await shouldCreateAlert('HUMIDITY_HIGH', reading.fieldPlot)) {
        newAlerts.push({
          alertType: 'HUMIDITY_HIGH',
          severity: 'warning',
          title: `High Ambient Humidity in ${reading.fieldPlot || 'Field'}`,
          message: `Relative humidity recorded at ${reading.ambientHumidity}% (threshold: ${humidityMax}%). Strongly favors foliar fungal spore germination.`,
          cropName: reading.cropName || 'General',
          fieldPlot: reading.fieldPlot || 'Plot 1',
          valueDetected: `${reading.ambientHumidity}%`,
          thresholdViolated: `> ${humidityMax}%`,
          isSimulatedSource: !!reading.isSimulated
        });
      }
    }

    // 5. Soil pH Out of Bounds
    if (reading.soilPh && (reading.soilPh < phMin || reading.soilPh > phMax)) {
      if (await shouldCreateAlert('PH_OUT_OF_BOUNDS', reading.fieldPlot)) {
        newAlerts.push({
          alertType: 'PH_OUT_OF_BOUNDS',
          severity: 'warning',
          title: `Soil pH Deviation in ${reading.fieldPlot || 'Field'}`,
          message: `Current soil pH is ${reading.soilPh} (acceptable range: ${phMin} - ${phMax}). May impede micro-nutrient bioavailability.`,
          cropName: reading.cropName || 'General',
          fieldPlot: reading.fieldPlot || 'Plot 1',
          valueDetected: `${reading.soilPh}`,
          thresholdViolated: `${reading.soilPh < phMin ? '< ' + phMin : '> ' + phMax}`,
          isSimulatedSource: !!reading.isSimulated
        });
      }
    }

    // 6. Pest Risk Alert (if risk engine produced HIGH)
    if (pestRiskResult && pestRiskResult.level === 'HIGH') {
      if (await shouldCreateAlert('HIGH_PEST_RISK', reading.fieldPlot)) {
        newAlerts.push({
          alertType: 'HIGH_PEST_RISK',
          severity: 'critical',
          title: `High Pest & Disease Risk Alert for ${reading.cropName || 'Crops'}`,
          message: `Agronomic disease-triangle model calculated an elevated risk score of ${pestRiskResult.riskScore}/100. Primary threats: ${pestRiskResult.identifiedThreats.map((t) => t.name).join(', ')}.`,
          cropName: reading.cropName || 'General',
          fieldPlot: reading.fieldPlot || 'Plot 1',
          valueDetected: `Risk Score: ${pestRiskResult.riskScore}`,
          thresholdViolated: `Score >= 65`,
          isSimulatedSource: !!reading.isSimulated
        });
      }
    }

    if (newAlerts.length > 0) {
      await Alert.insertMany(newAlerts);
    }

    return newAlerts;
  } catch (err) {
    console.error('Error checking thresholds:', err);
    return [];
  }
}

module.exports = {
  checkThresholdsAndCreateAlerts
};
