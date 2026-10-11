const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Crop = require('./models/Crop');
const SensorReading = require('./models/SensorReading');
const Alert = require('./models/Alert');
const ImageAnalysis = require('./models/ImageAnalysis');
const ThresholdSetting = require('./models/ThresholdSetting');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrisense_db';

const SEED_CROPS = [
  {
    name: 'Wheat',
    variety: 'Durum HD-2967',
    fieldPlot: 'Plot 1 North',
    growthStage: 'Vegetative',
    areaHectares: 3.5,
    status: 'Healthy',
    optimalRanges: {
      moistureMin: 45,
      moistureMax: 70,
      tempMin: 16,
      tempMax: 28,
      humidityMax: 70,
      phMin: 6.0,
      phMax: 7.5
    },
    commonPests: ['Stripe Rust', 'Aphids', 'Armyworm'],
    notes: 'Winter wheat crop approaching tillering phase. Soil is clay loam.'
  },
  {
    name: 'Tomato',
    variety: 'Roma VF Determinate',
    fieldPlot: 'Greenhouse B-2',
    growthStage: 'Flowering',
    areaHectares: 1.2,
    status: 'Monitoring',
    optimalRanges: {
      moistureMin: 60,
      moistureMax: 80,
      tempMin: 20,
      tempMax: 30,
      humidityMax: 75,
      phMin: 6.2,
      phMax: 6.8
    },
    commonPests: ['Early Blight', 'Whiteflies', 'Hornworms'],
    notes: 'Drip-irrigated controlled environment. High vigilance for early blight.'
  },
  {
    name: 'Maize',
    variety: 'Pioneer 3302 Hybrid',
    fieldPlot: 'Plot 3 West',
    growthStage: 'Vegetative',
    areaHectares: 5.0,
    status: 'Healthy',
    optimalRanges: {
      moistureMin: 50,
      moistureMax: 75,
      tempMin: 22,
      tempMax: 32,
      humidityMax: 75,
      phMin: 5.8,
      phMax: 7.2
    },
    commonPests: ['Fall Armyworm', 'Stem Borer', 'Leaf Blight'],
    notes: 'V6 stage rapid growth. Pheromone monitoring traps installed.'
  },
  {
    name: 'Cotton',
    variety: 'Bt RCH-659',
    fieldPlot: 'Plot 4 South',
    growthStage: 'Flowering',
    areaHectares: 4.2,
    status: 'Attention Needed',
    optimalRanges: {
      moistureMin: 40,
      moistureMax: 65,
      tempMin: 24,
      tempMax: 34,
      humidityMax: 65,
      phMin: 6.0,
      phMax: 7.8
    },
    commonPests: ['Whitefly', 'Leaf Curl Virus', 'Bollworm'],
    notes: 'Low soil moisture noticed in south-western corner of plot.'
  },
  {
    name: 'Rice',
    variety: 'Basmati Pusa-1121',
    fieldPlot: 'Paddy Basin A',
    growthStage: 'Vegetative',
    areaHectares: 2.8,
    status: 'Healthy',
    optimalRanges: {
      moistureMin: 75,
      moistureMax: 92,
      tempMin: 22,
      tempMax: 33,
      humidityMax: 85,
      phMin: 5.5,
      phMax: 7.0
    },
    commonPests: ['Stem Borer', 'Bacterial Leaf Blight', 'Brown Planthopper'],
    notes: 'Submerged field conditions maintained at 4cm water depth.'
  }
];

