import React, { useState } from 'react';
import {
  Bell,
  Cpu,
  Radio,
  PlayCircle,
  RefreshCw,
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import './Navbar.css';

export default function Navbar({
  selectedCrop,
  setSelectedCrop,
  crops = [],
  activeAlertsCount = 0,
  sensorMode = {},
  onSimulateReading,
  onOpenAlerts,
  onRefresh
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimInfo, setShowSimInfo] = useState(false);

  const handleSimulateClick = async () => {
    setIsSimulating(true);
    try {
      await onSimulateReading();
    } finally {
      setIsSimulating(false);
    }
  };

  const isSimulated = sensorMode.isSimulated !== false;

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Crop Context Selector */}
        <div className="crop-selector-wrap">
          <label htmlFor="crop-select" className="crop-label">Active Field / Crop:</label>
          <select
            id="crop-select"
            className="crop-select"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            <option value="All">All Farm Plots (Composite)</option>
            {crops.map((c) => (
              <option key={c._id || c.name} value={c.name}>
                {c.name} — {c.fieldPlot || 'Plot'} ({c.growthStage || 'Active'})
              </option>
            ))}
          </select>
        </div>

        {/* Telemetry Source Badge - Mandatory Transparency Requirement */}
        <div
          className={`telemetry-source-badge ${isSimulated ? 'source-simulated' : 'source-physical'}`}
          onClick={() => setShowSimInfo(!showSimInfo)}
          title="Click to view sensor telemetry source details"
        >
          {isSimulated ? (
            <>
              <Radio size={14} className="badge-icon-spin" />
              <span>Demo Mode: Simulated Data</span>
              <Info size={13} className="info-icon" />
            </>
          ) : (
            <>
              <Cpu size={14} />
              <span>ESP32 Physical Live Telemetry</span>
            </>
          )}
        </div>

        {/* Transparency Popover */}
        {showSimInfo && (
          <div className="telemetry-info-popover">
            <div className="popover-header">
              <AlertTriangle size={16} color="#d97706" />
              <strong>Telemetry Source Disclosure</strong>
            </div>
            <p>
              {isSimulated
                ? 'AgriSense is running in Demonstration Mode. Readings are generated via agronomic microclimate simulations to demonstrate live chart behavior, threshold breach detection, and pest risk modeling. Never presented as real hardware measurements.'
                : 'Authenticated physical telemetry packets are being received from an ESP32 microcontroller gateway at /api/sensors/ingest.'}
            </p>
            <button className="btn-popover-close" onClick={() => setShowSimInfo(false)}>
              Got it
            </button>
          </div>
        )}
      </div>

      <div className="navbar-right">
        {/* Simulate Sensor Button */}
        <button
          className="btn-simulate"
          onClick={handleSimulateClick}
          disabled={isSimulating}
          title="Generate a realistic sensor telemetry packet for demonstration"
        >
          <PlayCircle size={16} />
          <span>{isSimulating ? 'Simulating...' : 'Simulate Reading'}</span>
        </button>

        {/* Manual Refresh */}
        <button className="btn-icon" onClick={onRefresh} title="Refresh live telemetry">
          <RefreshCw size={18} />
        </button>

        {/* Alerts Bell */}
        <button
          className="btn-icon alert-bell-btn"
          onClick={onOpenAlerts}
          title={`${activeAlertsCount} active alerts`}
        >
          <Bell size={19} />
          {activeAlertsCount > 0 && (
            <span className="bell-badge-count">{activeAlertsCount}</span>
          )}
        </button>

        {/* Today's Date */}
        <div className="navbar-date">
          <Calendar size={15} />
          <span>
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </header>
  );
}
