import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Filter,
  RefreshCw,
  Clock,
  Radio,
  Cpu
} from 'lucide-react';
import { getAlerts, acknowledgeAlert, resolveAlert, clearResolvedAlerts } from '../services/api';
import './Alerts.css';

export default function Alerts({ showToast, onAlertsUpdated }) {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({ active: 0, acknowledged: 0, resolved: 0 });
  const [activeTab, setActiveTab] = useState('active'); // active, acknowledged, resolved
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlertsData = async () => {
    setIsLoading(true);
    try {
      const res = await getAlerts({
        status: activeTab,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        limit: 50
      });
      if (res.success) {
        setAlerts(res.data || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      showToast('Failed to retrieve alerts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [activeTab, severityFilter]);

  const handleAcknowledge = async (id) => {
    try {
      const res = await acknowledgeAlert(id);
      if (res.success) {
        showToast('Alert marked as acknowledged', 'info');
        fetchAlertsData();
        if (onAlertsUpdated) onAlertsUpdated();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await resolveAlert(id);
      if (res.success) {
        showToast('Alert resolved and closed', 'success');
        fetchAlertsData();
        if (onAlertsUpdated) onAlertsUpdated();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleClearResolved = async () => {
    if (!window.confirm('Clear all resolved alert records from database?')) return;
    try {
      const res = await clearResolvedAlerts();
      if (res.success) {
        showToast(res.message, 'info');
        fetchAlertsData();
        if (onAlertsUpdated) onAlertsUpdated();
      }
    } catch (err) {
      showToast('Failed to clear resolved alerts', 'error');
    }
  };

  return (
    <div className="alerts-page">
      {/* Header */}
      <div className="alerts-header">
        <div>
          <h2>Threshold Violations & Agronomic Alerts</h2>
          <p className="page-subtitle">
            Automated monitoring notifications triggered when sensor telemetry or disease diagnostics breach configured agronomic limits.
          </p>
        </div>

        {activeTab === 'resolved' && (
          <button className="btn-secondary" onClick={handleClearResolved}>
            <Trash2 size={16} />
            <span>Clear Resolved Log</span>
          </button>
        )}
      </div>

      {/* Summary KPI Badges */}
      <div className="alerts-summary-grid">
        <div className={`alert-stat-card ${activeTab === 'active' ? 'active-stat' : ''}`} onClick={() => setActiveTab('active')}>
          <div className="stat-icon-wrap red">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-count">{counts.active}</span>
            <span className="stat-label">Active Warnings</span>
          </div>
        </div>

        <div className={`alert-stat-card ${activeTab === 'acknowledged' ? 'active-stat' : ''}`} onClick={() => setActiveTab('acknowledged')}>
          <div className="stat-icon-wrap amber">
            <Clock size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-count">{counts.acknowledged}</span>
            <span className="stat-label">Acknowledged</span>
          </div>
        </div>

        <div className={`alert-stat-card ${activeTab === 'resolved' ? 'active-stat' : ''}`} onClick={() => setActiveTab('resolved')}>
          <div className="stat-icon-wrap green">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-text">
            <span className="stat-count">{counts.resolved}</span>
            <span className="stat-label">Resolved & Cleared</span>
          </div>
        </div>
      </div>

      {/* Main Alert List Card */}
      <div className="alerts-main-card">
        <div className="alerts-toolbar">
          <div className="alert-tab-group">
            <button
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active ({counts.active})
            </button>
            <button
              className={`tab-btn ${activeTab === 'acknowledged' ? 'active' : ''}`}
              onClick={() => setActiveTab('acknowledged')}
            >
              Acknowledged ({counts.acknowledged})
            </button>
            <button
              className={`tab-btn ${activeTab === 'resolved' ? 'active' : ''}`}
              onClick={() => setActiveTab('resolved')}
            >
              Resolved ({counts.resolved})
            </button>
          </div>

          <div className="alert-filter-group">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="severity-select"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warning Only</option>
              <option value="info">Info Only</option>
            </select>

            <button className="btn-icon" onClick={fetchAlertsData} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="alerts-stack">
          {alerts.map((al) => (
            <div key={al._id} className={`alert-card-row severity-${al.severity}`}>
              <div className="alert-row-left">
                <div className="alert-header-line">
                  <span className={`badge badge-${al.severity === 'critical' ? 'danger' : al.severity === 'warning' ? 'warning' : 'info'}`}>
                    {al.severity}
                  </span>
                  <span className="alert-type-code">{al.alertType}</span>
                  <span className="alert-source-pill">
                    {al.isSimulatedSource ? (
                      <><Radio size={12} color="#b45309" /> Simulated</>
                    ) : (
                      <><Cpu size={12} color="#047857" /> ESP32 Live</>
                    )}
                  </span>
                  <span className="alert-timestamp">
                    {new Date(al.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="alert-title-text">{al.title}</h3>
                <p className="alert-message-text">{al.message}</p>

                <div className="alert-meta-footer">
                  <span><strong>Plot:</strong> {al.fieldPlot || 'Plot 1'}</span>
                  <span><strong>Crop:</strong> {al.cropName}</span>
                  {al.valueDetected && (
                    <span><strong>Detected:</strong> {al.valueDetected}</span>
                  )}
                  {al.thresholdViolated && (
                    <span><strong>Threshold:</strong> {al.thresholdViolated}</span>
                  )}
                </div>
              </div>

              <div className="alert-row-actions">
                {al.status === 'active' && (
                  <>
                    <button className="btn-ack-alert" onClick={() => handleAcknowledge(al._id)}>
                      <Clock size={14} /> Acknowledge
                    </button>
                    <button className="btn-resolve-alert" onClick={() => handleResolve(al._id)}>
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                  </>
                )}

                {al.status === 'acknowledged' && (
                  <button className="btn-resolve-alert" onClick={() => handleResolve(al._id)}>
                    <CheckCircle2 size={14} /> Mark Resolved
                  </button>
                )}

                {al.status === 'resolved' && (
                  <span className="resolved-status-tag">
                    <CheckCircle2 size={14} color="#10b981" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="empty-alerts-box">
              <CheckCircle2 size={40} color="#10b981" />
              <h3>No {activeTab} alerts found</h3>
              <p>All microclimate thresholds and crop disease diagnostics are operating within acceptable agronomic limits.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
