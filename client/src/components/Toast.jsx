import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`toast-banner toast-${type}`}>
      <div className="toast-icon">
        <Icon size={18} />
      </div>
      <span className="toast-msg">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        <X size={15} />
      </button>
    </div>
  );
}
