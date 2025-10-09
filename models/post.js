const { Schema, model } = require("mongoose");

const PostSchema = new Schema({
  blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  permaLink: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
});

PostSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.trim().replace(/\s+/g, "-");
  }

  next();
});

module.exports = model("Post", PostSchema);
