const express = require("express");
const router = express.Router();
const homeController = require("../../controllers/public/home.controller");

router.get("/", homeController.getHomePage);

module.exports = router;

