const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');

// GET all crops
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.find().sort({ createdAt: -1 });
    res.json({ success: true, count: crops.length, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single crop
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    res.json({ success: true, data: crop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create crop
router.post('/', async (req, res) => {
  try {
    const { name, variety, fieldPlot, growthStage, areaHectares, optimalRanges, commonPests, notes } = req.body;
    if (!name || !fieldPlot) {
      return res.status(400).json({ success: false, message: 'Crop name and field plot are required' });
    }

    const newCrop = await Crop.create({
      name,
      variety: variety || 'Standard',
      fieldPlot,
      growthStage: growthStage || 'Vegetative',
      areaHectares: areaHectares || 1.0,
      optimalRanges: optimalRanges || {
        moistureMin: 45,
        moistureMax: 75,
        tempMin: 18,
        tempMax: 30,
        humidityMax: 75,
        phMin: 6.0,
        phMax: 7.2
      },
      commonPests: commonPests || [],
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: newCrop });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update crop
router.put('/:id', async (req, res) => {
  try {
    const updated = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Crop not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE crop
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Crop.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Crop not found' });
    res.json({ success: true, message: 'Crop deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
