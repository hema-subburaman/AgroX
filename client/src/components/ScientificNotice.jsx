import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';
import './ScientificNotice.css';

export default function ScientificNotice({ title = 'Scientific & Hardware Methodology Disclosure', compact = false }) {
  const [isOpen, setIsOpen] = useState(!compact);

  return (
    <div className={`scientific-notice-card ${compact ? 'compact' : ''}`}>
      <div className="notice-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="notice-header-left">
          <ShieldAlert size={18} className="notice-icon" />
          <span className="notice-title">{title}</span>
          <span className="notice-pill">RGB Optical Limitations</span>
        </div>
        <button className="notice-toggle-btn" aria-label="Toggle notice">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="notice-content">
          <div className="notice-grid">
            <div className="notice-col">
              <div className="sub-heading">
                <Layers size={15} />
                <span>Standard RGB vs Multispectral / Hyperspectral NDVI</span>
              </div>
              <p>
                Consumer smartphones, DSLRs, and web cameras capture standard visible Red, Green, and Blue (RGB) wavelengths (400–700nm).
                <strong> Ordinary RGB imagery cannot capture Near-Infrared (NIR, 700–1100nm) reflectance.</strong> True agricultural NDVI
                measurements require specialized optical hardware. Indices generated here (e.g. <em>Visible Atmospherically Resistant Index - VARI</em>)
                approximate visual surface greenness and pigment ratios only.
              </p>
            </div>
            <div className="notice-col">
              <div className="sub-heading">
                <Info size={15} />
                <span>Agronomic Advisory & Model Boundaries</span>
              </div>
              <p>
                Visual crop condition predictions and pest risk indexes correlate environmental parameters with empirical agronomic disease-triangle models.
                These outputs serve as scouting guidance and demonstration screening. Confirmed field interventions should always be verified through physical field inspection, soil laboratory testing, and certified agronomic consultation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
