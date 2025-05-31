const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/neighborhoods" });

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

router.get("/", getAllNeighborhoods);
router.get("/new", newNeighborhood);
router.post("/", upload.single("neighborhoodPhoto"), createNeighborhood);
router.delete("/", deleteAllNeighborhoods);
router.get("/:id/edit", editNeighborhood);
router.get("/:id", getNeighborhoodById);
router.put("/:id", upload.single("neighborhoodPhoto"), updateNeighborhood);
router.delete("/:id", deleteNeighborhood);

module.exports = router;
