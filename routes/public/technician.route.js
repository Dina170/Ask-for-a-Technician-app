const express = require('express');
const router = express.Router();
const techController = require('../../controllers/public/technician.controller');

// Show technician neighborhoods list
router.get('/:id/neighborhoods', techController.getTechnicianNeighborhoods);

// Show specific neighborhood details for a technician
router.get('/:techId/neighborhoods/:neighId', techController.getNeighborhoodDetails);

module.exports = router;
