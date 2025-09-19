const fs = require("fs");
const path = require("path");
const { cloudinary } = require("../../config/cloudinary");

const Post = require("../../models/post");
const Blog = require("../../models/blog");

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("blog");
    const { message, messageType } = req.query;
    res.render("dashboard/posts/index", { posts, message, messageType });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
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
    const { blog, name, permaLink, title, content } = req.body;

    // Validate permaLink
    if (!permaLink || !permaLink.trim()) {
      const blogs = await Blog.find();
      return res.render("dashboard/posts/form", {
        post: null,
        blogs,
        error: "Permanent Link is required",
      });
    }

    if (!blog || !name || !title || !content) {
      const blogs = await Blog.find();
      return res.render("dashboard/posts/form", {
        post: null,
        blogs,
        error: "All fields are required",
      });
    }

    const newPost = new Post({
      blog,
      name,
      permaLink: permaLink.trim(),
      title,
      content,
    });
    await newPost.save();
    res.redirect(
      "/dashboard/posts?message=تم إضافة مدونة بنجاح&messageType=add"
    );
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      err.message = "الرابط الدائم يجب أن يكون فريدًا";
    }
    const blogs = await Blog.find();
    res.render("dashboard/posts/form", {
      post: null,
      blogs,
      error: err.message || "حصل خطأ أثناء إنشاء المدونة",
    });
  }
};

const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("blog");
    console.log(post);

    if (!post) return res.redirect("/dashboard/posts");
    const blogs = await Blog.find();
    res.render("dashboard/posts/form", { post, blogs });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

const updatePost = async (req, res) => {
  const { blog, name, permaLink, title, content } = req.body;
  try {
    // Validate permaLink
    if (!permaLink || !permaLink.trim()) {
      const blogs = await Blog.find();
      return res.render("dashboard/posts/form", {
        post: { _id: req.params.id, blog, name, permaLink, title, content },
        blogs,
        error: "Permanent Link is required",
      });
    }

    if (!blog || !name || !title || !content) {
      const blogs = await Blog.find();
      return res.render("dashboard/posts/form", {
        post: { _id: req.params.id, blog, name, permaLink, title, content },
        blogs,
        error: "All fields are required",
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect("/dashboard/posts");

    post.blog = blog;
    post.name = name;
    post.permaLink = permaLink.trim();
    post.title = title;
    post.content = content;
    await post.save();
    res.redirect(
      "/dashboard/posts?message=تم تعديل المدونة بنجاح&messageType=edit"
    );
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      err.message = "الرابط الدائم يجب أن يكون فريدًا";
    }
    const blogs = await Blog.find();
    const post = await Post.findById(req.params.id).populate("blog");
    if (!post) return res.redirect("/dashboard/posts");
    res.render("dashboard/posts/form", {
      post,
      blogs,
      error: err.message || "Failed to create post",
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
    res.redirect(
      "/dashboard/posts?message=تم حذف مدونة بنجاح&messageType=delete"
    );
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
    res.redirect(
      "/dashboard/posts?message=تم حذف جميع المدونات بنجاح&messageType=delete"
    );
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
};

function deleteImg(post) {
  const imageUrls = post.content.match(/<img src="([^"]+)"/g) || [];
  imageUrls.forEach((imgTag) => {
    const imageUrl = imgTag.match(/src="([^"]+)"/)[1];
    const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0]; // Extract public ID
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) console.error("Failed to delete image from Cloudinary:", err);
    });
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
