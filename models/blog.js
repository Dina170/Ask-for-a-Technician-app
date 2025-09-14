const { Schema, model } = require("mongoose");

const BlogSchema = new Schema({
  blog: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = model("Blog", BlogSchema);
