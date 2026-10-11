import React from 'react';
import './MetricCard.css';

export default function MetricCard({
  title,
  value,
  unit = '',
  icon: Icon,
  status = 'optimal',
  statusText = '',
  targetRange = '',
  colorTheme = 'green',
  footerNote = ''
}) {
  return (
    <div className={`metric-card theme-${colorTheme}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className="metric-icon-box">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="metric-body">
        <div className="metric-value-row">
          <span className="metric-number">{value !== undefined && value !== null ? value : '--'}</span>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>

        <div className="metric-status-row">
          <span className={`status-pill status-${status}`}>
            <span className="status-indicator-dot" />
            {statusText}
          </span>
          {targetRange && <span className="target-range">Target: {targetRange}</span>}
        </div>
      </div>

      {footerNote && <div className="metric-footer">{footerNote}</div>}
    </div>
  );
}
