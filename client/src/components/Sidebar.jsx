import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  Bug,
  Camera,
  Bell,
  History,
  Settings,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Cpu
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crop-health', label: 'Crop Health', icon: Sprout },
  { id: 'soil-monitoring', label: 'Soil Monitoring', icon: Droplets },
  { id: 'pest-risk', label: 'Pest Risk', icon: Bug },
  { id: 'imaging-analysis', label: 'Imaging Analysis', icon: Camera },
  { id: 'alerts', label: 'Alerts', icon: Bell, badgeKey: 'alertsCount' },
  { id: 'history', label: 'Audit History', icon: History },
  { id: 'settings', label: 'Settings & ESP32', icon: Settings }
];

export default function Sidebar({ activePage, setActivePage, activeAlertsCount, isCollapsed, setIsCollapsed }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Logo & Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <div className="brand-icon">
            <Leaf size={22} color="#ffffff" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-title">AgriSense <span className="ai-badge">AI</span></span>
              <span className="brand-sub">Smart Agronomy Suite</span>
            </div>
          )}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badgeCount = item.badgeKey === 'alertsCount' ? activeAlertsCount : 0;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="nav-icon-wrap">
                <Icon size={20} />
              </div>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {!isCollapsed && badgeCount > 0 && (
                <span className="nav-badge alert-badge">{badgeCount}</span>
              )}
              {isCollapsed && badgeCount > 0 && (
                <span className="collapsed-dot" />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footnote */}
      <div className="sidebar-footer">
        <div className="node-status-card">
          <div className="node-indicator">
            <span className="pulse-dot" />
            <Cpu size={16} />
          </div>
          {!isCollapsed && (
            <div className="node-info">
              <span className="node-title">ESP32 Gateway</span>
              <span className="node-state">Active • REST Polling</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
