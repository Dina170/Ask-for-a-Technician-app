const express = require("express");
const router = express.Router();
const homeController = require("../../controllers/public/home.controller");
const technicianController = require("../../controllers/public/technician.controller");

router.get("/", homeController.getHomePage);

router.get("/showMoreTechnicians", technicianController.getAllTechnicians);
router.get("/autocomplete", homeController.autocompleteTechnicians);
router.get("/blogs", homeController.getAllBlogs);
router.get("/blogs/:blog", homeController.getBlogPosts);
router.get("/posts/autocomplete", homeController.autocompletePosts);
router.get("/posts/:slug", homeController.getPostDetails);
router.get("/privacy-policy", homeController.getPrivacyPolicy);


module.exports = router;
