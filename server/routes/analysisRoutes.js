const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImageAnalysis = require('../models/ImageAnalysis');
const Alert = require('../models/Alert');
const { analyzeCropImage } = require('../services/imageAnalysisService');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate sanitized unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `crop-${uniqueSuffix}${ext}`);
  }
});

// File filter and validation (JPG, JPEG, PNG, WEBP; max 5MB)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

// POST /api/analysis/upload - Upload crop leaf image and execute visual diagnosis
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No crop image file uploaded.' });
    }

    const { cropName = 'General', notes = '' } = req.body;
    const relativeImageUrl = `/uploads/${req.file.filename}`;

    // Perform leaf analysis
    const analysisResult = await analyzeCropImage({
      filePath: req.file.path,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      cropName
    });

    // Save record to MongoDB
    const savedRecord = await ImageAnalysis.create({
      cropName,
      imageUrl: relativeImageUrl,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      analysisType: analysisResult.analysisType,
      isDemonstrationResult: analysisResult.isDemonstrationResult,
      diagnosis: analysisResult.diagnosis,
      colorMetrics: analysisResult.colorMetrics,
      scientificDisclaimer: analysisResult.scientificDisclaimer,
      analyzedAt: new Date()
    });

    // If genuine disease detected (not inconclusive, not healthy) with Moderate/High/Critical severity, create an alert
    if (
      !analysisResult.diagnosis.isInconclusive &&
      analysisResult.diagnosis.category !== 'Healthy' &&
      analysisResult.diagnosis.confidenceScore >= 0.65 &&
      (analysisResult.diagnosis.severity === 'Moderate' ||
       analysisResult.diagnosis.severity === 'High' ||
       analysisResult.diagnosis.severity === 'Critical')
    ) {
      await Alert.create({
        alertType: 'DISEASE_SYMPTOM_DETECTED',
        severity: analysisResult.diagnosis.severity === 'Critical' ? 'critical' : 'warning',
        title: `Disease Identified: ${analysisResult.diagnosis.primaryCondition}`,
        message: `Optical leaf diagnosis on ${cropName} detected ${analysisResult.diagnosis.primaryCondition} (Model Confidence: ${(analysisResult.diagnosis.confidenceScore * 100).toFixed(1)}%).`,
        cropName,
        valueDetected: analysisResult.diagnosis.primaryCondition,
        thresholdViolated: `Diagnostic confidence >= ${(analysisResult.diagnosis.confidenceScore * 100).toFixed(1)}%`,
        isSimulatedSource: false
      });
    }

    res.status(201).json({
      success: true,
      message: 'Image analyzed successfully.',
      data: savedRecord
    });
  } catch (err) {
    console.error('Error during image analysis:', err);
    res.status(500).json({ success: false, message: err.message || 'Image analysis failed' });
  }
});

// GET /api/analysis/classes - Supported crops and disease taxonomy
router.get('/classes', async (req, res) => {
  try {
    const { getPythonAiMicroserviceClasses } = require('../services/imageAnalysisService');
    const data = await getPythonAiMicroserviceClasses();
    res.json({ success: true, data });
  } catch (err) {
    // If Python service is offline, return fallback list from local class_mapping.json if present
    const mappingPath = path.join(__dirname, '../../ai-service/class_mapping.json');
    if (fs.existsSync(mappingPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        return res.json({
          success: true,
          data: {
            totalClasses: raw.classes.length,
            classes: raw.classes
          }
        });
      } catch (e) { /* pass */ }
    }
    res.status(503).json({ success: false, message: 'Could not fetch supported classes from AI service.' });
  }
});

// GET /api/analysis - Historical image analyses
router.get('/', async (req, res) => {
  try {
    const { cropName, category, limit = 20, page = 1 } = req.query;
    const query = {};

    if (cropName && cropName !== 'All') {
      query.cropName = cropName;
    }
    if (category && category !== 'All') {
      query['diagnosis.category'] = category;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await ImageAnalysis.countDocuments(query);
    const analyses = await ImageAnalysis.find(query)
      .sort({ analyzedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: analyses,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analysis/:id - Single analysis details
router.get('/:id', async (req, res) => {
  try {
    const record = await ImageAnalysis.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Image analysis record not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/analysis/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await ImageAnalysis.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Attempt to remove physical file if it exists
    if (record.imageUrl) {
      const filePath = path.join(__dirname, '..', record.imageUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore unlink error
        }
      }
    }

    await ImageAnalysis.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Analysis record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
