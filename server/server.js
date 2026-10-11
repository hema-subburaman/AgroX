const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const Crop = require('./models/Crop');
const { seedDatabase } = require('./seed');

// Import routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const cropRoutes = require('./routes/cropRoutes');
const readingRoutes = require('./routes/readingRoutes');
const sensorIngestRoutes = require('./routes/sensorIngestRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const alertRoutes = require('./routes/alertRoutes');
const pestRoutes = require('./routes/pestRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const seedRoutes = require('./routes/seedRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrisense_db';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded images
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/sensors', sensorIngestRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/pest', pestRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/seed', seedRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AgriSense AI API Server',
    timestamp: new Date(),
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Global Error Handler (handles Multer errors and unhandled exceptions)
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Uploaded image exceeds the 5MB file size limit.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// MongoDB Connection & Auto-Seed initialization
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`Connected to MongoDB successfully at: ${MONGO_URI}`);
    // Auto-seed if database is brand new and empty
    const cropCount = await Crop.countDocuments();
    if (cropCount === 0) {
      console.log('Fresh database detected. Auto-seeding initial agronomic dataset...');
      await seedDatabase();
    }
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` AgriSense AI Backend Server is running on port ${PORT}`);
      console.log(` REST API URL: http://localhost:${PORT}/api/`);
      console.log(` ESP32 Ingestion: http://localhost:${PORT}/api/sensors/ingest`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
