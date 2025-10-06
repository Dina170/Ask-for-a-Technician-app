const mongoose = require("mongoose");
const TechnicianSchema = new mongoose.Schema({
  jobName: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true }, // dropdown
  neighborhoodNames: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood",
      required: true,
    }, // only neighborhoods that contain this job
  ],
  jobTechnicianPhoto: { type: String, required: true },
  mainTitle: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  phoneNumber: {
    type: String,
    validate: {
      validator: (value) => /^(\+9665|05)[0-9]{8}$/.test(value), // Saudi number
      message: "Invalid Saudi phone number",
    },
  },
});

TechnicianSchema.pre("save", function (next) {
  if (this.isModified("mainTitle")) {
    this.slug = this.mainTitle.trim().replace(/\s+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Technician", TechnicianSchema);
