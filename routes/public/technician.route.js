const express = require("express");
const router = express.Router();
const techController = require("../../controllers/public/technician.controller");

router.use((req, res, next) => {
  console.log(`Technician Route: ${req.method} ${req.originalUrl}`);
  next();
});

router.get("/", techController.getAllTechnicians);
router.get(
  "/:slug/seeMoreTechnicianNeighborhoods",
  techController.getSeeMoreTechnicianNeighborhoods
);
router.get("/:slug/details", techController.getTechnicianDetails);
router.get("/:slug", techController.getTechnicianDetails);

module.exports = router;
