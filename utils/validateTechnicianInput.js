const Job = require("../models/job");

const validateTechnicianInput = async (body, file, isUpdate = false) => {
  const errors = [];

  // Validate job exists
  const job = await Job.findOne({ name: body.jobName });
  if (!job) {
    errors.push("Selected job is invalid");
  }

  // Validate at least one neighborhood selected
  if (!body.neighborhoodNames || 
      (Array.isArray(body.neighborhoodNames) && body.neighborhoodNames.length === 0)) {
    errors.push("At least one neighborhood must be selected");
  }


  // Other validations remain the same...
  if (!file && !isUpdate) errors.push("Technician photo is required");
  if (!body.mainTitle?.trim()) errors.push("Main title is required");
  if (!body.description?.trim()) errors.push("Description is required");
  if (body.phoneNumber && !/^(\+9665|05)[0-9]{8}$/.test(body.phoneNumber)) {
    errors.push("Invalid Saudi phone number");
  }

  return errors;
};

module.exports = validateTechnicianInput;