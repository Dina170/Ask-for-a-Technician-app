const Job = require("../../models/job");
const Neighborhood = require("../../models/neighborhood");
const Technician = require("../../models/technician");
const { buildSearchQuery } = require("../../utils/searchFilters");

// Render form for creating new job
const renderNewJobForm = async (req, res) => {
  try {
    const neighborhoods = await Neighborhood.find();
    res.render("dashboard/jobs/form", { job: null, neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/jobs");
  }
};

// Create new job
const createJob = async (req, res) => {
  try {
    const { name, neighborhoodName, mainDescription, subDescription } =
      req.body;

    if (!name || !neighborhoodName || !mainDescription || !req.file) {
      const neighborhoods = await Neighborhood.find();
      return res.render("dashboard/jobs/form", {
        job: null,
        neighborhoods,
        error: "All fields are required including the job photo",
      });
    }

    const newJob = new Job({
      name,
      neighborhoodName,
      mainDescription,
      subDescription,
      jobPhoto: req.file.filename,
    });

    try {
      await newJob.save();
      res.redirect("/dashboard/jobs");
    } catch (err) {
      if (err.code === 11000) {
        const neighborhoods = await Neighborhood.find();
        return res.render("dashboard/jobs/form", {
          job: null,
          neighborhoods,
          error: "This job already exists in the selected neighborhood.",
        });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    const neighborhoods = await Neighborhood.find();
    res.render("dashboard/jobs/form", {
      job: null,
      neighborhoods,
      error: "Failed to create job",
    });
  }
};

// GET all jobs
const getAllJobs = async (req, res) => {
  try {

    const { search, neighborhood } = req.query;

    const query = buildSearchQuery({ search, neighborhood });

    const jobs = await Job.find(query).populate("neighborhoodName");
    const neighborhoods = await Neighborhood.find();

    const allJobNames = jobs.map(job => job.name);
    const uniqueJobNames = [...new Set(allJobNames)]; // unique names array

     // ✅ Extract unique neighborhood names
    const allNeighborhoodNames = neighborhoods.map(n => n.name);
    const uniqueNeighborhoodNames = [...new Set(allNeighborhoodNames)];

    res.render("dashboard/jobs/index", { jobs ,neighborhoods,
      filters: { search, neighborhood } , uniqueJobNames , uniqueNeighborhoodNames});
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

// GET job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("neighborhoodName");
    if (!job) {
      return res.redirect("/dashboard/jobs");
    }
    res.render("dashboard/jobs/show", { job });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/jobs");
  }
};

// GET edit job form
const renderEditJobForm = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("neighborhoodName");
    if (!job) {
      return res.redirect("/dashboard/jobs");
    }
    const neighborhoods = await Neighborhood.find();
    res.render("dashboard/jobs/form", { job, neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/jobs");
  }
};

// PUT update job
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.redirect("/dashboard/jobs");
    }

    job.name = req.body.name;
    job.neighborhoodName = req.body.neighborhoodName;
    job.mainDescription = req.body.mainDescription;
    job.subDescription = req.body.subDescription;

    if (req.file) {
      job.jobPhoto = req.file.filename;
    }

    try {
      await job.save();
      res.redirect("/dashboard/jobs");
    } catch (err) {
      if (err.code === 11000) {
        const neighborhoods = await Neighborhood.find();
        return res.render("dashboard/jobs/form", {
          job,
          neighborhoods,
          error:
            "A job with this name already exists in the selected neighborhood.",
        });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.redirect(`/dashboard/jobs/${req.params.id}/edit`);
  }
};

// DELETE single job
const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    await Technician.updateMany(
      { jobName: req.params.id },
      { $unset: { jobName: "" } }
    );
    res.redirect("/dashboard/jobs");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/jobs");
  }
};

// DELETE all jobs
const deleteAllJobs = async (req, res) => {
  try {
    await Job.deleteMany({});
    await Technician.updateMany({}, { $unset: { jobName: "" } });
    res.redirect("/dashboard/jobs");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/jobs");
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
