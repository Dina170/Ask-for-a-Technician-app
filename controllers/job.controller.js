const Job = require("../models/job");
const Neighborhood = require("../models/neighborhood");

// Render form for creating new job
const renderNewJobForm = async (req, res) => {
  try {
    const neighborhoods = await Neighborhood.find();
    res.render("jobs/form", { job: null, neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/jobs");
  }
};

// Create new job
const createJob = async (req, res) => {
  try {
    const { name, neighborhoodName, mainDescription, subDescription } =
      req.body;
    const jobPhoto = req.file ? req.file.filename : null;

    const newJob = new Job({
      name,
      neighborhoodName,
      mainDescription,
      subDescription,
      jobPhoto,
    });

    await newJob.save();
    res.redirect("/jobs");
  } catch (err) {
    console.error(err);
    res.redirect("/jobs/new");
  }
};

// GET all jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("neighborhoodName");
    res.render("jobs/index", { jobs });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

// GET job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("neighborhoodName");
    res.render("jobs/show", { job });
  } catch (err) {
    console.error(err);
    res.redirect("/jobs");
  }
};

// GET edit job form
const renderEditJobForm = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("neighborhoodName");
    const neighborhoods = await Neighborhood.find();
    res.render("jobs/form", { job, neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/jobs");
  }
};

// PUT update job
const updateJob = async (req, res) => {
  try {
    const { name, neighborhoodName, mainDescription, subDescription } =
      req.body;
    const update = { name, neighborhoodName, mainDescription, subDescription };
    if (req.file) update.jobPhoto = req.file.filename;

    await Job.findByIdAndUpdate(req.params.id, update, { new: true });

    res.redirect("/jobs");
  } catch (err) {
    console.error(err);
    res.redirect(`/jobs/${req.params.id}/edit`);
  }
};

// DELETE single job
const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect("/jobs");
  } catch (err) {
    console.error(err);
    res.redirect("/jobs");
  }
};

// DELETE all jobs
const deleteAllJobs = async (req, res) => {
  try {
    await Job.deleteMany({});
    res.redirect("/jobs");
  } catch (err) {
    console.error(err);
    res.redirect("/jobs");
  }
};

module.exports = {
  getAllJobs,
  renderNewJobForm,
  createJob,
  renderEditJobForm,
  updateJob,
  deleteJob,
  deleteAllJobs,
  getJobById,
};
