const Neighborhood = require("../models/neighborhood");
const Job = require("../models/job");
const Technician = require("../models/technician");

// Get all technicians
const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().populate("jobName")
  .populate("neighborhoodNames");;
    console.log(technicians)
    res.render("technicians/index", { technicians });
  } catch (err) {
    console.error(err);
    res.redirect("/technicians");
  }
};

// Get technician by ID
const getTechnicianById = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id).populate("jobName")
  .populate("neighborhoodNames");
    if (!technician) {
      return res.status(404).send("Technician not found");
    }
    res.render("technicians/show", { technician });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const newTechnician = async (req, res) => {
  try {
    const jobs = await Job.find();
    const neighborhoods = await Neighborhood.find();
    res.render("technicians/form", { technician: null, jobs, neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/technicians");
  }
};

// Create a new technician
const createTechnician = async (req, res) => {
  try {
    const { jobName, neighborhoodNames, mainTitle, description, phoneNumber } =
      req.body;
    const technician = new Technician({
      jobName,
      neighborhoodNames,
      mainTitle,
      description,
      phoneNumber,
      jobTechnicianPhoto: req.file ? req.file.filename : null,
    });
    await technician.save();
    res.redirect("/technicians");
  } catch (err) {
    console.error(err);
    res.redirect("/technicians");
  }
};

const deleteAllTechnicians = async (req, res) => {
  await Technician.deleteMany({});
  res.redirect("/technicians");
};

const deleteTechnician = async (req, res) => {
  await Technician.findByIdAndDelete(req.params.id);
  res.redirect("/technicians");
};

const editTechnician = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    const jobs = await Job.find();
    const neighborhoods = await Neighborhood.find();
    res.render("technicians/form", { technician, jobs, neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/technicians");
  }
};

const updateTechnician = async (req, res) => {
  try {
    const { jobName, neighborhoodNames, mainTitle, description, phoneNumber } =
      req.body;
    const update = {
      jobName,
      neighborhoodNames,
      mainTitle,
      description,
      phoneNumber,
    };

    if (req.file) update.jobTechnicianPhoto = req.file.filename;

    await Technician.findByIdAndUpdate(req.params.id, update, { new: true });
    res.redirect("/technicians");
  } catch (err) {
    console.error(err);
    res.redirect("/technicians");
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