async function seedDatabase() {
  try {
    console.log('Seeding AgriSense AI Database at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    // Clear existing collections
    await Crop.deleteMany({});
    await SensorReading.deleteMany({});
    await Alert.deleteMany({});
    await ImageAnalysis.deleteMany({});
    await ThresholdSetting.deleteMany({});

    // 1. Seed Crops
    const createdCrops = await Crop.insertMany(SEED_CROPS);
    console.log(`Created ${createdCrops.length} crops.`);

    // 2. Seed Threshold Settings
    await ThresholdSetting.create({
      systemMode: 'demo',
      deviceApiKey: 'agrisense_esp32_secret_key_2026',
      soilMoistureMin: 40,
      soilMoistureMax: 80,
      tempMin: 15,
      tempMax: 34,
      humidityMax: 80,
      phMin: 5.8,
      phMax: 7.5,
      pestRiskSensitivity: 'standard',
      notificationsEnabled: true
    });
    console.log('Created threshold settings.');

    // 3. Seed 36 hourly telemetry readings (diurnal cycle)
    const readings = [];
    const now = Date.now();
    for (let i = 36; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      // Diurnal temperature curve (cooler at night, warmer in afternoon)
      const baseTemp = 18 + 10 * Math.sin(((hour - 8) / 24) * 2 * Math.PI);
      const soilTemp = Number((baseTemp + (Math.random() * 2 - 1)).toFixed(1));

      // Humidity is inverse of temperature
      const humidity = Number((80 - 25 * Math.sin(((hour - 8) / 24) * 2 * Math.PI) + (Math.random() * 4 - 2)).toFixed(1));

      // Moisture drying gradually
      const moisture = Number((62 - (i % 12) * 1.5 + (Math.random() * 2 - 1)).toFixed(1));
      const ph = Number((6.6 + Math.sin(i) * 0.2).toFixed(2));

      readings.push({
        deviceId: 'ESP32_AGRI_NODE_01',
        cropName: 'Wheat',
        fieldPlot: 'Plot 1 North',
        soilMoisture: Math.max(35, Math.min(85, moisture)),
        soilTemperature: soilTemp,
        ambientHumidity: Math.max(30, Math.min(95, humidity)),
        soilPh: ph,
        batteryLevel: Math.floor(96 - (36 - i) * 0.15),
        isSimulated: true, // Transparent demo label
        dataSource: 'demo_simulation',
        timestamp
      });
    }
    await SensorReading.insertMany(readings);
    console.log(`Created ${readings.length} sensor readings with clear simulation flags.`);

    // 4. Seed Alerts
    const seedAlerts = [
      {
        alertType: 'SOIL_MOISTURE_LOW',
        severity: 'warning',
        title: 'Low Soil Moisture in Plot 4 South',
        message: 'Soil moisture dropped to 36.5% for Cotton crop, below the target minimum of 40%. Irrigation recommended.',
        cropName: 'Cotton',
        fieldPlot: 'Plot 4 South',
        valueDetected: '36.5%',
        thresholdViolated: '< 40%',
        status: 'active',
        isSimulatedSource: true,
        createdAt: new Date(now - 45 * 60 * 1000)
      },
      {
        alertType: 'HUMIDITY_HIGH',
        severity: 'warning',
        title: 'High Humidity in Greenhouse B-2',
        message: 'Relative humidity reached 83.4%. Fungal spore germination index elevated for Tomato plants.',
        cropName: 'Tomato',
        fieldPlot: 'Greenhouse B-2',
        valueDetected: '83.4%',
        thresholdViolated: '> 75%',
        status: 'active',
        isSimulatedSource: true,
        createdAt: new Date(now - 120 * 60 * 1000)
      },
      {
        alertType: 'TEMPERATURE_HIGH',
        severity: 'info',
        title: 'Mid-Day Temperature Surge',
        message: 'Plot 3 West temperature peaked at 31.8°C during peak solar irradiance.',
        cropName: 'Maize',
        fieldPlot: 'Plot 3 West',
        valueDetected: '31.8°C',
        thresholdViolated: '> 30°C',
        status: 'acknowledged',
        acknowledgedAt: new Date(now - 60 * 60 * 1000),
        isSimulatedSource: true,
        createdAt: new Date(now - 300 * 60 * 1000)
      }
    ];
    await Alert.insertMany(seedAlerts);
    console.log(`Created ${seedAlerts.length} initial alerts.`);

    // 5. Seed Demonstration Image Analyses with Scientific Disclaimers
    const sampleAnalyses = [
      {
        cropName: 'Tomato',
        imageUrl: '/uploads/demo-tomato-early-blight.jpg',
        originalFilename: 'field_sample_leaf_01.jpg',
        fileSize: 1420580,
        mimeType: 'image/jpeg',
        analysisType: 'rgb_heuristic_cv',
        isDemonstrationResult: true,
        diagnosis: {
          primaryCondition: 'Early Blight (Alternaria solani)',
          category: 'Fungal Infection',
          confidenceScore: 0.89,
          severity: 'Moderate',
          affectedAreaPercentage: 18.4,
          symptomsDetected: [
            'Concentric target-like necrotic rings on lower leaf margins',
            'Visible chlorotic yellow halo surrounding brown lesions',
            'Slight petiole curling'
          ],
          recommendedActions: [
            'Prune affected bottom leaves to prevent ground splash reinfection',
            'Apply bio-fungicide (Trichoderma harzianum or Bacillus subtilis) during late afternoon',
            'Switch from overhead watering to subsurface drip'
          ],
          preventativeMeasures: [
            'Apply dry straw mulch around plant base',
            'Maintain 60cm spacing between plants to maximize airflow'
          ]
        },
        colorMetrics: {
          avgRed: 104,
          avgGreen: 98,
          avgBlue: 48,
          variIndex: -0.04,
          greenCoveragePercent: 61,
          yellowNecrosisPercent: 22
        },
        scientificDisclaimer: {
          sensorType: 'Standard RGB (Red, Green, Blue) Optical Sensor',
          isTrueMultispectral: false,
          disclaimerText:
            'Scientific Disclosure: Standard optical camera images cannot measure calibrated Near-Infrared (NIR) reflectance. Spectral NDVI cannot be determined without specialized multispectral hardware. This diagnostic is an RGB-based visual proxy for initial scouting.'
        },
        analyzedAt: new Date(now - 4 * 60 * 60 * 1000)
      },
      {
        cropName: 'Wheat',
        imageUrl: '/uploads/demo-wheat-healthy.jpg',
        originalFilename: 'plot1_wheat_canopy.jpg',
        fileSize: 2048500,
        mimeType: 'image/jpeg',
        analysisType: 'rgb_heuristic_cv',
        isDemonstrationResult: true,
        diagnosis: {
          primaryCondition: 'Healthy Wheat Foliage',
          category: 'Healthy',
          confidenceScore: 0.94,
          severity: 'None',
          affectedAreaPercentage: 0,
          symptomsDetected: ['Uniform high chlorophyll reflectance', 'Erect turgid blades', 'No foliar necrosis observed'],
          recommendedActions: ['Continue scheduled drip cycle', 'Maintain routine scouting every 4 days'],
          preventativeMeasures: ['Ensure balanced nitrogen application at tillering stage']
        },
        colorMetrics: {
          avgRed: 52,
          avgGreen: 168,
          avgBlue: 42,
          variIndex: 0.65,
          greenCoveragePercent: 91,
          yellowNecrosisPercent: 1
        },
        scientificDisclaimer: {
          sensorType: 'Standard RGB (Red, Green, Blue) Optical Sensor',
          isTrueMultispectral: false,
          disclaimerText:
            'Scientific Disclosure: Standard optical camera images cannot measure calibrated Near-Infrared (NIR) reflectance. Spectral NDVI cannot be determined without specialized multispectral hardware. This diagnostic is an RGB-based visual proxy for initial scouting.'
        },
        analyzedAt: new Date(now - 18 * 60 * 60 * 1000)
      }
    ];
    await ImageAnalysis.insertMany(sampleAnalyses);
    console.log(`Created ${sampleAnalyses.length} sample image analyses.`);

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
