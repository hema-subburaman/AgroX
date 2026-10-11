import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Thermometer,
  CloudRain,
  FlaskConical,
  PlusCircle,
  PlayCircle,
  Filter,
  RefreshCw,
  Cpu,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { getReadings, createReading, simulateSensorReading } from '../services/api';
import './SoilMonitoring.css';

export default function SoilMonitoring({
  crops = [],
  selectedCrop,
  onReadingAdded,
  showToast
}) {
  const [readings, setReadings] = useState([]);
  const [timeframe, setTimeframe] = useState('24h');
  const [filterCrop, setFilterCrop] = useState(selectedCrop || 'All');
  const [activeTab, setActiveTab] = useState('moisture');
  const [isLoading, setIsLoading] = useState(true);

  // Manual reading modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    cropName: 'Wheat',
    fieldPlot: 'Plot 1 North',
    soilMoisture: 55,
    soilTemperature: 24,
    ambientHumidity: 65,
    soilPh: 6.8
  });

  const fetchReadingsData = async () => {
    setIsLoading(true);
    try {
      const res = await getReadings({
        timeframe,
        cropName: filterCrop !== 'All' ? filterCrop : undefined,
        limit: 100
      });
      if (res.success) {
        setReadings(res.data || []);
      }
    } catch (err) {
      showToast('Failed to load soil telemetry data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadingsData();
  }, [timeframe, filterCrop]);

  const latest = readings[0] || {
    soilMoisture: 55,
    soilTemperature: 23,
    ambientHumidity: 64,
    soilPh: 6.8,
    batteryLevel: 95,
    isSimulated: true,
    dataSource: 'demo_simulation'
  };

  // Recharts data formatted chronologically
  const chartData = [...readings].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    moisture: r.soilMoisture,
    temp: r.soilTemperature,
    humidity: r.ambientHumidity,
    ph: r.soilPh,
    isSimulated: r.isSimulated
  }));

  // Handle simulation scenario
  const handleScenarioSimulate = async (scenario) => {
    try {
      const res = await simulateSensorReading({
        cropName: filterCrop !== 'All' ? filterCrop : 'Wheat',
        scenario
      });
      if (res.success) {
        showToast(`Simulated telemetry injected: ${scenario.replace('_', ' ')}`, 'info');
        fetchReadingsData();
        if (onReadingAdded) onReadingAdded();
      }
    } catch (err) {
      showToast('Failed to generate simulation reading', 'error');
    }
  };

  // Handle manual reading submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createReading(manualForm);
      if (res.success) {
        showToast('Manual field sample reading recorded!', 'success');
        setShowManualModal(false);
        fetchReadingsData();
        if (onReadingAdded) onReadingAdded();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error recording reading', 'error');
    }
  };

  return (
    <div className="soil-monitoring-page">
      {/* Top Header & Quick Actions */}
      <div className="soil-header">
        <div>
          <h2>Soil Telemetry & Root Microclimate</h2>
          <p className="page-subtitle">
            Real-time volumetric water content (VWC), thermal dynamics, relative humidity, and chemical pH levels.
          </p>
        </div>

        <div className="soil-header-actions">
          <button className="btn-secondary" onClick={() => setShowManualModal(true)}>
            <PlusCircle size={16} />
            <span>Log Manual Probe</span>
          </button>
          <button className="btn-primary" onClick={() => handleScenarioSimulate('optimal')}>
            <PlayCircle size={16} />
            <span>Simulate Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="soil-kpi-grid">
        <MetricCard
          title="Soil Moisture (VWC)"
          value={`${latest.soilMoisture}%`}
          icon={Droplets}
          status={latest.soilMoisture < 40 ? 'warning' : latest.soilMoisture > 80 ? 'critical' : 'optimal'}
          statusText={latest.soilMoisture < 40 ? 'Deficit' : latest.soilMoisture > 80 ? 'Saturated' : 'Optimal'}
          targetRange="45% – 75%"
          colorTheme="blue"
          footerNote={latest.isSimulated ? 'Source: Simulation Demo' : 'Source: ESP32 Hardware Probe'}
        />

        <MetricCard
          title="Root Zone Temp"
          value={`${latest.soilTemperature}°C`}
          icon={Thermometer}
          status={latest.soilTemperature > 32 ? 'warning' : 'optimal'}
          statusText={latest.soilTemperature > 32 ? 'High Heat' : 'Healthy Range'}
          targetRange="18°C – 28°C"
          colorTheme="amber"
          footerNote="Microbial activity optimum"
        />

        <MetricCard
          title="Ambient Humidity"
          value={`${latest.ambientHumidity}%`}
          icon={CloudRain}
          status={latest.ambientHumidity > 80 ? 'warning' : 'optimal'}
          statusText={latest.ambientHumidity > 80 ? 'Spore Risk' : 'Balanced'}
          targetRange="50% – 75%"
          colorTheme="green"
          footerNote="Transpiration equilibrium"
        />

        <MetricCard
          title="Soil pH Level"
          value={latest.soilPh ? `${latest.soilPh}` : '6.8'}
          icon={FlaskConical}
          status={latest.soilPh < 5.8 || latest.soilPh > 7.5 ? 'warning' : 'optimal'}
          statusText={latest.soilPh < 5.8 ? 'Acidic' : latest.soilPh > 7.5 ? 'Alkaline' : 'Near Neutral'}
          targetRange="6.0 – 7.2"
          colorTheme="purple"
          footerNote="Macronutrient availability: High"
        />
      </div>

      {/* Scenario Sandbox Bar */}
      <div className="scenario-sandbox-banner">
        <div className="sandbox-info">
          <Radio size={16} color="#d97706" />
          <span>
            <strong>Simulation Telemetry Sandbox:</strong> Trigger representative environmental stress conditions to test live threshold responses.
          </span>
        </div>
        <div className="sandbox-buttons">
          <button className="btn-scenario" onClick={() => handleScenarioSimulate('optimal')}>
            Standard Normal
          </button>
          <button className="btn-scenario dry" onClick={() => handleScenarioSimulate('dry_stress')}>
            Moisture Deficit (24%)
          </button>
          <button className="btn-scenario wet" onClick={() => handleScenarioSimulate('waterlogged')}>
            Waterlogging (89%)
          </button>
          <button className="btn-scenario spore" onClick={() => handleScenarioSimulate('high_fungal_risk')}>
            High Humidity Spores (88%)
          </button>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="soil-chart-container">
        <div className="chart-controls-bar">
          <div className="chart-tabs">
            <button
              className={`tab-btn ${activeTab === 'moisture' ? 'active' : ''}`}
              onClick={() => setActiveTab('moisture')}
            >
              Soil Moisture %
            </button>
            <button
              className={`tab-btn ${activeTab === 'temp_humidity' ? 'active' : ''}`}
              onClick={() => setActiveTab('temp_humidity')}
            >
              Temp & Humidity
            </button>
            <button
              className={`tab-btn ${activeTab === 'ph' ? 'active' : ''}`}
              onClick={() => setActiveTab('ph')}
            >
              Soil pH Fluctuation
            </button>
          </div>

          <div className="chart-filters">
            {/* Crop Filter */}
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Crops</option>
              {crops.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Timeframe Filter */}
            <div className="timeframe-buttons">
              <button
                className={`tf-btn ${timeframe === '24h' ? 'active' : ''}`}
                onClick={() => setTimeframe('24h')}
              >
                24H
              </button>
              <button
                className={`tf-btn ${timeframe === '7d' ? 'active' : ''}`}
                onClick={() => setTimeframe('7d')}
              >
                7D
              </button>
              <button
                className={`tf-btn ${timeframe === '30d' ? 'active' : ''}`}
                onClick={() => setTimeframe('30d')}
              >
                30D
              </button>
            </div>

            <button className="btn-icon" onClick={fetchReadingsData} title="Refresh Data">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Tab 1: Soil Moisture Curve */}
        {activeTab === 'moisture' && (
          <div className="chart-canvas-box">
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData} margin={{ top: 15, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
                <Tooltip />
                <Legend />
                <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Min Threshold (40%)', fill: '#f59e0b', fontSize: 11 }} />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max Threshold (80%)', fill: '#ef4444', fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="moisture"
                  name="Volumetric Soil Moisture (%)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#moistureGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 2: Temperature & Humidity */}
        {activeTab === 'temp_humidity' && (
          <div className="chart-canvas-box">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 15, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#f59e0b" fontSize={12} unit="°C" domain={[10, 45]} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} unit="%" domain={[20, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  name="Soil Temp (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  name="Ambient Humidity (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 3: Soil pH */}
        {activeTab === 'ph' && (
          <div className="chart-canvas-box">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 15, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis domain={[5.0, 8.5]} stroke="#8b5cf6" fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={6.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Min (6.0)', fill: '#10b981', fontSize: 11 }} />
                <ReferenceLine y={7.2} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Max (7.2)', fill: '#10b981', fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="ph"
                  name="Soil pH"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Telemetry Log Table */}
      <div className="readings-table-card">
        <div className="table-header-row">
          <div>
            <h3>Telemetry Reading Records</h3>
            <span className="section-subtitle">Displaying recent {readings.length} records</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Crop / Plot</th>
                <th>Soil Moisture</th>
                <th>Soil Temp</th>
                <th>Humidity</th>
                <th>Soil pH</th>
                <th>Data Source (Transparency)</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>
                    <strong>{r.cropName}</strong> <span className="sub-plot">({r.fieldPlot})</span>
                  </td>
                  <td>
                    <span className={r.soilMoisture < 40 ? 'val-warn' : r.soilMoisture > 80 ? 'val-crit' : 'val-ok'}>
                      {r.soilMoisture}%
                    </span>
                  </td>
                  <td>{r.soilTemperature}°C</td>
                  <td>{r.ambientHumidity}%</td>
                  <td>{r.soilPh || '6.8'}</td>
                  <td>
                    <span className={`badge ${r.dataSource === 'physical_esp32' ? 'badge-success' : r.dataSource === 'manual_entry' ? 'badge-info' : 'badge-warning'}`}>
                      {r.dataSource === 'physical_esp32'
                        ? 'ESP32 Hardware'
                        : r.dataSource === 'manual_entry'
                        ? 'Manual Log'
                        : 'Simulated Demo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Log Physical Soil Probe Sample</h3>
              <button className="btn-modal-close" onClick={() => setShowManualModal(false)}>✕</button>
            </div>
            <form onSubmit={handleManualSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Crop / Target Field</label>
                  <select
                    value={manualForm.cropName}
                    onChange={(e) => setManualForm({ ...manualForm, cropName: e.target.value })}
                  >
                    {crops.map((c) => (
                      <option key={c._id || c.name} value={c.name}>{c.name} ({c.fieldPlot})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Plot Identifier</label>
                  <input
                    type="text"
                    value={manualForm.fieldPlot}
                    onChange={(e) => setManualForm({ ...manualForm, fieldPlot: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Soil Moisture (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={manualForm.soilMoisture}
                    onChange={(e) => setManualForm({ ...manualForm, soilMoisture: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Soil Temp (°C)</label>
                  <input
                    type="number"
                    min="-10"
                    max="60"
                    step="0.1"
                    value={manualForm.soilTemperature}
                    onChange={(e) => setManualForm({ ...manualForm, soilTemperature: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ambient Humidity (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={manualForm.ambientHumidity}
                    onChange={(e) => setManualForm({ ...manualForm, ambientHumidity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Soil pH</label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    step="0.05"
                    value={manualForm.soilPh}
                    onChange={(e) => setManualForm({ ...manualForm, soilPh: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowManualModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
