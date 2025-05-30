const mongoose = require("mongoose");
const TechnicianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  neighborhoodNames: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Neighborhood" },
  ],
  jobPhoto: { type: String, required: true },
  mainTitle: { type: String, required: true },
  description: { type: String, required: true },
  phoneNumber: {
    type: String,
    validate: {
      validator: (value) => /^05\d{8}$/.test(value), // Saudi number
      message: "Invalid Saudi phone number",
    },
  },
});
module.exports = mongoose.model("Technician", TechnicianSchema);
