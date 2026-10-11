import React, { useState, useEffect } from 'react';
import {
  Bug,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Thermometer,
  CloudRain,
  Droplets,
  Layers,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { getPestRisk, simulatePestScenario } from '../services/api';
import './PestRisk.css';

export default function PestRisk({ selectedCrop, crops = [], showToast }) {
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scenario Simulator interactive state
  const [scenarioTemp, setScenarioTemp] = useState(26);
  const [scenarioHumidity, setScenarioHumidity] = useState(72);
  const [scenarioMoisture, setScenarioMoisture] = useState(55);
  const [scenarioPh, setScenarioPh] = useState(6.6);
  const [simulatedResult, setSimulatedResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchCurrentRisk = async () => {
    setIsLoading(true);
    try {
      const res = await getPestRisk({ cropName: selectedCrop !== 'All' ? selectedCrop : undefined });
      if (res.success) {
        setRiskData(res.data);
      }
    } catch (err) {
      showToast('Failed to load pest risk calculation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentRisk();
  }, [selectedCrop]);

  const handleRunScenario = async () => {
    setIsSimulating(true);
    try {
      const res = await simulatePestScenario({
        temperature: scenarioTemp,
        humidity: scenarioHumidity,
        soilMoisture: scenarioMoisture,
        soilPh: scenarioPh,
        cropName: selectedCrop !== 'All' ? selectedCrop : 'Wheat'
      });
      if (res.success) {
        setSimulatedResult(res.data);
        showToast('What-If Scenario Risk calculated!', 'info');
      }
    } catch (err) {
      showToast('Scenario simulation failed', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const activeResult = simulatedResult || riskData;

  return (
    <div className="pest-risk-page">
      {/* Page Header */}
      <div className="pest-header">
        <div>
          <h2>Agronomic Pest & Pathogen Risk Prediction</h2>
          <p className="page-subtitle">
            Microclimate-correlated disease-triangle modeling for early detection of fungal spores, insect vector surges, and foliar blight.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchCurrentRisk}>
          <RefreshCw size={16} />
          <span>Refresh Live Assessment</span>
        </button>
      </div>

      {/* Main Risk Status Hero Banner */}
      {activeResult && (
        <div className={`risk-hero-banner risk-level-${activeResult.level.toLowerCase()}`}>
          <div className="risk-hero-left">
            <div className="risk-level-tag">
              <Bug size={18} />
              <span>CURRENT PREDICTION RATING</span>
            </div>
            <h1 className="risk-level-title">{activeResult.level} RISK LEVEL</h1>
            <p className="risk-hero-desc">
              {activeResult.level === 'HIGH'
                ? 'Critical threshold crossed. Ambient microclimate heavily favors spore germination and rapid insect oviposition.'
                : activeResult.level === 'MEDIUM'
                ? 'Elevated pressure detected. Preventive scouting and bio-control measures are strongly advised.'
                : 'Favorable agronomic conditions. Temperature, moisture, and humidity are in safe physiological equilibrium.'}
            </p>
          </div>

          <div className="risk-gauge-box">
            <div className="gauge-number-wrap">
              <span className="gauge-score">{activeResult.riskScore}</span>
              <span className="gauge-total">/100</span>
            </div>
            <div className="gauge-bar-track">
              <div
                className="gauge-bar-fill"
                style={{
                  width: `${activeResult.riskScore}%`,
                  backgroundColor: activeResult.badgeColor || '#2d6a4f'
                }}
              />
            </div>
            <span className="gauge-caption">Agronomic Vulnerability Index</span>
          </div>
        </div>
      )}

      {/* Two-Column Layout: Identified Threats & Contributing Factors */}
      {activeResult && (
        <div className="risk-details-grid">
          {/* Identified Threats & Target Pests */}
          <div className="risk-card">
            <div className="risk-card-header">
              <ShieldAlert size={18} className="icon-red" />
              <h3>Identified Pest & Disease Vectors</h3>
            </div>

            <div className="threats-list">
              {activeResult.identifiedThreats?.map((threat, idx) => (
                <div key={idx} className="threat-item">
                  <div className="threat-item-top">
                    <span className="threat-name">{threat.name}</span>
                    <span className={`threat-prob prob-${threat.probability.toLowerCase()}`}>
                      {threat.probability} Probability
                    </span>
                  </div>
                  <span className="threat-type">{threat.type}</span>
                  <p className="threat-vector"><strong>Vector / Mechanism:</strong> {threat.vector}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contributing Microclimate Factors */}
          <div className="risk-card">
            <div className="risk-card-header">
              <AlertTriangle size={18} className="icon-amber" />
              <h3>Contributing Microclimate Factors</h3>
            </div>

            <div className="factors-list">
              {activeResult.contributingFactors?.map((f, idx) => (
                <div key={idx} className="factor-item">
                  <span className={`factor-severity-badge badge-${f.severity.toLowerCase()}`}>
                    {f.severity}
                  </span>
                  <div>
                    <strong className="factor-category">{f.category}:</strong>
                    <p className="factor-text">{f.factor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrated Pest Management (IPM) Action Plan */}
      {activeResult && (
        <div className="risk-card ipm-card">
          <div className="risk-card-header">
            <CheckCircle2 size={18} className="icon-green" />
            <h3>Integrated Pest Management (IPM) Protocols</h3>
          </div>

          <div className="ipm-steps-grid">
            {activeResult.ipmRecommendations?.map((rec, idx) => (
              <div key={idx} className="ipm-step-card">
                <div className="step-num-circle">{idx + 1}</div>
                <div className="step-content">
                  <span className="step-title">
                    {idx === 0 ? 'Cultural & Physical Controls' : idx === 1 ? 'Biological Intervention' : 'Chemical / Threshold Spray'}
                  </span>
                  <p className="step-desc">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive What-If Scenario Sandbox */}
      <div className="risk-card simulator-sandbox-card">
        <div className="risk-card-header">
          <Sliders size={18} className="icon-blue" />
          <div>
            <h3>What-If Agronomic Environmental Simulator</h3>
            <span className="section-subtitle">
              Adjust microclimate parameters to forecast pest risk before severe weather events occur
            </span>
          </div>
        </div>

        <div className="sandbox-controls-grid">
          {/* Temperature Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span><Thermometer size={14} /> Ambient Temp</span>
              <strong>{scenarioTemp}°C</strong>
            </div>
            <input
              type="range"
              min="10"
              max="42"
              value={scenarioTemp}
              onChange={(e) => setScenarioTemp(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>10°C (Cold)</span>
              <span>25°C (Mild)</span>
              <span>42°C (Heatwave)</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span><CloudRain size={14} /> Ambient Humidity</span>
              <strong>{scenarioHumidity}%</strong>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={scenarioHumidity}
              onChange={(e) => setScenarioHumidity(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>20% (Arid)</span>
              <span>60% (Normal)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* Moisture Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span><Droplets size={14} /> Soil Moisture</span>
              <strong>{scenarioMoisture}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={scenarioMoisture}
              onChange={(e) => setScenarioMoisture(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>10% (Drought)</span>
              <span>55% (Optimal)</span>
              <span>95% (Waterlogged)</span>
            </div>
          </div>

          {/* Soil pH Slider */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span><Layers size={14} /> Soil pH</span>
              <strong>{scenarioPh}</strong>
            </div>
            <input
              type="range"
              min="4.5"
              max="9.0"
              step="0.1"
              value={scenarioPh}
              onChange={(e) => setScenarioPh(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>4.5 (Acidic)</span>
              <span>6.8 (Neutral)</span>
              <span>9.0 (Alkaline)</span>
            </div>
          </div>
        </div>

        <div className="simulator-actions">
          <button
            className="btn-primary"
            onClick={handleRunScenario}
            disabled={isSimulating}
          >
            <Sparkles size={16} />
            <span>{isSimulating ? 'Evaluating...' : 'Simulate Scenario Risk'}</span>
          </button>

          {simulatedResult && (
            <button
              className="btn-secondary"
              onClick={() => setSimulatedResult(null)}
            >
              Reset to Live Telemetry
            </button>
          )}
        </div>
      </div>

      {/* Model Limitations Notice */}
      <div className="pest-disclaimer-card">
        <Info size={16} />
        <div>
          <strong>Agronomic Prediction Disclaimer & Scientific Limitations:</strong>
          <p>
            {activeResult?.limitations?.disclaimer ||
              'This risk index correlates local sensor microclimate readings with empirical pest development thresholds. Field inspection remains essential prior to chemical applications.'}
          </p>
        </div>
      </div>
    </div>
  );
}
