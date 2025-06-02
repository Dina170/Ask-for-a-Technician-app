const mongoose = require("mongoose");

const NeighborhoodSchema = new mongoose.Schema({
  name: { type: String, required: true ,unique : true},
  neighborhoodPhoto: { type: String, required: true },
});
module.exports = mongoose.model("Neighborhood", NeighborhoodSchema);
