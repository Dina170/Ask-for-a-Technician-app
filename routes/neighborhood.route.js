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
  newNeighborhood
} = require("../controllers/Neighborhood.controller");

router.get("/", getAllNeighborhoods);
router.get("/new", newNeighborhood);
router.post("/", upload.single("neighborhoodPhoto"), createNeighborhood);
router.delete("/", deleteAllNeighborhoods);
router.delete("/:id", deleteNeighborhood);
router.get("/:id/edit", editNeighborhood);
router.put("/:id", upload.single("neighborhoodPhoto"), updateNeighborhood);
router.get("/:id", getNeighborhoodById);

module.exports = router;
