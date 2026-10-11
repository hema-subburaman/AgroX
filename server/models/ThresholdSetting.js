const mongoose = require('mongoose');

const thresholdSettingSchema = new mongoose.Schema(
  {
    systemMode: {
      type: String,
      enum: ['demo', 'physical'],
      default: 'demo'
    },
    deviceApiKey: {
      type: String,
      default: 'agrisense_esp32_secret_key_2026'
    },
    soilMoistureMin: {
      type: Number,
      default: 40 // %
    },
    soilMoistureMax: {
      type: Number,
      default: 80 // %
    },
    tempMin: {
      type: Number,
      default: 15 // °C
    },
    tempMax: {
      type: Number,
      default: 34 // °C
    },
    humidityMax: {
      type: Number,
      default: 80 // %
    },
    phMin: {
      type: Number,
      default: 5.8
    },
    phMax: {
      type: Number,
      default: 7.5
    },
    pestRiskSensitivity: {
      type: String,
      enum: ['conservative', 'standard', 'sensitive'],
      default: 'standard'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ThresholdSetting', thresholdSettingSchema);
