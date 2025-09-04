const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

// Configure multer for image uploads
const upload = multer({
  dest: "uploads/posts",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    }
    cb("Error: Images only!");
  },
});

// Image upload endpoint
router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    const filePath = `/uploads/posts/${req.file.filename}`;
    res.json({ success: true, url: filePath });
  } catch (err) {
    console.error(err);
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
