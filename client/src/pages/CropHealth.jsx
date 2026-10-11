import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileImage,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Leaf,
  HelpCircle,
  BookOpen,
  X,
  AlertCircle,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { uploadCropImage, getSupportedClasses } from '../services/api';
import ScientificNotice from '../components/ScientificNotice';
import './CropHealth.css';

export default function CropHealth({ crops = [], selectedCrop, setSelectedCrop, onAnalysisComplete, showToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Supported Classes Taxonomy Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogData, setCatalogData] = useState(null);
  const [catalogFilterCrop, setCatalogFilterCrop] = useState('All');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Active crop object from parent state
  const activeCropObj = crops.find((c) => c.name === selectedCrop) || crops[0] || {
    name: 'Tomato',
    variety: 'Roma VF',
    fieldPlot: 'Plot 1 North',
    growthStage: 'Vegetative',
    optimalRanges: { moistureMin: 45, moistureMax: 70, tempMin: 16, tempMax: 28 }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds maximum size limit of 5MB.');
      return;
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid format. Please upload a JPEG, PNG, or WebP photo.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Please select or drop an image file to analyze.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cropName', activeCropObj.name);

      const res = await uploadCropImage(formData);
      if (res.success) {
        setAnalysisResult(res.data);
        showToast('Leaf image analyzed with deep learning model!', 'success');
        if (onAnalysisComplete) onAnalysisComplete();
      } else {
        setUploadError(res.message || 'Image analysis failed.');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Error analyzing image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setUploadError(null);
  };

  const openCatalogModal = async () => {
    setShowCatalogModal(true);
    if (!catalogData) {
      setIsLoadingCatalog(true);
      try {
        const res = await getSupportedClasses();
        if (res.success && res.data) {
          setCatalogData(res.data);
        }
      } catch (e) {
        showToast('Failed to load supported crop catalog', 'error');
      } finally {
        setIsLoadingCatalog(false);
      }
    }
  };

  const isHealthy = analysisResult?.diagnosis?.category === 'Healthy' || analysisResult?.diagnosis?.isHealthy === true;
  const isInconclusive = Boolean(analysisResult?.diagnosis?.isInconclusive);
  const confidenceScore = analysisResult?.diagnosis?.confidenceScore !== undefined
    ? (analysisResult.diagnosis.confidenceScore * 100).toFixed(1)
    : '0.0';

  return (
    <div className="crop-health-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Crop Health & Foliar Pathology Diagnostics</h2>
          <p className="page-subtitle">
            Deep learning foliar disease screening powered by MobileNetV2 trained on the 38-class PlantVillage dataset.
          </p>
        </div>
        <button className="btn-secondary btn-catalog" onClick={openCatalogModal}>
          <BookOpen size={16} />
          <span>Supported Crops & Diseases (38 Classes)</span>
        </button>
      </div>

      {/* Scientific Notice */}
      <ScientificNotice />

      <div className="crop-health-layout">
        {/* Left Column: Crop Profile & Image Upload Workbench */}
        <div className="workbench-column">
          {/* Active Crop Profile Card */}
          <div className="workbench-card">
            <div className="card-top-title">
              <Leaf size={18} className="icon-green" />
              <h3>Active Field Crop Profile</h3>
            </div>

            <div className="crop-select-field">
              <label htmlFor="health-crop-select">Select Farm Crop:</label>
              <select
                id="health-crop-select"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                {crops.map((c) => (
                  <option key={c._id || c.name} value={c.name}>
                    {c.name} ({c.fieldPlot})
                  </option>
                ))}
              </select>
            </div>

            <div className="crop-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Variety:</span>
                <span className="meta-val">{activeCropObj.variety || 'Standard'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Plot Location:</span>
                <span className="meta-val">{activeCropObj.fieldPlot || 'Plot 1'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Growth Stage:</span>
                <span className="meta-val badge badge-info">{activeCropObj.growthStage || 'Vegetative'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Optimal Moisture:</span>
                <span className="meta-val">{activeCropObj.optimalRanges?.moistureMin}% - {activeCropObj.optimalRanges?.moistureMax}%</span>
              </div>
            </div>

            <div className="catalog-link-box">
              <Info size={14} />
              <span>PlantVillage optical model covers 14 crop species. For non-covered crops, root telemetry and pest-triangle engines monitor health.</span>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="workbench-card upload-card">
            <div className="card-top-title">
              <UploadCloud size={18} className="icon-blue" />
              <h3>Leaf Image Upload & Inspection</h3>
            </div>

            <div
              className={`dropzone ${previewUrl ? 'has-preview' : ''}`}
              onClick={() => document.getElementById('leaf-file-input').click()}
            >
              <input
                id="leaf-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Uploaded Leaf Preview" className="preview-img" />
                  <div className="preview-overlay">
                    <FileImage size={24} />
                    <span>Click to choose another photo</span>
                  </div>
                </div>
              ) : (
                <div className="dropzone-prompt">
                  <div className="dropzone-icon-circle">
                    <UploadCloud size={32} />
                  </div>
                  <h4>Upload or Drag & Drop Leaf Photo</h4>
                  <p>Supports JPEG, PNG, or WebP up to 5MB</p>
                  <span className="btn-browse">Browse Files</span>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="upload-error-msg">
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="upload-actions">
              <button
                className="btn-primary btn-analyze"
                onClick={handleUploadSubmit}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Executing Neural Inference...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Identify Crop Disease</span>
                  </>
                )}
              </button>

              {previewUrl && (
                <button className="btn-secondary" onClick={handleReset} disabled={isUploading}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnosis Results View */}
        <div className="results-column">
          {analysisResult ? (
            <div className={`analysis-result-panel ${isInconclusive ? 'result-inconclusive' : isHealthy ? 'result-healthy' : 'result-diseased'}`}>
              
              {/* Header with authentic status */}
              <div className="result-header">
                <div>
                  <div className="model-tag-row">
                    <span className="result-tag">MobileNetV2 Plant Pathology Engine</span>
                    {analysisResult.diagnosis?.predictedCrop && (
                      <span className="crop-detected-tag">Detected Species: {analysisResult.diagnosis?.predictedCrop}</span>
                    )}
                  </div>
                  <h3 className="result-condition">{analysisResult.diagnosis?.primaryCondition}</h3>
                  <span className="result-category">Classification Category: {analysisResult.diagnosis?.category}</span>
                </div>

                <div className="result-badges">
                  {/* Category Status Badge */}
                  {isInconclusive ? (
                    <span className="badge badge-warning">
                      <HelpCircle size={13} /> Status: Inconclusive
                    </span>
                  ) : isHealthy ? (
                    <span className="badge badge-success">
                      <CheckCircle2 size={13} /> Healthy Foliage
                    </span>
                  ) : (
                    <span className="badge badge-danger">
                      <AlertTriangle size={13} /> {analysisResult.diagnosis?.category || 'Infection'}
                    </span>
                  )}

                  {/* Real Model Confidence */}
                  <span className="badge badge-neutral" title="Real Softmax Neural Network Likelihood">
                    Model Confidence: {confidenceScore}%
                  </span>

                  {/* Severity Badge (Only displayed when validated or documented) */}
                  {!isInconclusive && analysisResult.diagnosis?.severity && (
                    <span className={`badge ${analysisResult.diagnosis?.severity === 'None' ? 'badge-success' : analysisResult.diagnosis?.severity === 'Low' ? 'badge-info' : 'badge-danger'}`}>
                      Severity: {analysisResult.diagnosis?.severity}
                    </span>
                  )}
                </div>
              </div>

              {/* Inconclusive Advisory Banner */}
              {isInconclusive && (
                <div className="inconclusive-banner">
                  <div className="inconclusive-banner-header">
                    <ShieldAlert size={20} className="icon-warning" />
                    <h4>Diagnostic Advisory: Inconclusive Result</h4>
                  </div>
                  <p>
                    {analysisResult.diagnosis?.uncertaintyWarning ||
                      `Model confidence (${confidenceScore}%) is below the diagnostic certainty threshold (65%). The uploaded photograph does not present distinct pathogen lesion characteristics.`}
                  </p>
                  <div className="inconclusive-guidance">
                    <strong>Recommended Next Steps:</strong>
                    <ul>
                      <li>Ensure proper lighting: photograph leaf outdoors under natural, diffuse daylight.</li>
                      <li>Avoid blurry images: hold phone steady and focus directly on the symptomatic leaf blade.</li>
                      <li>Place the leaf flat against a neutral background (e.g. clean sheet of paper or soil bed).</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Crop Mismatch Advisory */}
              {analysisResult.diagnosis?.cropMismatchWarning && (
                <div className="crop-mismatch-banner">
                  <AlertCircle size={18} />
                  <span>{analysisResult.diagnosis.cropMismatchWarning}</span>
                </div>
              )}

              {/* Top Softmax Candidates (Neural Transparency) */}
              {analysisResult.topCandidates && analysisResult.topCandidates.length > 0 && (
                <div className="top-candidates-box">
                  <h4>Top Neural Class Probabilities (Softmax Distribution)</h4>
                  <div className="candidates-list">
                    {analysisResult.topCandidates.map((cand, idx) => (
                      <div key={idx} className="candidate-row">
                        <div className="candidate-info">
                          <span className="candidate-rank">#{idx + 1}</span>
                          <span className="candidate-name">{cand.disease}</span>
                          <span className="candidate-crop">({cand.crop})</span>
                        </div>
                        <div className="candidate-bar-wrap">
                          <div
                            className={`candidate-bar ${idx === 0 ? (isInconclusive ? 'bar-yellow' : isHealthy ? 'bar-green' : 'bar-red') : 'bar-gray'}`}
                            style={{ width: `${Math.min(100, Math.max(8, cand.confidencePercent))}%` }}
                          />
                          <span className="candidate-pct">{cand.confidencePercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="candidate-footnote">
                    * Softmax confidence represents class likelihood within the 38 PlantVillage classes, not absolute laboratory certainty.
                  </span>
                </div>
              )}

              {/* Color & Vegetation Proxy Indices (Supplementary Analysis) */}
              <div className="color-metrics-box">
                <h4>Supplementary Optical RGB Analysis (VARI & Chlorophyll Proxy)</h4>
                <div className="color-metrics-grid">
                  <div className="metric-chip">
                    <span className="chip-label">VARI Index</span>
                    <span className="chip-val">{analysisResult.colorMetrics?.variIndex}</span>
                    <span className="chip-sub">Visual Greenness Proxy</span>
                  </div>
                  <div className="metric-chip">
                    <span className="chip-label">Green Coverage</span>
                    <span className="chip-val">{analysisResult.colorMetrics?.greenCoveragePercent}%</span>
                    <span className="chip-sub">Photosynthetic Area</span>
                  </div>
                  <div className="metric-chip">
                    <span className="chip-label">Chlorosis / Discoloration</span>
                    <span className="chip-val">{analysisResult.colorMetrics?.yellowNecrosisPercent}%</span>
                    <span className="chip-sub">Optical Yellowing Ratio</span>
                  </div>
                  <div className="metric-chip">
                    <span className="chip-label">Discolored Leaf Area</span>
                    <span className="chip-val">{analysisResult.diagnosis?.affectedAreaPercentage || 0}%</span>
                    <span className="chip-sub">Estimated Lesion Spread</span>
                  </div>
                </div>
              </div>

              {/* Symptoms Detected (Only appropriate icons used) */}
              <div className="symptoms-section">
                <h4>Foliar Diagnostic Symptoms</h4>
                <ul className="symptoms-list">
                  {analysisResult.diagnosis?.symptomsDetected?.map((sym, idx) => (
                    <li key={idx} className={isHealthy ? 'symptom-healthy' : 'symptom-diseased'}>
                      {isHealthy ? (
                        <CheckCircle2 size={16} color="#16a34a" />
                      ) : isInconclusive ? (
                        <HelpCircle size={16} color="#d97706" />
                      ) : (
                        <AlertTriangle size={16} color="#dc2626" />
                      )}
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="actions-section">
                <h4>Recommended Immediate Actions</h4>
                <div className="actions-list">
                  {analysisResult.diagnosis?.recommendedActions?.map((act, idx) => (
                    <div key={idx} className="action-item">
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventative Measures */}
              <div className="actions-section preventative">
                <h4>Preventative Cultural & Management Practices</h4>
                <div className="actions-list">
                  {analysisResult.diagnosis?.preventativeMeasures?.map((prev, idx) => (
                    <div key={idx} className="action-item">
                      <ShieldCheck size={16} color="#0284c7" />
                      <span>{prev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Field Verification Notice */}
              <div className="result-disclaimer-box">
                <Info size={16} />
                <p>
                  {analysisResult.scientificDisclaimer?.disclaimerText ||
                    'Scientific Notice: Consumer optical RGB cameras approximate visible wavebands (400–700nm). Image-based predictions are screening aids and require field confirmation before applying chemical treatments.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-results-panel">
              <div className="empty-icon-circle">
                <FileImage size={40} />
              </div>
              <h3>No Diagnosis Executed Yet</h3>
              <p>
                Select your field crop and upload a sharp leaf photograph to run deep learning foliar pathology screening.
              </p>
              <div className="guidelines-card">
                <h5>Photography Guidelines for High Model Confidence:</h5>
                <ul>
                  <li>Place the affected leaf against a neutral, shaded background.</li>
                  <li>Ensure natural diffuse daylight (avoid direct blinding sun glare).</li>
                  <li>Focus sharply on lesions, margins, and discolorations.</li>
                  <li>Check supported crops list below before uploading.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supported Crops & Diseases Catalog Modal */}
      {showCatalogModal && (
        <div className="modal-backdrop" onClick={() => setShowCatalogModal(false)}>
          <div className="catalog-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="catalog-modal-header">
              <div>
                <h3>Supported Crops & Diseases Catalog</h3>
                <span className="modal-subtitle">PlantVillage Deep Learning Taxonomy (38 Classes across 14 Crop Species)</span>
              </div>
              <button className="btn-modal-close" onClick={() => setShowCatalogModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="catalog-modal-body">
              {isLoadingCatalog ? (
                <div className="catalog-loading">
                  <RefreshCw size={24} className="spin" />
                  <span>Loading supported classes taxonomy...</span>
                </div>
              ) : catalogData ? (
                <>
                  {/* Filter by Crop */}
                  <div className="catalog-filter-bar">
                    <span className="filter-label">Filter by Crop:</span>
                    <div className="crop-chips-scroll">
                      <button
                        className={`chip-btn ${catalogFilterCrop === 'All' ? 'active' : ''}`}
                        onClick={() => setCatalogFilterCrop('All')}
                      >
                        All (38)
                      </button>
                      {(catalogData.crops || []).map((cr) => (
                        <button
                          key={cr}
                          className={`chip-btn ${catalogFilterCrop === cr ? 'active' : ''}`}
                          onClick={() => setCatalogFilterCrop(cr)}
                        >
                          {cr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Class Cards Grid */}
                  <div className="catalog-grid">
                    {(catalogData.classes || [])
                      .filter((c) => catalogFilterCrop === 'All' || c.crop.startsWith(catalogFilterCrop))
                      .map((item, idx) => (
                        <div key={idx} className={`catalog-item-card ${item.isHealthy ? 'card-healthy' : 'card-diseased'}`}>
                          <div className="item-card-top">
                            <span className="item-crop-badge">{item.crop}</span>
                            <span className={`badge ${item.isHealthy ? 'badge-success' : 'badge-danger'}`}>
                              {item.category}
                            </span>
                          </div>
                          <h4 className="item-disease-title">{item.disease}</h4>
                          <p className="item-class-code">Dataset Label: <code>{item.className}</code></p>
                          <div className="item-symptoms-preview">
                            <strong>Key Symptoms:</strong>
                            <ul>
                              {item.symptoms.slice(0, 2).map((s, sIdx) => (
                                <li key={sIdx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <p>Unable to load catalog from server.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
