const router = require("express").Router();
const multer = require("multer");
const { storage } = require("../../config/cloudinary");
const upload = multer({ storage });

const {
  getNeighborhoodById,
  createNeighborhood,
  deleteAllNeighborhoods,
  deleteNeighborhood,
  editNeighborhood,
  updateNeighborhood,
  getAllNeighborhoods,
  newNeighborhood,
} = require("../../controllers/dashboard/neighborhood.controller");
const isAdmin = require("../../middlewares/isAdmin");

router.get("/", getAllNeighborhoods);
router.get("/new", newNeighborhood);
router.post("/", upload.single("neighborhoodPhoto"), createNeighborhood);
router.delete("/", deleteAllNeighborhoods);
router.get("/:id/edit", editNeighborhood);
router.get("/:id", getNeighborhoodById);
router.put("/:id", upload.single("neighborhoodPhoto"), updateNeighborhood);
router.delete("/:id", deleteNeighborhood);

// router.get("/", isAdmin, getAllNeighborhoods);
// router.get("/new", isAdmin, newNeighborhood);
// router.post(
//   "/",
//   isAdmin,
//   upload.single("neighborhoodPhoto"),
//   createNeighborhood
// );
// router.delete("/", isAdmin, deleteAllNeighborhoods);
// router.get("/:id/edit", isAdmin, editNeighborhood);
// router.get("/:id", isAdmin, getNeighborhoodById);
// router.put(
//   "/:id",
//   isAdmin,
//   upload.single("neighborhoodPhoto"),
//   updateNeighborhood
// );
// router.delete("/:id", isAdmin, deleteNeighborhood);

module.exports = router;
