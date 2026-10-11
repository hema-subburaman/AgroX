const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../seed');

// POST /api/seed - Trigger database re-seed
router.post('/', async (req, res) => {
  try {
    await seedDatabase();
    res.json({
      success: true,
      message: 'Database successfully re-seeded with realistic agronomic demonstration data.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reseed database: ' + err.message });
  }
});

module.exports = router;
