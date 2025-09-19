const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/technicians" });

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
router.get("/public/technicianDetails/:id", getTechnicianById);
// router.get("/", isAdmin, getAllTechnicians);
// router.get("/new", isAdmin, newTechnician);
// router.post(
//   "/",
//   isAdmin,
//   upload.single("jobTechnicianPhoto"),
//   createTechnician
// );
// router.delete("/", isAdmin, deleteAllTechnicians);
// router.get("/:id/edit", isAdmin, editTechnician);
// router.get("/:id", isAdmin, getTechnicianById);
// router.put(
//   "/:id",
//   isAdmin,
//   upload.single("jobTechnicianPhoto"),
//   updateTechnician
// );
// router.delete("/:id", isAdmin, deleteTechnician);

module.exports = router;
