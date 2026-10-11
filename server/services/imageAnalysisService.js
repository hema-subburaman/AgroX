const http = require('http');
const fs = require('fs');
const path = require('path');

// Knowledge base of crop symptom heuristics for agricultural demonstration
const CROP_SYMPTOM_DATABASE = {
  Wheat: [
    {
      condition: 'Wheat Stripe Rust (Puccinia striiformis)',
      category: 'Fungal Infection',
      severity: 'Moderate',
      symptoms: [
        'Linear yellow-orange pustules aligned along leaf veins',
        'Premature chlorosis and leaf drying on upper canopy',
        'Visible loss of green leaf area index'
      ],
      actions: [
        'Apply triazole-based protective fungicide at flag leaf stage',
        'Isolate infected field section and sanitize farm equipment',
        'Avoid excessive nitrogen fertilization which exacerbates succulent growth'
      ],
      preventative: [
        'Select rust-resistant certified seed varieties for next cycle',
        'Adhere to balanced N-P-K nutrient application rates'
      ]
    },
    {
      condition: 'Healthy Wheat Canopy',
      category: 'Healthy',
      severity: 'None',
      symptoms: ['Uniform dark green pigment', 'Turgid upright leaf blades', 'No foliar necrosis observed'],
      actions: ['Continue planned irrigation schedule', 'Monitor soil moisture at tillering stage'],
      preventative: ['Maintain regular scouting along plot transects']
    },
    {
      condition: 'Nitrogen Deficiency (Chlorosis)',
      category: 'Nutrient Deficiency',
      severity: 'Low',
      symptoms: ['Generalized pale yellowing starting from older lower leaves', 'Reduced tiller density', 'Stunted plant height'],
      actions: [
        'Conduct foliar spray of 2% urea solution for immediate green-up',
        'Review soil nitrogen levels and adjust top-dressing application'
      ],
      preventative: ['Incorporate organic matter or green manure during seedbed preparation']
    }
  ],
  Tomato: [
    {
      condition: 'Early Blight (Alternaria solani)',
      category: 'Fungal Infection',
      severity: 'Moderate',
      symptoms: [
        'Concentric dark rings (target-board spots) surrounded by chlorotic halos',
        'Lower foliage browning and premature defoliation',
        'Lesions extending toward stem junctions'
      ],
      actions: [
        'Prune and safely destroy infected lower leaves (do not compost)',
        'Apply copper hydroxide or chlorothalonil spray during dry afternoon',
        'Avoid overhead sprinkler irrigation; switch to root drip'
      ],
      preventative: [
        'Apply 5cm organic mulch around tomato bases to prevent rain-splash soil inoculation',
        'Practice 3-year crop rotation with non-solanaceous crops'
      ]
    },
    {
      condition: 'Healthy Tomato Foliage',
      category: 'Healthy',
      severity: 'None',
      symptoms: ['Deep green vigorous foliage', 'Active terminal buds', 'Zero foliar lesions'],
      actions: ['Maintain balanced drip irrigation', 'Inspect undersides of leaves weekly for aphids'],
      preventative: ['Keep stakes sturdy and provide adequate air ventilation between plants']
    },
    {
      condition: 'Blossom End Rot & Calcium Stress',
      category: 'Nutrient Deficiency',
      severity: 'Low',
      symptoms: ['Slight leaf margin curling', 'Fruit bottom water-soaked spots (if fruiting)', 'Uneven transpiration'],
      actions: ['Stabilize watering schedule to prevent moisture fluctuation', 'Foliar spray chelated calcium solution'],
      preventative: ['Maintain soil pH between 6.2 and 6.8 for optimal calcium availability']
    }
  ],
  Maize: [
    {
      condition: 'Fall Armyworm Foliar Damage (Spodoptera frugiperda)',
      category: 'Pest Damage',
      severity: 'High',
      symptoms: [
        'Windowpaning and ragged irregular holes on whorl leaves',
        'Visible moist sawdust-like larval frass inside the leaf whorl',
        'Terminal whorl destruction'
      ],
      actions: [
        'Apply biological control: Bacillus thuringiensis (Bt) or Neem seed kernel extract (NSKE 5%)',
        'Apply dry clean sand into leaf whorls to deter caterpillar feeding',
        'Pheromone trap installation at 5 traps per hectare'
      ],
      preventative: [
        'Intercrop maize with desmodium and plant napier grass borders (Push-Pull strategy)',
        'Early sowing to escape peak moth migration flights'
      ]
    },
    {
      condition: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
      category: 'Fungal Infection',
      severity: 'Moderate',
      symptoms: ['Long elliptical grayish-green or tan lesions', 'Lesions coalescing to scorch entire leaf blade'],
      actions: ['Apply strobilurin fungicide if lesions appear prior to silking stage', 'Destroy crop residue post-harvest'],
      preventative: ['Use resistant maize hybrids and rotate with legumes']
    },
    {
      condition: 'Healthy Corn Foliage',
      category: 'Healthy',
      severity: 'None',
      symptoms: ['Vibrant broad leaf structure', 'Strong central midrib', 'Uniform dark emerald color'],
      actions: ['Support nitrogen requirement during V6-V10 rapid vegetative phase'],
      preventative: ['Maintain weed-free zone within 30cm of plant stems']
    }
  ],
  Cotton: [
    {
      condition: 'Cotton Leaf Curl Virus (CLCuV)',
      category: 'Bacterial Infection',
      severity: 'High',
      symptoms: [
        'Upward and downward curling of leaf margins',
        'Thickened, prominent primary and secondary veins',
        'Small enations (cup-shaped outgrowths) on leaf undersides'
      ],
      actions: [
        'Eradicate whitefly vectors (Bemisia tabaci) using insecticidal soap or neem oil',
        'Rogue out severely stunted infected plants to prevent field-wide vector spread'
      ],
      preventative: ['Sow CLCuV-resistant cotton varieties', 'Eradicate weed hosts (Abutilon, Sida) along farm borders']
    },
    {
      condition: 'Healthy Cotton Foliage',
      category: 'Healthy',
      severity: 'None',
      symptoms: ['Broad palmate lobed leaves', 'Healthy green pigment without vein swelling'],
      actions: ['Inspect weekly for sucking pests (jassids and thrips)'],
      preventative: ['Maintain beneficial border floral strips']
    }
  ],
  Rice: [
    {
      condition: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
      category: 'Bacterial Infection',
      severity: 'High',
      symptoms: [
        'Water-soaked stripes along leaf margins turning wavy yellow-white',
        'Milky bacterial dew droplets oozing in morning hours',
        'Entire leaf blade drying with grayish hue'
      ],
      actions: [
        'Drain excess standing water temporarily to restrict bacterial motility',
        'Avoid nitrogen top-dressing during active disease flare-up',
        'Spray copper oxychloride combined with validamycin'
      ],
      preventative: ['Seed treatment with bactericide', 'Maintain balanced potassium fertilization']
    },
    {
      condition: 'Healthy Paddy Foliage',
      category: 'Healthy',
      severity: 'None',
      symptoms: ['Erect lush green leaves', 'Clean tillers without sheath rot lesions'],
      actions: ['Regulate water level according to growth phase'],
      preventative: ['Keep bunds clean of perennial grassy weeds']
    }
  ],
  General: [
    {
      condition: 'General Foliar Chlorosis (Chlorophyll Loss)',
      category: 'Nutrient Deficiency',
      severity: 'Moderate',
      symptoms: ['Loss of vibrant green coloration', 'Interveinal yellowing', 'Reduced photosynthetic rate'],
      actions: ['Check soil pH and moisture balance', 'Apply balanced micronutrient foliar spray (Fe, Mg, Zn)'],
      preventative: ['Regular soil testing every crop season']
    },
    {
      condition: 'Foliar Powdery Mildew',
      category: 'Fungal Infection',
      severity: 'Moderate',
      symptoms: ['White talcum-like powdery patches on leaf surfaces', 'Leaves curling upward and becoming brittle'],
      actions: ['Spray sulfur-based fungicide or potassium bicarbonate solution', 'Thin dense canopy branches'],
      preventative: ['Water at root level only during early morning']
    },
    {
      condition: 'Healthy Plant Foliage',
      category: 'Healthy',
      severity: 'None',
      symptoms: ['High chlorophyll content', 'Uniform cellular structure', 'Absence of pest feeding marks'],
      actions: ['Maintain current agronomic schedule'],
      preventative: ['Conduct weekly visual scouting']
    }
  ]
};

