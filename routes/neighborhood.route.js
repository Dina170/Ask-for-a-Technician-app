const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/neighborhoods" });

const {
  deleteAllNeighborhoods,
  deleteNeighborhood,
  editNeighborhood,
  updateNeighborhood,
  getAllNeighborhoods,
} = require("../controllers/Neighborhood.controller");

router.get("/", getAllNeighborhoods);
router.delete("/", deleteAllNeighborhoods);
router.delete("/:id", deleteNeighborhood);
router.get("/:id/edit", editNeighborhood);
router.put("/:id", upload.single("neighborhoodPhoto"), updateNeighborhood);

module.exports = router;
