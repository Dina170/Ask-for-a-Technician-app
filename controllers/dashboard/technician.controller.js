const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const Technician = require("../../models/technician");

// Get all technicians
const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find()
      .populate("jobName")
      .populate("neighborhoodNames");
    res.render("dashboard/technicians/index", { technicians });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Get technician by ID
const getTechnicianById = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate("jobName")
      .populate("neighborhoodNames");
    
    if (!technician) {
      return res.redirect("/dashboard/technicians");
    }
    
    res.render("dashboard/technicians/show", { technician });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Render new technician form
const newTechnician = async (req, res) => {
  try {
    const jobs = await Job.find();
    const neighborhoods = await Neighborhood.find();
    res.render("dashboard/technicians/form", { 
      technician: null, 
      jobs, 
      neighborhoods,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Create a new technician
const createTechnician = async (req, res) => {
  try {
    const { jobName, neighborhoodNames, mainTitle, description, phoneNumber } = req.body;
    
    // Validate required fields
    if (!jobName || !mainTitle || !phoneNumber || !req.file) {
      const jobs = await Job.find();
      const neighborhoods = await Neighborhood.find();
      return res.render("dashboard/technicians/form", {
        technician: null,
        jobs,
        neighborhoods,
        error: "Job, title, phone number and photo are required"
      });
    }

    const technician = new Technician({
      jobName,
      neighborhoodNames: Array.isArray(neighborhoodNames) ? neighborhoodNames : [neighborhoodNames],
      mainTitle,
      description,
      phoneNumber,
      jobTechnicianPhoto: req.file.filename
    });

    await technician.save();
    res.redirect("/dashboard/technicians");
  } catch (err) {
    console.error(err);
    const jobs = await Job.find();
    const neighborhoods = await Neighborhood.find();
    res.render("dashboard/technicians/form", {
      technician: null,
      jobs,
      neighborhoods,
      error: "Failed to create technician"
    });
  }
};

// Delete all technicians
const deleteAllTechnicians = async (req, res) => {
  try {
    await Technician.deleteMany({});
    res.redirect("/dashboard/technicians");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Delete single technician
const deleteTechnician = async (req, res) => {
  try {
    await Technician.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard/technicians");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Render edit technician form
const editTechnician = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    const jobs = await Job.find();
    const neighborhoods = await Neighborhood.find();
    
    if (!technician) {
      return res.redirect("/dashboard/technicians");
    }
    
    res.render("dashboard/technicians/form", { 
      technician, 
      jobs, 
      neighborhoods,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Update technician
const updateTechnician = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.redirect("/dashboard/technicians");
    }

    technician.jobName = req.body.jobName;
    technician.neighborhoodNames = Array.isArray(req.body.neighborhoodNames) 
      ? req.body.neighborhoodNames 
      : [req.body.neighborhoodNames];
    technician.mainTitle = req.body.mainTitle;
    technician.description = req.body.description;
    technician.phoneNumber = req.body.phoneNumber;
    
    if (req.file) {
      technician.jobTechnicianPhoto = req.file.filename;
    }

    await technician.save();
    res.redirect("/dashboard/technicians");
  } catch (err) {
    console.error(err);
    res.redirect(`/dashboard/technicians/${req.params.id}/edit`);
  }
};

module.exports = {
  deleteAllTechnicians,
  deleteTechnician,
  editTechnician,
  updateTechnician,
  getAllTechnicians,
  createTechnician,
  getTechnicianById,
  newTechnician,
};
