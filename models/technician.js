const mongoose = require("mongoose");
// Saudi phone number validation function
function validateSaudiPhoneNumber(phoneNumber) {
    // Remove all spaces, dashes, and parentheses
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Saudi phone number patterns
    const patterns = [
        /^(\+966|966)?[0-9]{9}$/, // International format
        /^0[0-9]{9}$/, // Local format starting with 0
        /^[1-9][0-9]{8}$/ // Without leading 0 or country code
    ];

    // Check if number matches any valid pattern
    return patterns.some(pattern => pattern.test(cleanNumber));
}

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
        required: true,
        validate: {
            validator: function(v) {
                return validateSaudiPhoneNumber(v);
            },
            message: 'Please provide a valid Saudi phone number (e.g., +966501234567, 0501234567)'
        }
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
