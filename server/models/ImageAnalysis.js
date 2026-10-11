const mongoose = require('mongoose');

const imageAnalysisSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: false
    },
    cropName: {
      type: String,
      required: true,
      default: 'General Foliage'
    },
    imageUrl: {
      type: String,
      required: true
    },
    originalFilename: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    // Methodology and AI tier label
    analysisType: {
      type: String,
      enum: ['rgb_heuristic_cv', 'python_microservice', 'demonstration_diagnostic', 'plantvillage_mobilenetv2_cnn', 'offline_notice'],
      default: 'plantvillage_mobilenetv2_cnn'
    },
    isDemonstrationResult: {
      type: Boolean,
      default: false
    },
    diagnosis: {
      primaryCondition: {
        type: String,
        required: true,
        default: 'Healthy Foliage'
      },
      category: {
        type: String,
        enum: ['Healthy', 'Fungal Infection', 'Bacterial Infection', 'Viral Infection', 'Nutrient Deficiency', 'Pest Damage', 'Water Stress', 'Inconclusive', 'Unknown'],
        default: 'Healthy'
      },
      confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      severity: {
        type: String,
        enum: ['None', 'Low', 'Moderate', 'High', 'Critical', 'Uncertain', 'Not Estimated'],
        default: 'None'
      },
      severityBasis: {
        type: String,
        default: ''
      },
      predictedClass: {
        type: String,
        default: ''
      },
      predictedCrop: {
        type: String,
        default: ''
      },
      isInconclusive: {
        type: Boolean,
        default: false
      },
      uncertaintyWarning: {
        type: String,
        default: null
      },
      cropMismatchWarning: {
        type: String,
        default: null
      },
      affectedAreaPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      symptomsDetected: [
        {
          type: String
        }
      ],
      recommendedActions: [
        {
          type: String
        }
      ],
      preventativeMeasures: [
        {
          type: String
        }
      ]
    },
    // Spectral & Color Metrics (RGB vegetation index approximation)
    colorMetrics: {
      avgRed: { type: Number, default: 0 },
      avgGreen: { type: Number, default: 0 },
      avgBlue: { type: Number, default: 0 },
      variIndex: { type: Number, default: 0 }, // Visible Atmospherically Resistant Index
      greenCoveragePercent: { type: Number, default: 0 },
      yellowNecrosisPercent: { type: Number, default: 0 }
    },
    // Mandatory Scientific Disclosure
    scientificDisclaimer: {
      sensorType: {
        type: String,
        default: 'Standard RGB (Red, Green, Blue) Optical Sensor'
      },
      isTrueMultispectral: {
        type: Boolean,
        default: false
      },
      disclaimerText: {
        type: String,
        default:
          'Scientific Disclosure: Standard smartphone and web cameras capture standard RGB bands only. True agricultural NDVI and canopy chemical status require calibrated Near-Infrared (NIR) or multispectral optical sensors. The Visible Atmospherically Resistant Index (VARI) provided here is an RGB-based visual proxy. Field observations and laboratory tissue assays must verify critical treatments.'
      }
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImageAnalysis', imageAnalysisSchema);
