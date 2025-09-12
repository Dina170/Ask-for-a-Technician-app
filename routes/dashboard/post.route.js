const router = require("express").Router();
const multer = require("multer");
const { storage } = require("../../config/cloudinary");
const upload = multer({ storage });
const {
  getAllPosts,
  getPostById,
  renderNewPostForm,
  createPost,
  editPost,
  updatePost,
  deletePost,
  deleteAllPosts,
} = require("../../controllers/dashboard/post.controller");

// Image upload endpoint
router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    const filePath = req.file.path; // Cloudinary URL
    res.json({ success: true, url: filePath });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Image upload failed" });
  }
});

router.get("/", getAllPosts);
router.get("/new", renderNewPostForm);
router.post("/", createPost);
router.get("/:id", getPostById);
router.get("/:id/edit", editPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.delete("/", deleteAllPosts);

module.exports = router;
