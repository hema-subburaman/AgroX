const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      default: 'ESP32_AGRI_NODE_01',
      trim: true
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: false
    },
    cropName: {
      type: String,
      required: true,
      default: 'Wheat'
    },
    fieldPlot: {
      type: String,
      default: 'Plot 1'
    },
    soilMoisture: {
      type: Number,
      required: true, // percentage (0 - 100)
      min: 0,
      max: 100
    },
    soilTemperature: {
      type: Number,
      required: true // Celsius (-20 to 60)
    },
    ambientHumidity: {
      type: Number,
      required: true, // percentage (0 - 100)
      min: 0,
      max: 100
    },
    soilPh: {
      type: Number,
      min: 0,
      max: 14,
      default: 6.8
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 95
    },
    // CRITICAL: Transparency requirement - Never present simulated values as real sensor measurements
    isSimulated: {
      type: Boolean,
      required: true,
      default: false
    },
    dataSource: {
      type: String,
      enum: ['physical_esp32', 'demo_simulation', 'manual_entry'],
      required: true,
      default: 'physical_esp32'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
