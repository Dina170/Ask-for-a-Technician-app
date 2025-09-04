const { Schema, model } = require("mongoose");

const PostSchema = new Schema({
  blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
  name: { type: String, required: true },
  permanentLink: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
});

module.exports = model("Post", PostSchema);
