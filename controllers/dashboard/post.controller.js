const fs = require("fs");
const path = require("path");

const Post = require("../../models/post");
const Blog = require("../../models/blog");

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("blog");
    res.render("dashboard/posts/index", { posts });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("blog");
    if (!post) return res.redirect("/dashboard/posts");
    res.render("dashboard/posts/show", { post });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

const renderNewPostForm = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.render("dashboard/posts/form", { post: null, blogs });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

const createPost = async (req, res) => {
  try {
    const { blog, name, permanentLink, title, content } = req.body;
    if (!blog || !name || !permanentLink || !title || !content) {
      const blogs = await Blog.find();
      return res.render("dashboard/posts/form", {
        post: null,
        blogs,
        error: "All fields are required",
      });
    }
    const newPost = new Post({ blog, name, permanentLink, title, content });
    await newPost.save();
    res.redirect("/dashboard/posts");
  } catch (err) {
    console.error(err);
    const blogs = await Blog.find();
    res.render("dashboard/posts/form", {
      post: null,
      blogs,
      error: "Failed to create post",
    });
  }
};

const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect("/dashboard/posts");
    const blogs = await Blog.find();
    res.render("dashboard/posts/form", { post, blogs });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

const updatePost = async (req, res) => {
  const { blog, name, permanentLink, title, content } = req.body;
  try {
    if (!blog || !name || !permanentLink || !title || !content) {
      const blogs = await Blog.find();
      return res.render("dashboard/posts/form", {
        post: { _id: req.params.id, blog, name, permanentLink, title, content },
        blogs,
        error: "All fields are required",
      });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect("/dashboard/posts");
    post.blog = blog;
    post.name = name;
    post.permanentLink = permanentLink;
    post.title = title;
    post.content = content;
    await post.save();
    res.redirect("/dashboard/posts");
  } catch (err) {
    console.error(err);
    const blogs = await Blog.find();
    res.render("dashboard/posts/form", {
      post: { _id: req.params.id, blog, name, permanentLink, title, content },
      blogs,
      error: "Failed to update post",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect("/dashboard/posts");

    // Extract image URLs from the content and delete them
    deleteImg(post);

    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard/posts");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

const deleteAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();

    // Delete all images associated with all posts
    posts.forEach((post) => {
      deleteImg(post);
    });

    await Post.deleteMany({});
    res.redirect("/dashboard/posts");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

function deleteImg(post) {
  const imageUrls = post.content.match(/<img src="([^"]+)"/g) || [];
  imageUrls.forEach((imgTag) => {
    const imagePath = imgTag.match(/src="([^"]+)"/)[1];
    const fullPath = path.join(__dirname, "../..", imagePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
}

module.exports = {
  getAllPosts,
  getPostById,
  renderNewPostForm,
  createPost,
  editPost,
  updatePost,
  deletePost,
  deleteAllPosts,
};
