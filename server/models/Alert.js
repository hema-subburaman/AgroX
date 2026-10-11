const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    alertType: {
      type: String,
      enum: [
        'SOIL_MOISTURE_LOW',
        'SOIL_MOISTURE_HIGH',
        'TEMPERATURE_HIGH',
        'TEMPERATURE_LOW',
        'HUMIDITY_HIGH',
        'PH_OUT_OF_BOUNDS',
        'HIGH_PEST_RISK',
        'DISEASE_SYMPTOM_DETECTED',
        'SENSOR_OFFLINE',
        'SYSTEM_INFO'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    cropName: {
      type: String,
      default: 'General'
    },
    fieldPlot: {
      type: String,
      default: 'Plot 1'
    },
    valueDetected: {
      type: String,
      default: ''
    },
    thresholdViolated: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
      index: true
    },
    isSimulatedSource: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
