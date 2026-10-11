import React from 'react';
import {
  Droplets,
  Thermometer,
  CloudRain,
  Bug,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Camera,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import MetricCard from '../components/MetricCard';
import ScientificNotice from '../components/ScientificNotice';
import './Dashboard.css';

export default function Dashboard({
  dashboardData,
  onNavigate,
  onAcknowledgeAlert,
  onSimulateReading,
  onReseedData
}) {
  if (!dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading real-time agricultural telemetry...</p>
      </div>
    );
  }

  const { summary = {}, chartData = [], recentAlerts = [], crops = [], recentAnalyses = [], currentRisk = {} } = dashboardData;
  const latest = summary.latestReading || {};
  const sensorMode = summary.sensorMode || {};

  // Format chart data for Recharts
  const formattedChartData = (chartData || []).map((item) => {
    const d = new Date(item.timestamp);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      soilMoisture: item.soilMoisture,
      soilTemperature: item.soilTemperature,
      ambientHumidity: item.ambientHumidity,
      soilPh: item.soilPh
    };
  });

  // Calculate Moisture status
  const moistureVal = latest.soilMoisture || 0;
  let moistureStatus = 'optimal';
  let moistureText = 'Optimal Range';
  if (moistureVal < 40) {
    moistureStatus = 'warning';
    moistureText = 'Water Deficit';
  } else if (moistureVal > 80) {
    moistureStatus = 'critical';
    moistureText = 'Waterlogged';
  }

  // Calculate Temp status
  const tempVal = latest.soilTemperature || 0;
  let tempStatus = 'optimal';
  let tempText = 'Normal';
  if (tempVal > 32) {
    tempStatus = 'warning';
    tempText = 'Heat Stress';
  } else if (tempVal < 14) {
    tempStatus = 'info';
    tempText = 'Cool Climate';
  }

  // Pest risk level
  const riskLevel = currentRisk.level || 'LOW';
  const riskStatus = riskLevel === 'HIGH' ? 'critical' : riskLevel === 'MEDIUM' ? 'warning' : 'optimal';

  return (
    <div className="dashboard-page">
      {/* Top Welcome & System Status Bar */}
      <div className="dashboard-header-banner">
        <div className="banner-text">
          <div className="banner-title-row">
            <h1>Field Telemetry & Crop Health Command</h1>
            <span className={`mode-badge ${sensorMode.isSimulated ? 'mode-demo' : 'mode-live'}`}>
              <Cpu size={14} />
              {sensorMode.isSimulated ? 'DEMO SIMULATOR ACTIVE' : 'ESP32 HARDWARE CONNECTED'}
            </span>
          </div>
          <p className="banner-subtitle">
            Continuous precision monitoring of root zone microclimate, foliar pathology, and agronomic risk thresholds.
          </p>
        </div>

        <div className="banner-actions">
          <button className="btn-banner-action" onClick={onSimulateReading}>
            <Sparkles size={16} />
            <span>Generate Telemetry</span>
          </button>
          <button className="btn-banner-action secondary" onClick={() => onNavigate('imaging-analysis')}>
            <Camera size={16} />
            <span>Upload Leaf Photo</span>
          </button>
        </div>
      </div>

      {/* Scientific Notice regarding RGB Camera limitations */}
      <ScientificNotice compact={true} />

      {/* Key Agronomic KPI Metric Cards */}
      <div className="metric-cards-grid">
        <MetricCard
          title="Soil Moisture"
          value={latest.soilMoisture !== undefined ? `${latest.soilMoisture}%` : '--'}
          icon={Droplets}
          status={moistureStatus}
          statusText={moistureText}
          targetRange="45% – 75%"
          colorTheme="blue"
          footerNote={latest.isSimulated ? 'Data source: Simulated telemetry' : 'Data source: ESP32 soil probe'}
        />

        <MetricCard
          title="Soil / Ambient Temp"
          value={latest.soilTemperature !== undefined ? `${latest.soilTemperature}°C` : '--'}
          icon={Thermometer}
          status={tempStatus}
          statusText={tempText}
          targetRange="18°C – 28°C"
          colorTheme="amber"
          footerNote={`Root zone thermal equilibrium: Normal`}
        />

        <MetricCard
          title="Ambient Humidity"
          value={latest.ambientHumidity !== undefined ? `${latest.ambientHumidity}%` : '--'}
          icon={CloudRain}
          status={latest.ambientHumidity > 80 ? 'warning' : 'optimal'}
          statusText={latest.ambientHumidity > 80 ? 'High Spore Risk' : 'Optimal'}
          targetRange="50% – 75%"
          colorTheme="green"
          footerNote="Microclimate foliar wetness proxy"
        />

        <MetricCard
          title="Agronomic Pest Risk"
          value={currentRisk.riskScore !== undefined ? `${currentRisk.riskScore}/100` : '--'}
          icon={Bug}
          status={riskStatus}
          statusText={`${riskLevel} RISK`}
          targetRange="Score < 35"
          colorTheme={riskLevel === 'HIGH' ? 'red' : riskLevel === 'MEDIUM' ? 'amber' : 'green'}
          footerNote={
            currentRisk.identifiedThreats && currentRisk.identifiedThreats[0]
              ? `Watch: ${currentRisk.identifiedThreats[0].name}`
              : 'Favorable growing conditions'
          }
        />
      </div>

      {/* Middle Section: Live Microclimate Telemetry Chart */}
      <div className="dashboard-section-card chart-section">
        <div className="section-card-header">
          <div className="header-left">
            <TrendingUp size={20} className="header-icon" />
            <div>
              <h3>Continuous Microclimate & Root Zone Trends</h3>
              <span className="section-subtitle">24-hour diurnal sensor readings (Moisture %, Temp °C, Humidity %)</span>
            </div>
          </div>
          <button className="btn-link" onClick={() => onNavigate('soil-monitoring')}>
            View Detailed Analysis <ArrowRight size={15} />
          </button>
        </div>

        <div className="chart-wrapper">
          {formattedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={formattedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="soilMoisture"
                  name="Soil Moisture (%)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMoisture)"
                />
                <Area
                  type="monotone"
                  dataKey="ambientHumidity"
                  name="Ambient Humidity (%)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHumidity)"
                />
                <Area
                  type="monotone"
                  dataKey="soilTemperature"
                  name="Temperature (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-placeholder">
              <Activity size={32} />
              <p>No historical telemetry available yet. Click "Generate Telemetry" above to simulate data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Lower Grid: Active Alerts & Active Crops Overview */}
      <div className="dashboard-grid-two">
        {/* Active Threshold Alerts */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-left">
              <AlertTriangle size={18} className="header-icon amber" />
              <div>
                <h3>Active Threshold Alerts</h3>
                <span className="section-subtitle">{summary.activeAlertsCount || 0} alerts requiring review</span>
              </div>
            </div>
            <button className="btn-link" onClick={() => onNavigate('alerts')}>
              Manage All <ArrowRight size={14} />
            </button>
          </div>

          <div className="alerts-list">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div key={alert._id} className={`alert-item-card severity-${alert.severity}`}>
                  <div className="alert-meta">
                    <span className={`alert-badge-tag badge-${alert.severity}`}>{alert.severity}</span>
                    <span className="alert-time">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="alert-crop-tag">{alert.cropName}</span>
                  </div>
                  <h4 className="alert-item-title">{alert.title}</h4>
                  <p className="alert-item-msg">{alert.message}</p>
                  <div className="alert-actions-row">
                    <span className="alert-metric-tag">
                      Detected: <strong>{alert.valueDetected}</strong> ({alert.thresholdViolated})
                    </span>
                    <button
                      className="btn-ack"
                      onClick={() => onAcknowledgeAlert(alert._id)}
                      title="Acknowledge alert"
                    >
                      <CheckCircle2 size={14} />
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="all-clear-box">
                <CheckCircle2 size={32} color="#10b981" />
                <p>All microclimate parameters are within configured safe bounds.</p>
                <span>Zero active threshold alerts detected.</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Crops & Field Plots */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div className="header-left">
              <Layers size={18} className="header-icon green" />
              <div>
                <h3>Farm Plots & Monitored Crops</h3>
                <span className="section-subtitle">{crops.length} crops under observation</span>
              </div>
            </div>
            <button className="btn-link" onClick={() => onNavigate('crop-health')}>
              Inspect Crops <ArrowRight size={14} />
            </button>
          </div>

          <div className="crops-overview-list">
            {crops.map((crop) => (
              <div key={crop._id} className="crop-summary-card">
                <div className="crop-top">
                  <div>
                    <h4 className="crop-name">{crop.name}</h4>
                    <span className="crop-variety">{crop.variety} • {crop.fieldPlot}</span>
                  </div>
                  <span className={`badge ${crop.status === 'Healthy' ? 'badge-success' : crop.status === 'Monitoring' ? 'badge-warning' : 'badge-danger'}`}>
                    {crop.status}
                  </span>
                </div>

                <div className="crop-details-row">
                  <span className="crop-detail-pill">Stage: {crop.growthStage}</span>
                  <span className="crop-detail-pill">Area: {crop.areaHectares || 1.0} Ha</span>
                  <span className="crop-detail-pill">Moisture Target: {crop.optimalRanges?.moistureMin}% - {crop.optimalRanges?.moistureMax}%</span>
                </div>

                <div className="crop-card-footer">
                  <span className="pests-label">Primary Watch:</span>
                  <span className="pests-tags">
                    {crop.commonPests && crop.commonPests.length > 0
                      ? crop.commonPests.join(', ')
                      : 'General foliar pests'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leaf Diagnoses Mini Gallery */}
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div className="header-left">
            <Camera size={18} className="header-icon" />
            <div>
              <h3>Recent Foliar Diagnoses & Computer Vision Screenings</h3>
              <span className="section-subtitle">RGB camera visual assessments and symptoms detected</span>
            </div>
          </div>
          <button className="btn-link" onClick={() => onNavigate('imaging-analysis')}>
            Full Imaging Studio <ArrowRight size={14} />
          </button>
        </div>

        <div className="recent-analyses-grid">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((item) => (
              <div key={item._id} className="analysis-summary-card">
                <div className="analysis-img-box">
                  <img
                    src={item.imageUrl}
                    alt={item.cropName}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80"><rect width="100" height="80" fill="%23e2e8f0"/><text x="50" y="45" font-size="10" text-anchor="middle" fill="%2364748b">Leaf Sample</text></svg>';
                    }}
                  />
                  <span className={`analysis-pill-badge badge-${item.diagnosis?.category === 'Healthy' ? 'success' : 'warning'}`}>
                    {item.diagnosis?.category || 'Screening'}
                  </span>
                </div>
                <div className="analysis-text-box">
                  <span className="analysis-crop-title">{item.cropName}</span>
                  <h4 className="analysis-condition-title">{item.diagnosis?.primaryCondition}</h4>
                  <div className="analysis-stats">
                    <span>Confidence: {item.diagnosis?.confidenceScore ? `${(item.diagnosis.confidenceScore * 100).toFixed(0)}%` : '--'}</span>
                    <span>VARI Greenness: {item.colorMetrics?.variIndex !== undefined ? item.colorMetrics.variIndex : '0.4'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-analyses-box">
              <Camera size={28} color="#94a3b8" />
              <p>No leaf photos analyzed yet. Upload an image to test the computer vision diagnostic engine.</p>
              <button className="btn-primary" onClick={() => onNavigate('imaging-analysis')}>
                Analyze Leaf Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
