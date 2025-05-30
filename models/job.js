const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  neighborhoodName:
    { type: mongoose.Schema.Types.ObjectId, ref: "Neighborhood",required: true  },
  jobPhoto: { type: String, required: true },
  mainDescription: { type: String, required: true },
  subDescription: { type: String },
});
module.exports = mongoose.model("Job", JobSchema);
