import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Sprout,
  Cpu,
  Save,
  PlusCircle,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Radio,
  FileCode,
  Layers,
  Database
} from 'lucide-react';
import { getSettings, updateSettings, getCrops, createCrop, deleteCrop, reseedDatabase } from '../services/api';
import './Settings.css';

export default function Settings({ showToast, onSettingsSaved }) {
  const [activeTab, setActiveTab] = useState('thresholds'); // thresholds | crops | esp32 | database
  const [settings, setSettings] = useState({
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
  const [crops, setCrops] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New crop modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [newCrop, setNewCrop] = useState({
    name: '',
    variety: 'Standard',
    fieldPlot: 'Plot 1',
    growthStage: 'Vegetative',
    areaHectares: 2.0,
    optimalRanges: {
      moistureMin: 45,
      moistureMax: 75,
      tempMin: 18,
      tempMax: 30,
      humidityMax: 75,
      phMin: 6.0,
      phMax: 7.2
    },
    commonPests: 'Aphids, Blight'
  });

  const fetchData = async () => {
    try {
      const [settRes, cropRes] = await Promise.all([getSettings(), getCrops()]);
      if (settRes.success) setSettings(settRes.data);
      if (cropRes.success) setCrops(cropRes.data);
    } catch (err) {
      showToast('Failed to load system settings', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateSettings(settings);
      if (res.success) {
        showToast('Threshold settings saved successfully!', 'success');
        if (onSettingsSaved) onSettingsSaved();
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    if (!newCrop.name || !newCrop.fieldPlot) {
      showToast('Crop name and field plot are required', 'error');
      return;
    }

    try {
      const payload = {
        ...newCrop,
        commonPests: typeof newCrop.commonPests === 'string'
          ? newCrop.commonPests.split(',').map((s) => s.trim()).filter(Boolean)
          : newCrop.commonPests
      };
      const res = await createCrop(payload);
      if (res.success) {
        showToast(`Crop ${newCrop.name} added!`, 'success');
        setShowCropModal(false);
        setNewCrop({
          name: '',
          variety: 'Standard',
          fieldPlot: 'Plot 1',
          growthStage: 'Vegetative',
          areaHectares: 2.0,
          optimalRanges: { moistureMin: 45, moistureMax: 75, tempMin: 18, tempMax: 30, humidityMax: 75, phMin: 6.0, phMax: 7.2 },
          commonPests: ''
        });
        fetchData();
        if (onSettingsSaved) onSettingsSaved();
      }
    } catch (err) {
      showToast('Failed to create crop', 'error');
    }
  };

  const handleDeleteCrop = async (id, name) => {
    if (!window.confirm(`Delete crop profile for ${name}?`)) return;
    try {
      const res = await deleteCrop(id);
      if (res.success) {
        showToast('Crop removed', 'info');
        fetchData();
        if (onSettingsSaved) onSettingsSaved();
      }
    } catch (err) {
      showToast('Failed to delete crop', 'error');
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(settings.deviceApiKey || '');
    setCopiedKey(true);
    showToast('ESP32 API Key copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset and re-seed database with realistic demonstration agronomic data?')) return;
    try {
      const res = await reseedDatabase();
      if (res.success) {
        showToast(res.message, 'success');
        fetchData();
        if (onSettingsSaved) onSettingsSaved();
      }
    } catch (err) {
      showToast('Failed to reseed database', 'error');
    }
  };

  const esp32SampleCode = `// AgriSense AI - ESP32 Telemetry Firmware
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverEndpoint = "http://YOUR_SERVER_IP:5000/api/sensors/ingest";
const char* apiKey = "${settings.deviceApiKey || 'agrisense_esp32_secret_key_2026'}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);

    // Read physical hardware sensors
    float soilMoisture = 58.4; // Capacitive Sensor on ADC Pin 34
    float soilTemp = 24.2;     // DS18B20 1-Wire Pin 4
    float ambientHum = 65.0;    // DHT22 Pin 15
    float soilPh = 6.8;        // Analog pH Sensor Pin 35

    StaticJsonDocument<256> doc;
    doc["deviceId"] = "ESP32_AGRI_NODE_01";
    doc["cropName"] = "Wheat";
    doc["fieldPlot"] = "Plot 1 North";
    doc["soilMoisture"] = soilMoisture;
    doc["soilTemperature"] = soilTemp;
    doc["ambientHumidity"] = ambientHum;
    doc["soilPh"] = soilPh;
    doc["batteryLevel"] = 94;

    String requestBody;
    serializeJson(doc, requestBody);
    int httpResponseCode = http.POST(requestBody);
    Serial.printf("HTTP Code: %d\\n", httpResponseCode);
    http.end();
  }
  delay(60000); // Sample every 60 seconds
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32SampleCode);
    setCopiedCode(true);
    showToast('ESP32 C++ Firmware copied to clipboard', 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h2>System Configuration & Hardware Integration</h2>
          <p className="page-subtitle">
            Configure agronomic threshold boundaries, crop varieties, ESP32 field gateway API keys, and demo modes.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <div className="settings-nav-card">
          <button
            className={`settings-tab-btn ${activeTab === 'thresholds' ? 'active' : ''}`}
            onClick={() => setActiveTab('thresholds')}
          >
            <Sliders size={18} />
            <span>Sensor Thresholds</span>
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'crops' ? 'active' : ''}`}
            onClick={() => setActiveTab('crops')}
          >
            <Sprout size={18} />
            <span>Crop Profiles ({crops.length})</span>
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'esp32' ? 'active' : ''}`}
            onClick={() => setActiveTab('esp32')}
          >
            <Cpu size={18} />
            <span>ESP32 Hardware & Code</span>
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <Database size={18} />
            <span>Demo Data & Re-Seed</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="settings-content-card">
          {/* TAB 1: Thresholds Form */}
          {activeTab === 'thresholds' && (
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="form-section-title">
                <h3>Agronomic Threshold Configuration</h3>
                <p>When telemetry measurements breach these limits, active warnings and notifications are generated automatically.</p>
              </div>

              <div className="settings-grid">
                <div className="form-group">
                  <label>Soil Moisture Min (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={settings.soilMoistureMin}
                    onChange={(e) => setSettings({ ...settings, soilMoistureMin: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Triggers water deficit warning (Default: 40%)</span>
                </div>

                <div className="form-group">
                  <label>Soil Moisture Max (%)</label>
                  <input
                    type="number"
                    min="65"
                    max="95"
                    value={settings.soilMoistureMax}
                    onChange={(e) => setSettings({ ...settings, soilMoistureMax: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Triggers root zone waterlogging warning (Default: 80%)</span>
                </div>

                <div className="form-group">
                  <label>Temperature Min (°C)</label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={settings.tempMin}
                    onChange={(e) => setSettings({ ...settings, tempMin: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Triggers cold/frost warning (Default: 15°C)</span>
                </div>

                <div className="form-group">
                  <label>Temperature Max (°C)</label>
                  <input
                    type="number"
                    min="25"
                    max="50"
                    value={settings.tempMax}
                    onChange={(e) => setSettings({ ...settings, tempMax: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Triggers heat stress warning (Default: 34°C)</span>
                </div>

                <div className="form-group">
                  <label>Ambient Humidity Max (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={settings.humidityMax}
                    onChange={(e) => setSettings({ ...settings, humidityMax: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Triggers fungal spore germination risk alert (Default: 80%)</span>
                </div>

                <div className="form-group">
                  <label>Pest Risk Sensitivity</label>
                  <select
                    value={settings.pestRiskSensitivity}
                    onChange={(e) => setSettings({ ...settings, pestRiskSensitivity: e.target.value })}
                  >
                    <option value="conservative">Conservative (Fewer Alerts)</option>
                    <option value="standard">Standard (Recommended)</option>
                    <option value="sensitive">Sensitive (Early Warning)</option>
                  </select>
                  <span className="field-hint">Adjusts disease-triangle risk algorithm multiplier</span>
                </div>

                <div className="form-group">
                  <label>Soil pH Target Min</label>
                  <input
                    type="number"
                    min="4.0"
                    max="7.0"
                    step="0.1"
                    value={settings.phMin}
                    onChange={(e) => setSettings({ ...settings, phMin: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Acid threshold (Default: 5.8)</span>
                </div>

                <div className="form-group">
                  <label>Soil pH Target Max</label>
                  <input
                    type="number"
                    min="7.0"
                    max="9.0"
                    step="0.1"
                    value={settings.phMax}
                    onChange={(e) => setSettings({ ...settings, phMax: Number(e.target.value) })}
                    required
                  />
                  <span className="field-hint">Alkaline threshold (Default: 7.5)</span>
                </div>
              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Threshold Settings'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Crops Manager */}
          {activeTab === 'crops' && (
            <div className="crops-manager">
              <div className="manager-header">
                <div>
                  <h3>Monitored Crop Varieties & Plots</h3>
                  <p>Define fields, growth stages, and optimal environmental tolerances for each crop.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCropModal(true)}>
                  <PlusCircle size={16} />
                  <span>Add New Crop</span>
                </button>
              </div>

              <div className="crops-table-wrap">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Crop Name</th>
                      <th>Variety</th>
                      <th>Plot</th>
                      <th>Growth Stage</th>
                      <th>Area (Ha)</th>
                      <th>Optimal Moisture</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crops.map((c) => (
                      <tr key={c._id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.variety}</td>
                        <td>{c.fieldPlot}</td>
                        <td>
                          <span className="badge badge-info">{c.growthStage}</span>
                        </td>
                        <td>{c.areaHectares || 1.0}</td>
                        <td>{c.optimalRanges?.moistureMin}% - {c.optimalRanges?.moistureMax}%</td>
                        <td>
                          <button
                            className="btn-table-delete"
                            onClick={() => handleDeleteCrop(c._id, c.name)}
                            title="Delete Crop"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ESP32 Hardware Integration */}
          {activeTab === 'esp32' && (
            <div className="esp32-manager">
              <div className="manager-header">
                <div>
                  <h3>ESP32 Microcontroller Hardware Gateway</h3>
                  <p>Prepare field sensor telemetry ingestion using HTTP REST client over WiFi or cellular IoT.</p>
                </div>
              </div>

              {/* Endpoint & Key Info Box */}
              <div className="integration-box">
                <div className="integration-item">
                  <span className="int-label">REST API Ingestion URL:</span>
                  <div className="int-val-row">
                    <code>POST http://YOUR_SERVER_IP:5000/api/sensors/ingest</code>
                  </div>
                </div>

                <div className="integration-item">
                  <span className="int-label">Hardware Authorization API Key:</span>
                  <div className="int-val-row">
                    <code>{settings.deviceApiKey}</code>
                    <button className="btn-copy" onClick={handleCopyKey}>
                      {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                </div>

                <div className="integration-item">
                  <span className="int-label">Required HTTP Header:</span>
                  <div className="int-val-row">
                    <code>x-api-key: {settings.deviceApiKey}</code>
                  </div>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="code-snippet-box">
                <div className="code-header">
                  <div className="code-title">
                    <FileCode size={16} />
                    <span>Arduino C++ Firmware Template (ESP32)</span>
                  </div>
                  <button className="btn-copy-code" onClick={handleCopyCode}>
                    {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="code-display">
                  <code>{esp32SampleCode}</code>
                </pre>
              </div>

              {/* Wiring Pinout Instructions */}
              <div className="wiring-guide-card">
                <h4>Recommended Physical Sensor Pinout:</h4>
                <div className="wiring-grid">
                  <div className="wire-item">
                    <strong>Capacitive Soil Moisture v1.2:</strong>
                    <span>VCC: 3.3V | GND: GND | AOUT: GPIO 34 (ADC1_CH6)</span>
                  </div>
                  <div className="wire-item">
                    <strong>DHT22 / BME280 (Temp & Humidity):</strong>
                    <span>VCC: 3.3V | GND: GND | DATA: GPIO 15 (Pullup 4.7kΩ)</span>
                  </div>
                  <div className="wire-item">
                    <strong>Analog Soil pH Probe v1.1:</strong>
                    <span>VCC: 5.0V | GND: GND | PO: GPIO 35 (ADC1_CH7)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Demo Data & Reset */}
          {activeTab === 'database' && (
            <div className="database-manager">
              <div className="manager-header">
                <div>
                  <h3>Demonstration Data & Database Re-Seed</h3>
                  <p>Reset MongoDB collections and restore clean, realistic agronomic demo data anytime.</p>
                </div>
              </div>

              <div className="reseed-info-card">
                <AlertTriangle size={24} color="#d97706" />
                <div>
                  <h4>Database Re-Seed Action</h4>
                  <p>
                    This will clear current readings and alerts, and repopulate 5 standard crops (Wheat, Tomato, Maize, Cotton, Rice),
                    36 diurnal hourly telemetry readings, realistic threshold alerts, and sample leaf imaging diagnostics with scientific disclaimers.
                  </p>
                  <button className="btn-primary btn-reseed" onClick={handleReseed}>
                    <RefreshCw size={16} />
                    <span>Execute Full Database Reset & Re-Seed</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Crop Modal */}
      {showCropModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Register New Crop Profile</h3>
              <button className="btn-modal-close" onClick={() => setShowCropModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCrop} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Crop Common Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Soybean, Sugarcane"
                    value={newCrop.name}
                    onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cultivar / Variety</label>
                  <input
                    type="text"
                    placeholder="e.g. JS-335"
                    value={newCrop.variety}
                    onChange={(e) => setNewCrop({ ...newCrop, variety: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Field Plot Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 5 East"
                    value={newCrop.fieldPlot}
                    onChange={(e) => setNewCrop({ ...newCrop, fieldPlot: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Growth Stage</label>
                  <select
                    value={newCrop.growthStage}
                    onChange={(e) => setNewCrop({ ...newCrop, growthStage: e.target.value })}
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Optimal Moisture Min (%)</label>
                  <input
                    type="number"
                    value={newCrop.optimalRanges.moistureMin}
                    onChange={(e) => setNewCrop({
                      ...newCrop,
                      optimalRanges: { ...newCrop.optimalRanges, moistureMin: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Optimal Moisture Max (%)</label>
                  <input
                    type="number"
                    value={newCrop.optimalRanges.moistureMax}
                    onChange={(e) => setNewCrop({
                      ...newCrop,
                      optimalRanges: { ...newCrop.optimalRanges, moistureMax: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Common Pests (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Stem Fly, Defoliator, Rust"
                  value={newCrop.commonPests}
                  onChange={(e) => setNewCrop({ ...newCrop, commonPests: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCropModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
