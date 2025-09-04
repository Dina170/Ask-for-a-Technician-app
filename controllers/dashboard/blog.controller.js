const Blog = require("../../models/blog");
const Job = require("../../models/job");

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("job");
    res.render("dashboard/blogs/index", { blogs });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("job");
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
    const { title, jobId, description } = req.body;
    if (!title || !jobId || !description) {
      const jobs = await Job.find();
      return res.render("dashboard/blogs/form", {
        blog: null,
        jobs,
        error: "All fields are required",
      });
    }
    const newBlog = new Blog({
      title,
      job: jobId,
      description,
    });
    await newBlog.save();
    res.redirect("/dashboard/blogs");
  } catch (err) {
    console.error(err);
    const jobs = await Job.find();
    res.render("dashboard/blogs/form", {
      blog: null,
      jobs,
      error: "Failed to create blog",
    });
  }
};

const editBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect("/dashboard/blogs");
    const jobs = await Job.find();
    res.render("dashboard/blogs/form", { blog, jobs });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};

const updateBlog = async (req, res) => {
  const { title, jobId, description } = req.body;
  try {
    if (!title || !jobId || !description) {
      const jobs = await Job.find();
      return res.render("dashboard/blogs/form", {
        blog: { _id: req.params.id, title, job: jobId, description },
        jobs,
        error: "All fields are required",
      });
    }
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect("/dashboard/blogs");
    blog.title = title;
    blog.job = jobId;
    blog.description = description;
    await blog.save();
    res.redirect("/dashboard/blogs");
  } catch (err) {
    console.error(err);
    const jobs = await Job.find();
    res.render("dashboard/blogs/form", {
      blog: { _id: req.params.id, title, job: jobId, description },
      jobs,
      error: "Failed to update blog",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard/blogs");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/blogs");
  }
};

const deleteAllBlogs = async (req, res) => {
  try {
    await Blog.deleteMany({});
    res.redirect("/dashboard/blogs");
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