/**
 * Attempts to contact the Python AI microservice at http://127.0.0.1:5001/analyze
 */
function tryPythonAiMicroservice(imagePath, cropName) {
  return new Promise((resolve, reject) => {
    try {
      const postData = JSON.stringify({
        imagePath: path.resolve(imagePath),
        cropName
      });

      const options = {
        hostname: '127.0.0.1',
        port: 5001,
        path: '/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000 // 10s for deep learning model execution
      };

      const req = http.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(rawData);
              resolve(parsed);
            } else {
              reject(new Error(`Python service returned status ${res.statusCode}: ${rawData}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Python service request timed out after 10000ms'));
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Queries the Python AI microservice health & supported classes
 */
function getPythonAiMicroserviceClasses() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/classes',
      method: 'GET',
      timeout: 3000
    };
    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (c) => { rawData += c; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) resolve(JSON.parse(rawData));
          else reject(new Error(`Status ${res.statusCode}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

/**
 * Core image analysis processor:
 * Invokes the genuine Python MobileNetV2 deep learning microservice.
 * If the microservice is unreachable, returns an explicit offline notice
 * rather than fabricating false diagnoses or hardcoded confidence values.
 */
async function analyzeCropImage({ filePath, originalFilename, fileSize, mimeType, cropName = 'General' }) {
  try {
    const pythonResult = await tryPythonAiMicroservice(filePath, cropName);
    if (pythonResult && pythonResult.diagnosis) {
      return {
        ...pythonResult,
        analysisType: 'plantvillage_mobilenetv2_cnn',
        isDemonstrationResult: false,
        analyzedVia: 'Python MobileNetV2 Deep Learning Service (Port 5001)'
      };
    }
  } catch (pyErr) {
    console.warn(`[ImageAnalysis] Python microservice unavailable: ${pyErr.message}`);
  }

  // Transparent offline notice - do not fabricate fake diagnoses or fake confidence!
  return {
    analysisType: 'offline_notice',
    isDemonstrationResult: false,
    analyzedVia: 'AgriSense Fallback Dispatcher (Microservice Offline)',
    diagnosis: {
      primaryCondition: 'AI Microservice Offline — Prediction Unavailable',
      category: 'Inconclusive',
      confidenceScore: 0.0,
      confidencePercent: 0.0,
      isHealthy: null,
      severity: 'Uncertain',
      severityBasis: 'Microservice Offline',
      affectedAreaPercentage: 0.0,
      isInconclusive: true,
      uncertaintyWarning: 'The Python AI microservice (port 5001) is offline. Start the service by running "python app.py" in the ai-service folder to enable actual deep learning disease identification.',
      symptomsDetected: [
        'Image stored securely on server',
        'Deep learning inference pending service launch'
      ],
      recommendedActions: [
        'Start the Flask microservice: cd ai-service; python app.py',
        'Re-upload or re-analyze the leaf photograph once the microservice is active'
      ],
      preventativeMeasures: [
        'Ensure Python venv dependencies (PyTorch, Torchvision, Flask) are installed'
      ]
    },
    colorMetrics: {
      avgRed: 0,
      avgGreen: 0,
      avgBlue: 0,
      variIndex: 0,
      greenCoveragePercent: 0,
      yellowNecrosisPercent: 0
    },
    scientificDisclaimer: {
      sensorType: 'Standard Consumer Optical RGB Camera',
      isTrueMultispectral: false,
      disclaimerText:
        'Notice: Image-based leaf diagnostics require the active Python deep learning microservice. Field observation and agricultural extension verification remain standard practice.'
    }
  };
}

module.exports = {
  analyzeCropImage,
  getPythonAiMicroserviceClasses,
  CROP_SYMPTOM_DATABASE
};
