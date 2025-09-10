const Blog = require("../models/blog");

async function loadBlogs(req, res, next) {
  try {
    const blogs = await Blog.find();
    res.locals.blogs = blogs; 
    next();
  } catch (err) {
    console.error(err);
    res.locals.blogs = [];
    next();
  }
}

module.exports = loadBlogs;
