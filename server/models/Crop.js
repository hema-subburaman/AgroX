const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    variety: {
      type: String,
      default: 'Standard'
    },
    fieldPlot: {
      type: String,
      required: true,
      default: 'Plot 1'
    },
    growthStage: {
      type: String,
      enum: ['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvest'],
      default: 'Vegetative'
    },
    sowingDate: {
      type: Date,
      default: Date.now
    },
    areaHectares: {
      type: Number,
      default: 2.5
    },
    status: {
      type: String,
      enum: ['Healthy', 'Monitoring', 'Attention Needed', 'Critical'],
      default: 'Healthy'
    },
    optimalRanges: {
      moistureMin: { type: Number, default: 45 },
      moistureMax: { type: Number, default: 75 },
      tempMin: { type: Number, default: 18 },
      tempMax: { type: Number, default: 30 },
      humidityMax: { type: Number, default: 75 },
      phMin: { type: Number, default: 6.0 },
      phMax: { type: Number, default: 7.2 }
    },
    commonPests: [
      {
        type: String
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Crop', cropSchema);
