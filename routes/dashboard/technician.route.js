const router = require("express").Router();
const multer = require("multer");
const { storage } = require("../../config/cloudinary");
const upload = multer({ storage });

const {
  getTechnicianById,
  createTechnician,
  deleteAllTechnicians,
  deleteTechnician,
  editTechnician,
  updateTechnician,
  getAllTechnicians,
  newTechnician,
} = require("../../controllers/dashboard/technician.controller");
const isAdmin = require("../../middlewares/isAdmin");

router.get("/", getAllTechnicians);
router.get("/new", newTechnician);
router.post("/", upload.single("jobTechnicianPhoto"), createTechnician);
router.delete("/", deleteAllTechnicians);
router.get("/:id/edit", editTechnician);
router.get("/:id", getTechnicianById);
router.put("/:id", upload.single("jobTechnicianPhoto"), updateTechnician);
router.delete("/:id", deleteTechnician);

module.exports = router;
