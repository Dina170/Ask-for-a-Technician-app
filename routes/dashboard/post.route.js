const router = require("express").Router();
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

router.get("/", getAllPosts);
router.get("/new", renderNewPostForm);
router.post("/", createPost);
router.get("/:id", getPostById);
router.get("/:id/edit", editPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.delete("/", deleteAllPosts);

module.exports = router;
