// const { Schema, model } = require("mongoose");
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlogSchema = new Schema({
  blog: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

BlogSchema.pre("save", function (next) {
  if (this.isModified("blog")) {
    this.slug = this.blog.trim().replace(/\s+/g, "-");
  }

  next();
});

// module.exports = model("Blog", BlogSchema);
module.exports = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);