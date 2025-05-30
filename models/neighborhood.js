const mongoose = require("mongoose");

const NeighborhoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  neighborhoodPhoto: { type: String, required: true },
  jobPhoto: { type: String }, // optional
  mainDescription: { type: String, required: true },
  subDescription: { type: String },
});
module.exports = mongoose.model("Neighborhood", NeighborhoodSchema);
