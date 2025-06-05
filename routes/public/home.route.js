const express = require("express");
const router = express.Router();
const homeController = require("../../controllers/public/home.controller");
const technicianController = require("../../controllers/public/technician.controller");

router.get("/", homeController.getHomePage);

// Technicians page with search
router.get("/showMoreTechnicians", technicianController.getAllTechnicians);
router.get("/autocomplete", homeController.autocompleteTechnicians);

module.exports = router;

