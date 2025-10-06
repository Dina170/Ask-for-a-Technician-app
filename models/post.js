const { Schema, model } = require("mongoose");

const PostSchema = new Schema({
  blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
  name: { type: String, required: true },
  permaLink: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
});

PostSchema.pre("save", function (next) {
  if (this.isModified("permaLink")) {
    this.permaLink = this.permaLink.trim().replace(/\s+/g, "-");
  }

  next();
});

module.exports = model("Post", PostSchema);
