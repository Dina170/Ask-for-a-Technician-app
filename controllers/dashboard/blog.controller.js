const Blog = require("../../models/blog");
const Job = require("../../models/job");

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    const { message, messageType } = req.query; 

    res.render("dashboard/blogs/index", { blogs, message, messageType });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect("/dashboard/blogs");
    res.render("dashboard/blogs/show", { blog });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};

const renderNewBlogForm = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.render("dashboard/blogs/form", { blog: null, jobs });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};

const createBlog = async (req, res) => {
  try {
    const { title, blog, description } = req.body;
    if (!title || !blog || !description) {
      return res.render("dashboard/blogs/form", {
        blog: null,
        error: "All fields are required",
      });
    }
    const newBlog = new Blog({
      title,
      blog,
      description,
    });
    await newBlog.save();
    res.redirect("/dashboard/blogs?message=تم إضافة مدونة بنجاح&messageType=add");
  } catch (err) {
    console.error(err);
    res.render("dashboard/blogs/form", {
      blog: null,
      error: "Failed to create blog",
    });
  }
};

const editBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect("/dashboard/blogs");
    res.render("dashboard/blogs/form", { blog });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};

const updateBlog = async (req, res) => {
  const { title, blog, description } = req.body;
  try {
    if (!title || !blog || !description) {
      return res.render("dashboard/blogs/form", {
        blog: { _id: req.params.id, title, blog, description },
        error: "All fields are required",
      });
    }
    const existingBlog = await Blog.findById(req.params.id);
    if (!existingBlog) return res.redirect("/dashboard/blogs");
    existingBlog.title = title;
    existingBlog.blog = blog;
    existingBlog.description = description;
    await existingBlog.save();
    res.redirect("/dashboard/blogs?message=تم تعديل المدونة بنجاح&messageType=edit");
  } catch (err) {
    console.error(err);
    res.render("dashboard/blogs/form", {
      blog: { _id: req.params.id, title, blog, description },
      error: "Failed to update blog",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard/blogs?message=تم حذف مدونة بنجاح&messageType=delete");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};

const deleteAllBlogs = async (req, res) => {
  try {
    await Blog.deleteMany({});
    res.redirect("/dashboard/blogs?message=تم حذف جميع المدونات بنجاح&messageType=delete");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};
module.exports = {
  renderNewBlogForm,
  createBlog,
  editBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  deleteAllBlogs,
};
