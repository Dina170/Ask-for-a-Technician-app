const router = require("express").Router();
const {
  renderNewBlogForm,
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  deleteAllBlogs,
  editBlog,
} = require("../../controllers/dashboard/blog.controller");
const isAdmin = require("../../middlewares/isAdmin");

router.use(isAdmin);

router.get("/new", renderNewBlogForm);
router.get("/", getAllBlogs);
router.post("/", createBlog);
router.get("/:id/edit", editBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);
router.delete("/", deleteAllBlogs);
router.get("/:id", getBlogById);

module.exports = router;
