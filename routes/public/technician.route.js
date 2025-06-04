const express = require('express');
const router = express.Router();
const techController = require('../../controllers/public/technician.controller');


// Show all technicians page
router.get('/', techController.getAllTechnicians);

// New route for "See More" page with search
router.get('/:id/seeMoreTechnicianNeighborhoods', techController.getSeeMoreTechnicianNeighborhoods);
// Show technician neighborhoods list
router.get('/:id/neighborhoods', techController.getTechnicianNeighborhoods);

// Show specific neighborhood details for a technician
router.get('/:techId/neighborhoods/:neighId', techController.getNeighborhoodDetails);



module.exports = router;
