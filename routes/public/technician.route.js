const express = require("express");
const router = express.Router();
const techController = require("../../controllers/public/technician.controller");

router.use((req, res, next) => {
  console.log(`Technician Route: ${req.method} ${req.originalUrl}`);
  next();
});

router.get("/api/get-technician-slug", techController.getTechnicianSlug);
router.get("/", techController.getAllTechnicians);
router.get("/:slug", techController.getTechnicianDetails);
router.get("/:section/:slug", techController.getSeeMoreTechnicianNeighborhoods);

module.exports = router;
