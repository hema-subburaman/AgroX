/**
 * AgriSense AI - Agronomic Pest & Pathogen Risk Prediction Engine
 *
 * Evaluates real-time microclimate parameters (ambient humidity, ambient/soil temperature,
 * soil moisture, soil pH, and crop profile) using validated agronomic disease-triangle models.
 */

function calculatePestRisk({
  temperature = 25,
  humidity = 60,
  soilMoisture = 55,
  soilPh = 6.5,
  cropName = 'Wheat',
  growthStage = 'Vegetative',
  sensitivity = 'standard'
}) {
  let riskScore = 15; // baseline environmental risk
  const contributingFactors = [];
  const identifiedThreats = [];
  const ipmRecommendations = [];

  // Sensitivity multiplier
  const multiplier = sensitivity === 'sensitive' ? 1.25 : sensitivity === 'conservative' ? 0.8 : 1.0;

  // 1. FUNGAL PATHOGEN PRESSURE (Disease Triangle: Host + Pathogen + Wet Warm Microclimate)
  if (humidity >= 80 && temperature >= 18 && temperature <= 28) {
    riskScore += 35 * multiplier;
    contributingFactors.push({
      category: 'Fungal Risk',
      factor: `Sustained high humidity (${humidity}%) paired with moderate temperatures (${temperature}°C) creates ideal spore germination conditions.`,
      severity: 'HIGH'
    });
    identifiedThreats.push({
      name: 'Powdery Mildew & Leaf Rust',
      type: 'Fungal Pathogen',
      probability: 'High',
      vector: 'Airborne spores / Prolonged leaf wetness'
    });
    ipmRecommendations.push('Ensure canopy aeration by thinning dense foliage.');
    ipmRecommendations.push('Schedule preventive organic bio-fungicide (e.g., Bacillus subtilis or copper hydroxide spray).');
  } else if (humidity >= 68 && temperature >= 20 && temperature <= 30) {
    riskScore += 18 * multiplier;
    contributingFactors.push({
      category: 'Fungal Risk',
      factor: `Elevated humidity (${humidity}%) mildly favors blight and fungal foliar spots.`,
      severity: 'MEDIUM'
    });
    identifiedThreats.push({
      name: 'Early Blight (Alternaria spp.)',
      type: 'Fungal Pathogen',
      probability: 'Moderate',
      vector: 'Soil-splashing and high night humidity'
    });
  }

  // 2. INSECT & SAP-FEEDING PEST PRESSURE (Aphids, Spider Mites, Thrips thrive in warm, drier conditions)
  if (temperature >= 28 && soilMoisture <= 40) {
    riskScore += 28 * multiplier;
    contributingFactors.push({
      category: 'Insect Vector Risk',
      factor: `High thermal environment (${temperature}°C) and water stress (Soil Moisture ${soilMoisture}%) accelerate aphid and spider mite breeding cycles.`,
      severity: 'HIGH'
    });
    identifiedThreats.push({
      name: 'Aphids & Two-Spotted Spider Mites',
      type: 'Sap-feeding Arthropods',
      probability: 'High',
      vector: 'Heat-accelerated reproduction on water-stressed plants'
    });
    ipmRecommendations.push('Increase irrigation to relieve moisture stress and reduce plant vulnerability.');
    ipmRecommendations.push('Deploy yellow sticky traps and release natural predators (e.g. Ladybird beetles, Chrysoperla).');
  } else if (temperature >= 26) {
    riskScore += 12 * multiplier;
    contributingFactors.push({
      category: 'Pest Activity',
      factor: `Warm temperatures (${temperature}°C) promote elevated insect metabolic and feeding rates.`,
      severity: 'MEDIUM'
    });
    identifiedThreats.push({
      name: 'Whiteflies & Leafhoppers',
      type: 'Insect Vector',
      probability: 'Medium',
      vector: 'Warm ambient conditions'
    });
  }

  // 3. ROOT & SOIL HEALTH (Excessive waterlogging / Anaerobic conditions)
  if (soilMoisture >= 85) {
    riskScore += 22 * multiplier;
    contributingFactors.push({
      category: 'Root Rot / Pythium Risk',
      factor: `Near-saturated soil moisture (${soilMoisture}%) leads to oxygen depletion around root zones, triggering damping-off.`,
      severity: 'HIGH'
    });
    identifiedThreats.push({
      name: 'Damping-Off & Root Rot (Pythium / Rhizoctonia)',
      type: 'Oomycete / Soil Pathogen',
      probability: 'High',
      vector: 'Prolonged soil saturation & anaerobic root stress'
    });
    ipmRecommendations.push('Halt irrigation immediately and improve field drainage trenches.');
  }

  // 4. SOIL pH CHEMICAL STRESS
  if (soilPh < 5.8) {
    riskScore += 10 * multiplier;
    contributingFactors.push({
      category: 'Soil Acidity Stress',
      factor: `Sub-optimal soil pH (${soilPh}) restricts phosphorus and calcium uptake, weakening plant cellular walls.`,
      severity: 'MEDIUM'
    });
  } else if (soilPh > 7.8) {
    riskScore += 10 * multiplier;
    contributingFactors.push({
      category: 'Soil Alkalinity Stress',
      factor: `Alkaline soil pH (${soilPh}) induces iron and micronutrient chlorosis.`,
      severity: 'MEDIUM'
    });
  }

  // 5. CROP PHENOLOGY VULNERABILITY
  if (growthStage === 'Flowering' || growthStage === 'Fruiting') {
    riskScore += 8;
    contributingFactors.push({
      category: 'Crop Phenology',
      factor: `${growthStage} stage exhibits highest biomass vulnerability to flower drop and thrips damage.`,
      severity: 'MEDIUM'
    });
  }

  // Clamp risk score between 5 and 98
  riskScore = Math.min(Math.max(Math.round(riskScore), 5), 98);

  // Determine Level
  let level = 'LOW';
  let badgeColor = '#2d6a4f'; // green
  if (riskScore >= 65) {
    level = 'HIGH';
    badgeColor = '#d90429'; // red
  } else if (riskScore >= 35) {
    level = 'MEDIUM';
    badgeColor = '#e76f51'; // amber/orange
  }

  // Fallback defaults if no threats triggered
  if (identifiedThreats.length === 0) {
    identifiedThreats.push({
      name: 'Beneficial Ecosystem / Low Pressure',
      type: 'General Ecology',
      probability: 'Low',
      vector: 'Balanced temperature and moisture regime'
    });
    contributingFactors.push({
      category: 'Optimal Climate',
      factor: `Ambient temperature (${temperature}°C) and moisture (${soilMoisture}%) are in safe agronomic equilibrium.`,
      severity: 'LOW'
    });
  }

  if (ipmRecommendations.length === 0) {
    ipmRecommendations.push('Maintain regular scouting twice weekly along field diagonals.');
    ipmRecommendations.push('Conserve beneficial insect predators (predatory mites, parasitoid wasps).');
    ipmRecommendations.push('Maintain consistent drip irrigation cycles according to crop evapo-transpiration.');
  }

  return {
    riskScore,
    level,
    badgeColor,
    inputParameters: {
      temperature,
      humidity,
      soilMoisture,
      soilPh,
      cropName,
      growthStage
    },
    identifiedThreats,
    contributingFactors,
    ipmRecommendations,
    limitations: {
      basis: 'Agronomic Disease-Triangle & Microclimate Correlation Model',
      disclaimer:
        'Prediction Disclaimer: This risk index correlates local sensor microclimate readings with empirical pest development thresholds. Local micro-topography, wind corridors, and undetected initial spore inocula may alter actual field incidence. Physical field inspection remains essential.'
    }
  };
}

module.exports = { calculatePestRisk };
