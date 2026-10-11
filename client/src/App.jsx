import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import CropHealth from './pages/CropHealth';
import SoilMonitoring from './pages/SoilMonitoring';
import PestRisk from './pages/PestRisk';
import ImagingAnalysis from './pages/ImagingAnalysis';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Settings from './pages/Settings';
import { getDashboard, getCrops, simulateSensorReading, acknowledgeAlert } from './services/api';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [crops, setCrops] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [dashRes, cropRes] = await Promise.all([getDashboard(), getCrops()]);
      if (dashRes.success) setDashboardData(dashRes.data);
      if (cropRes.success) {
        setCrops(cropRes.data || []);
        if (cropRes.data.length > 0 && selectedCrop === 'All') {
          // keep selectedCrop
        }
      }
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Poll dashboard every 30 seconds for live telemetry refresh
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateReading = async () => {
    try {
      const res = await simulateSensorReading({
        cropName: selectedCrop !== 'All' ? selectedCrop : 'Wheat',
        scenario: 'optimal'
      });
      if (res.success) {
        showToast('Simulated telemetry packet received and processed!', 'success');
        loadData();
      }
    } catch (err) {
      showToast('Simulation request failed', 'error');
    }
  };

  const handleAcknowledgeAlert = async (id) => {
    try {
      const res = await acknowledgeAlert(id);
      if (res.success) {
        showToast('Alert acknowledged', 'info');
        loadData();
      }
    } catch (err) {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  const activeAlertsCount = dashboardData?.summary?.activeAlertsCount || 0;
  const sensorMode = dashboardData?.summary?.sensorMode || { isSimulated: true };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        activeAlertsCount={activeAlertsCount}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          selectedCrop={selectedCrop}
          setSelectedCrop={setSelectedCrop}
          crops={crops}
          activeAlertsCount={activeAlertsCount}
          sensorMode={sensorMode}
          onSimulateReading={handleSimulateReading}
          onOpenAlerts={() => setActivePage('alerts')}
          onRefresh={loadData}
        />

        <main className="content-viewport">
          {activePage === 'dashboard' && (
            <Dashboard
              dashboardData={dashboardData}
              onNavigate={setActivePage}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSimulateReading={handleSimulateReading}
              onReseedData={loadData}
            />
          )}

          {activePage === 'crop-health' && (
            <CropHealth
              crops={crops}
              selectedCrop={selectedCrop}
              setSelectedCrop={setSelectedCrop}
              onAnalysisComplete={loadData}
              showToast={showToast}
            />
          )}

          {activePage === 'soil-monitoring' && (
            <SoilMonitoring
              crops={crops}
              selectedCrop={selectedCrop}
              onReadingAdded={loadData}
              showToast={showToast}
            />
          )}

          {activePage === 'pest-risk' && (
            <PestRisk
              crops={crops}
              selectedCrop={selectedCrop}
              showToast={showToast}
            />
          )}

          {activePage === 'imaging-analysis' && (
            <ImagingAnalysis
              crops={crops}
              selectedCrop={selectedCrop}
              showToast={showToast}
            />
          )}

          {activePage === 'alerts' && (
            <Alerts
              showToast={showToast}
              onAlertsUpdated={loadData}
            />
          )}

          {activePage === 'history' && (
            <History
              crops={crops}
              showToast={showToast}
            />
          )}

          {activePage === 'settings' && (
            <Settings
              showToast={showToast}
              onSettingsSaved={loadData}
            />
          )}
        </main>
      </div>

      {/* Toast Floating Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
