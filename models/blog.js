const { Schema, model } = require("mongoose");
const job = require("./job");

const BlogSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = model("Blog", BlogSchema);
