const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  neighborhoodName:
    { type: mongoose.Schema.Types.ObjectId, ref: "Neighborhood",required: true  },
  jobPhoto: { type: String, required: true },
  mainDescription: { type: String, required: true },
  subDescription: { type: String },
});

// Prevent duplicate job name in the same neighborhood
JobSchema.index({ name: 1, neighborhoodName: 1 }, { unique: true });

module.exports = mongoose.model("Job", JobSchema);
