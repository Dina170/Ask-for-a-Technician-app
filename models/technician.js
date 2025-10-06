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

TechnicianSchema.pre("save", async function (next) {
  if (this.isModified("jobName") || !this.slug) {
    try {
      const Job = mongoose.model("Job");
      const job = await Job.findById(this.jobName);

      if (job && job.name) {
        this.slug = job.name.trim().replace(/\s+/g, "-");
      }
    } catch (err) {
      console.error("Error generating slug from jobName:", err);
    }
  }
  next();
});

module.exports = mongoose.model("Technician", TechnicianSchema);
