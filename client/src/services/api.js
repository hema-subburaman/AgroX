import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dashboard
export const getDashboard = async () => {
  const res = await api.get('/dashboard');
  return res.data;
};

// Crops
export const getCrops = async () => {
  const res = await api.get('/crops');
  return res.data;
};

export const createCrop = async (cropData) => {
  const res = await api.post('/crops', cropData);
  return res.data;
};

export const updateCrop = async (id, cropData) => {
  const res = await api.put(`/crops/${id}`, cropData);
  return res.data;
};

export const deleteCrop = async (id) => {
  const res = await api.delete(`/crops/${id}`);
  return res.data;
};

// Sensor Readings
export const getReadings = async (params = {}) => {
  const res = await api.get('/readings', { params });
  return res.data;
};

export const getLatestReading = async () => {
  const res = await api.get('/readings/latest');
  return res.data;
};

export const createReading = async (readingData) => {
  const res = await api.post('/readings', readingData);
  return res.data;
};

// ESP32 Simulation & Ingestion
export const simulateSensorReading = async (data = {}) => {
  const res = await api.post('/sensors/simulate', data);
  return res.data;
};

// Image Analysis
export const uploadCropImage = async (formData) => {
  const res = await api.post('/analysis/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const getAnalyses = async (params = {}) => {
  const res = await api.get('/analysis', { params });
  return res.data;
};

export const getAnalysisById = async (id) => {
  const res = await api.get(`/analysis/${id}`);
  return res.data;
};

export const deleteAnalysis = async (id) => {
  const res = await api.delete(`/analysis/${id}`);
  return res.data;
};

export const getSupportedClasses = async () => {
  const res = await api.get('/analysis/classes');
  return res.data;
};

// Alerts
export const getAlerts = async (params = {}) => {
  const res = await api.get('/alerts', { params });
  return res.data;
};

export const acknowledgeAlert = async (id) => {
  const res = await api.patch(`/alerts/${id}/acknowledge`);
  return res.data;
};

export const resolveAlert = async (id) => {
  const res = await api.patch(`/alerts/${id}/resolve`);
  return res.data;
};

export const clearResolvedAlerts = async () => {
  const res = await api.post('/alerts/clear-resolved');
  return res.data;
};

// Pest Risk Engine
export const getPestRisk = async (params = {}) => {
  const res = await api.get('/pest/current-risk', { params });
  return res.data;
};

export const simulatePestScenario = async (data) => {
  const res = await api.post('/pest/simulate-scenario', data);
  return res.data;
};

// Settings
export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (settingsData) => {
  const res = await api.put('/settings', settingsData);
  return res.data;
};

// Seed / Demo Reset
export const reseedDatabase = async () => {
  const res = await api.post('/seed');
  return res.data;
};

export default api;
