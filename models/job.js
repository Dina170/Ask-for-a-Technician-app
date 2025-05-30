const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  neighborhoodNames: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Neighborhood" },
  ],
  jobPhoto: { type: String, required: true },
  mainDescription: { type: String, required: true },
  subDescription: { type: String },
});
module.exports = mongoose.model("Job", JobSchema);
