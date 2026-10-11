import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Download,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Camera,
  Droplets,
  Calendar,
  Radio,
  Cpu
} from 'lucide-react';
import { getReadings, getAnalyses } from '../services/api';
import './History.css';

export default function History({ crops = [], showToast }) {
  const [activeTab, setActiveTab] = useState('readings'); // 'readings' | 'imaging'
  const [readings, setReadings] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [cropFilter, setCropFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'readings') {
        const res = await getReadings({
          cropName: cropFilter !== 'All' ? cropFilter : undefined,
          dataSource: sourceFilter !== 'All' ? sourceFilter : undefined,
          page,
          limit: 25
        });
        if (res.success) {
          setReadings(res.data || []);
          setTotalPages(res.pagination?.pages || 1);
        }
      } else {
        const res = await getAnalyses({
          cropName: cropFilter !== 'All' ? cropFilter : undefined,
          page,
          limit: 20
        });
        if (res.success) {
          setAnalyses(res.data || []);
          setTotalPages(res.pagination?.pages || 1);
        }
      }
    } catch (err) {
      showToast('Error loading historical records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [activeTab, cropFilter, sourceFilter, page]);

  // Export current table view as CSV
  const handleExportCsv = () => {
    if (activeTab === 'readings') {
      if (readings.length === 0) {
        showToast('No readings to export', 'error');
        return;
      }
      const headers = ['Timestamp', 'Device ID', 'Crop', 'Plot', 'Soil Moisture (%)', 'Soil Temp (°C)', 'Humidity (%)', 'Soil pH', 'Data Source', 'Is Simulated'];
      const rows = readings.map((r) => [
        `"${new Date(r.timestamp).toISOString()}"`,
        `"${r.deviceId}"`,
        `"${r.cropName}"`,
        `"${r.fieldPlot || ''}"`,
        r.soilMoisture,
        r.soilTemperature,
        r.ambientHumidity,
        r.soilPh || '',
        `"${r.dataSource}"`,
        r.isSimulated
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `agrisense_telemetry_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Telemetry CSV exported successfully!', 'success');
    } else {
      if (analyses.length === 0) {
        showToast('No diagnoses to export', 'error');
        return;
      }
      const headers = ['Analyzed Date', 'Crop', 'Condition', 'Category', 'Severity', 'Confidence', 'VARI Index', 'Green %', 'Discolored %'];
      const rows = analyses.map((a) => [
        `"${new Date(a.analyzedAt).toISOString()}"`,
        `"${a.cropName}"`,
        `"${a.diagnosis?.primaryCondition}"`,
        `"${a.diagnosis?.category}"`,
        `"${a.diagnosis?.severity}"`,
        a.diagnosis?.confidenceScore,
        a.colorMetrics?.variIndex || '',
        a.colorMetrics?.greenCoveragePercent || '',
        a.colorMetrics?.yellowNecrosisPercent || ''
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `agrisense_diagnostics_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Diagnostic CSV exported successfully!', 'success');
    }
  };

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div>
          <h2>Telemetry & Agronomic Audit History</h2>
          <p className="page-subtitle">
            Comprehensive immutable logs of sensor telemetry records, physical probe samples, and imaging diagnostic runs.
          </p>
        </div>

        <button className="btn-primary" onClick={handleExportCsv}>
          <Download size={16} />
          <span>Export CSV Audit Log</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="history-card">
        {/* Toolbar & Filters */}
        <div className="history-toolbar">
          <div className="history-tabs">
            <button
              className={`tab-btn ${activeTab === 'readings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('readings'); setPage(1); }}
            >
              <Droplets size={15} />
              <span>Sensor Telemetry</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'imaging' ? 'active' : ''}`}
              onClick={() => { setActiveTab('imaging'); setPage(1); }}
            >
              <Camera size={15} />
              <span>Image Diagnoses</span>
            </button>
          </div>

          <div className="history-filters">
            {/* Crop Selector */}
            <select
              value={cropFilter}
              onChange={(e) => { setCropFilter(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="All">All Crops</option>
              {crops.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Data Source Filter (readings only) */}
            {activeTab === 'readings' && (
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="filter-select"
              >
                <option value="All">All Data Sources</option>
                <option value="physical_esp32">ESP32 Hardware</option>
                <option value="demo_simulation">Demo Simulation</option>
                <option value="manual_entry">Manual Entry</option>
              </select>
            )}

            <button className="btn-icon" onClick={fetchHistoryData} title="Refresh records">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Tab 1: Sensor Readings Table */}
        {activeTab === 'readings' && (
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Crop / Field Plot</th>
                  <th>Soil Moisture</th>
                  <th>Soil Temp</th>
                  <th>Humidity</th>
                  <th>Soil pH</th>
                  <th>Source & Integrity</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                    <td>
                      <strong>{r.cropName}</strong> <span className="text-plot">({r.fieldPlot || 'Plot'})</span>
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
                        {r.dataSource === 'physical_esp32' ? (
                          <><Cpu size={12} /> ESP32 Physical</>
                        ) : r.dataSource === 'manual_entry' ? (
                          'Manual Probe Log'
                        ) : (
                          <><Radio size={12} /> Demo Simulation</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {readings.length === 0 && (
              <div className="empty-history">
                <FileSpreadsheet size={36} color="#94a3b8" />
                <p>No sensor readings found for selected criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Leaf Image Analyses Table */}
        {activeTab === 'imaging' && (
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Analyzed Date</th>
                  <th>Preview</th>
                  <th>Crop</th>
                  <th>Condition Identified</th>
                  <th>Category</th>
                  <th>Confidence</th>
                  <th>VARI Greenness</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.analyzedAt).toLocaleString()}</td>
                    <td>
                      <img
                        src={a.imageUrl}
                        alt="Leaf"
                        className="thumb-table-img"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="%23cbd5e1"/></svg>';
                        }}
                      />
                    </td>
                    <td><strong>{a.cropName}</strong></td>
                    <td>{a.diagnosis?.primaryCondition}</td>
                    <td>
                      <span className="badge badge-neutral">{a.diagnosis?.category}</span>
                    </td>
                    <td>{(a.diagnosis?.confidenceScore * 100).toFixed(0)}%</td>
                    <td>{a.colorMetrics?.variIndex !== undefined ? a.colorMetrics.variIndex : '0.4'}</td>
                    <td>
                      <span className={`badge ${a.diagnosis?.severity === 'None' ? 'badge-success' : a.diagnosis?.severity === 'Low' ? 'badge-info' : 'badge-danger'}`}>
                        {a.diagnosis?.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {analyses.length === 0 && (
              <div className="empty-history">
                <Camera size={36} color="#94a3b8" />
                <p>No imaging diagnostics found for selected criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="history-pagination">
          <span>Page {page} of {totalPages}</span>
          <div className="page-btns">
            <button
              className="btn-page"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn-page"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
