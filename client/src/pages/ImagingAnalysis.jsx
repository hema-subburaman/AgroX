import React, { useState, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  FileImage,
  RefreshCw,
  ShieldAlert,
  X
} from 'lucide-react';
import { uploadCropImage, getAnalyses, deleteAnalysis } from '../services/api';
import ScientificNotice from '../components/ScientificNotice';
import './ImagingAnalysis.css';

export default function ImagingAnalysis({ crops = [], selectedCrop, showToast }) {
  const [analyses, setAnalyses] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cropName, setCropName] = useState(selectedCrop !== 'All' ? selectedCrop : 'Wheat');
  const [isUploading, setIsUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCrop, setFilterCrop] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null); // for inspect modal

  const fetchAnalyses = async () => {
    try {
      const res = await getAnalyses({
        category: filterCategory !== 'All' ? filterCategory : undefined,
        cropName: filterCrop !== 'All' ? filterCrop : undefined,
        limit: 50
      });
      if (res.success) {
        setAnalyses(res.data || []);
      }
    } catch (err) {
      showToast('Failed to fetch imaging records', 'error');
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [filterCategory, filterCrop]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image exceeds 5MB size limit', 'error');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Format not supported. Use JPG, PNG, or WebP.', 'error');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select an image first', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cropName', cropName);

      const res = await uploadCropImage(formData);
      if (res.success) {
        showToast('Image analyzed and recorded successfully!', 'success');
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchAnalyses();
        setSelectedRecord(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Analysis failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this imaging diagnostic session record?')) return;
    try {
      const res = await deleteAnalysis(id);
      if (res.success) {
        showToast('Analysis record deleted', 'info');
        fetchAnalyses();
        if (selectedRecord && selectedRecord._id === id) setSelectedRecord(null);
      }
    } catch (err) {
      showToast('Failed to delete record', 'error');
    }
  };

  return (
    <div className="imaging-analysis-page">
      {/* Header */}
      <div className="imaging-header">
        <div>
          <h2>Foliar Imaging & Spectral Pathology Studio</h2>
          <p className="page-subtitle">
            Color channel decomposition, canopy coverage ratios, and agronomic lesion diagnostics from standard optical RGB photographs.
          </p>
        </div>
      </div>

      {/* Mandatory Scientific Notice */}
      <ScientificNotice title="Optical RGB Sensor Limitations & Spectral Boundary Notice" />

      {/* Upload & Analysis Studio Card */}
      <div className="studio-upload-card">
        <div className="studio-card-header">
          <div className="header-title-box">
            <Camera size={20} className="icon-green" />
            <div>
              <h3>RGB Leaf Diagnostic Workbench</h3>
              <span className="section-subtitle">Drop a leaf photograph to calculate VARI vegetation index and symptom breakdown</span>
            </div>
          </div>

          <div className="studio-crop-select">
            <label htmlFor="studio-crop">Target Crop:</label>
            <select
              id="studio-crop"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
            >
              {crops.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name} ({c.fieldPlot})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="studio-upload-body">
          <div
            className={`studio-dropzone ${previewUrl ? 'has-preview' : ''}`}
            onClick={() => document.getElementById('studio-file-input').click()}
          >
            <input
              id="studio-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {previewUrl ? (
              <div className="studio-preview-box">
                <img src={previewUrl} alt="Preview" />
                <div className="studio-preview-badge">Click to choose another photo</div>
              </div>
            ) : (
              <div className="studio-prompt">
                <div className="prompt-circle">
                  <UploadCloud size={32} />
                </div>
                <h4>Select or Drag & Drop Foliage Photo</h4>
                <p>JPG, PNG, or WebP format (Max 5MB)</p>
                <button type="button" className="btn-browse-studio">Browse File</button>
              </div>
            )}
          </div>

          <div className="studio-action-sidebar">
            <div className="studio-instructions">
              <h5>Diagnostic Methodology:</h5>
              <ul>
                <li><strong>Channel Decomposition:</strong> Extracts mean Red, Green, and Blue intensities.</li>
                <li><strong>VARI Computation:</strong> Calculates <code>(G - R) / (G + R - B)</code> to evaluate photosynthetic pigment density.</li>
                <li><strong>Necrosis Detection:</strong> Identifies yellowing chlorosis and browning fungal target spots.</li>
              </ul>
            </div>

            <div className="studio-buttons-row">
              <button
                className="btn-primary btn-execute"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                <Sparkles size={16} />
                <span>{isUploading ? 'Executing Image CV...' : 'Run Image Analysis'}</span>
              </button>
              {previewUrl && (
                <button
                  className="btn-secondary"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  disabled={isUploading}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Gallery & Records Table */}
      <div className="imaging-gallery-card">
        <div className="gallery-header-row">
          <div>
            <h3>Historical Leaf Diagnostic Sessions</h3>
            <span className="section-subtitle">Audit trail of analyzed foliage imagery and advisory records</span>
          </div>

          <div className="gallery-filters">
            {/* Crop Filter */}
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="gallery-select"
            >
              <option value="All">All Crops</option>
              {crops.map((c) => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="gallery-select"
            >
              <option value="All">All Categories</option>
              <option value="Healthy">Healthy</option>
              <option value="Fungal Infection">Fungal Infection</option>
              <option value="Bacterial Infection">Bacterial Infection</option>
              <option value="Nutrient Deficiency">Nutrient Deficiency</option>
              <option value="Pest Damage">Pest Damage</option>
            </select>

            <button className="btn-icon" onClick={fetchAnalyses} title="Refresh records">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Records Grid */}
        <div className="records-grid">
          {analyses.map((rec) => (
            <div key={rec._id} className="record-card">
              <div className="record-img-wrap" onClick={() => setSelectedRecord(rec)}>
                <img
                  src={rec.imageUrl}
                  alt={rec.cropName}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80"><rect width="100" height="80" fill="%23cbd5e1"/><text x="50" y="45" font-size="10" text-anchor="middle" fill="%23475569">Leaf Photo</text></svg>';
                  }}
                />
                <span className={`record-badge badge-${rec.diagnosis?.category === 'Healthy' ? 'success' : 'warning'}`}>
                  {rec.diagnosis?.category || 'General'}
                </span>
              </div>

              <div className="record-details">
                <div className="record-meta-top">
                  <span className="record-crop-tag">{rec.cropName}</span>
                  <span className="record-date">
                    {new Date(rec.analyzedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h4 className="record-condition" onClick={() => setSelectedRecord(rec)}>
                  {rec.diagnosis?.primaryCondition}
                </h4>

                <div className="record-metrics-strip">
                  <span>Confidence: {(rec.diagnosis?.confidenceScore * 100).toFixed(1)}%</span>
                  {rec.diagnosis?.isInconclusive && <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>Inconclusive</span>}
                  <span>VARI: {rec.colorMetrics?.variIndex !== undefined ? rec.colorMetrics.variIndex : '0.4'}</span>
                </div>

                <div className="record-actions">
                  <button className="btn-record-action" onClick={() => setSelectedRecord(rec)}>
                    <Eye size={14} /> View Diagnosis
                  </button>
                  <button className="btn-record-delete" onClick={() => handleDelete(rec._id)} title="Delete record">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {analyses.length === 0 && (
            <div className="empty-gallery">
              <FileImage size={36} color="#94a3b8" />
              <p>No imaging records matching selected filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspectable Modal */}
      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="diagnostic-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-crop-sub">{selectedRecord.cropName} • {new Date(selectedRecord.analyzedAt).toLocaleString()}</span>
                <h3>{selectedRecord.diagnosis?.primaryCondition}</h3>
              </div>
              <button className="btn-modal-close" onClick={() => setSelectedRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-scroll">
              <div className="modal-preview-columns">
                <div className="modal-img-col">
                  <img src={selectedRecord.imageUrl} alt={selectedRecord.cropName} className="modal-full-img" />
                  <div className="modal-img-meta">
                    <span>File: {selectedRecord.originalFilename}</span>
                    <span>Size: {(selectedRecord.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <div className="modal-info-col">
                  <div className="modal-badges-row">
                    <span className={`badge ${selectedRecord.diagnosis?.isInconclusive ? 'badge-warning' : selectedRecord.diagnosis?.severity === 'None' ? 'badge-success' : selectedRecord.diagnosis?.severity === 'Low' ? 'badge-info' : 'badge-danger'}`}>
                      Severity: {selectedRecord.diagnosis?.severity}
                    </span>
                    <span className="badge badge-neutral">
                      Category: {selectedRecord.diagnosis?.category}
                    </span>
                    <span className="badge badge-neutral">
                      Confidence: {(selectedRecord.diagnosis?.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="modal-metrics-card">
                    <h5>RGB Visible Spectrum Metrics:</h5>
                    <div className="modal-chips-row">
                      <div className="modal-chip">
                        <span>VARI Index</span>
                        <strong>{selectedRecord.colorMetrics?.variIndex}</strong>
                      </div>
                      <div className="modal-chip">
                        <span>Green Coverage</span>
                        <strong>{selectedRecord.colorMetrics?.greenCoveragePercent}%</strong>
                      </div>
                      <div className="modal-chip">
                        <span>Necrosis Ratio</span>
                        <strong>{selectedRecord.colorMetrics?.yellowNecrosisPercent}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="modal-symptoms">
                    <h5>Detected Symptoms:</h5>
                    <ul>
                      {selectedRecord.diagnosis?.symptomsDetected?.map((s, idx) => (
                        <li key={idx}><AlertTriangle size={14} color="#d97706" /> {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="modal-interventions">
                    <h5>Recommended Agronomic Actions:</h5>
                    {selectedRecord.diagnosis?.recommendedActions?.map((a, idx) => (
                      <div key={idx} className="modal-act-item">
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mandatory Disclosure */}
                  <div className="modal-scientific-note">
                    <Info size={15} />
                    <p>{selectedRecord.scientificDisclaimer?.disclaimerText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
