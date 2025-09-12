const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const Technician = require("../../models/technician");
const { buildSearchQuery } = require("../../utils/searchFilters");
const validateTechnicianInput = require("../../utils/validateTechnicianInput");

// Get all technicians
const getAllTechnicians = async (req, res) => {
  try {
    const { search } = req.query;

    const query = buildSearchQuery(
      { search, neighborhood: null },
      "mainTitle",
      false
    );

    const technicians = await Technician.find(query)
      .populate("jobName")
      .populate("neighborhoodNames");
    const message = req.query.message || "";
    const messageType = req.query.messageType || "";

    res.render("dashboard/technicians/index", {
      technicians,
      filters: { search },
      message,
      messageType,
    });
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

// Helper function to get job neighborhood map
const getJobNeighborhoodMap = async () => {
  const jobsWithNeighborhoods = await Job.find().populate("neighborhoodName");
  const jobNeighborhoodMap = {};

  jobsWithNeighborhoods.forEach((job) => {
    if (!jobNeighborhoodMap[job.name]) {
      jobNeighborhoodMap[job.name] = [];
    }
    if (job.neighborhoodName) {
      jobNeighborhoodMap[job.name].push(job.neighborhoodName);
    }
  });

  return jobNeighborhoodMap;
};

// Render new technician form
const newTechnician = async (req, res) => {
  try {
    const jobNames = await Job.distinct("name");
    const jobNeighborhoodMap = await getJobNeighborhoodMap();

    res.render("dashboard/technicians/form", {
      technician: null,
      jobNames,
      neighborhoods: [], // Empty initially, will be populated by JS
      jobNeighborhoodMap: JSON.stringify(jobNeighborhoodMap),
      errors: [], // pass empty array instead of null
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Create a new technician
const createTechnician = async (req, res) => {
  try {
    const errors = await validateTechnicianInput(req.body, req.file);

    if (errors.length > 0) {
      const jobNames = await Job.distinct("name");
      const jobNeighborhoodMap = await getJobNeighborhoodMap();

      return res.render("dashboard/technicians/form", {
        technician: null,
        jobNames,
        neighborhoods: [], // could pass empty or related neighborhoods
        jobNeighborhoodMap: JSON.stringify(jobNeighborhoodMap),
        errors, // pass as array
      });
    }

    const job = await Job.findOne({ name: req.body.jobName });
    if (!job) {
      throw new Error("Job not found");
    }

    const technician = new Technician({
      jobName: job._id,
      neighborhoodNames: Array.isArray(req.body.neighborhoodNames)
        ? req.body.neighborhoodNames
        : [req.body.neighborhoodNames],
      mainTitle: req.body.mainTitle,
      description: req.body.description,
      phoneNumber: req.body.phoneNumber,
      jobTechnicianPhoto: req.file.path,
    });

    await technician.save();
    res.redirect(
      "/dashboard/technicians?message=تم إضافة فنى بنجاح&messageType=add"
    );
  } catch (err) {
    console.error(err);
    const jobNames = await Job.distinct("name");
    const jobNeighborhoodMap = await getJobNeighborhoodMap();

    res.render("dashboard/technicians/form", {
      technician: null,
      jobNames,
      neighborhoods: [],
      jobNeighborhoodMap: JSON.stringify(jobNeighborhoodMap),
      errors: [err.message], // wrap string in array
    });
  }
};

// Render edit technician form
const editTechnician = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate("jobName")
      .populate("neighborhoodNames");

    if (!technician) {
      return res.redirect("/dashboard/technicians");
    }

    const jobNames = await Job.distinct("name");
    const jobNeighborhoodMap = await getJobNeighborhoodMap();
    const allNeighborhoods = await Neighborhood.find();
    const selectedNeighborhoodIds = technician.neighborhoodNames.map((n) =>
      n._id.toString()
    );

    res.render("dashboard/technicians/form", {
      technician,
      jobNames,
      neighborhoods: allNeighborhoods,
      jobNeighborhoodMap: JSON.stringify(jobNeighborhoodMap),
      selectedNeighborhoodIds: JSON.stringify(selectedNeighborhoodIds),
      errors: [], // empty array if no errors
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

const updateTechnician = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.redirect("/dashboard/technicians");
    }

    const errors = await validateTechnicianInput(req.body, req.file, true);

    if (errors.length > 0) {
      const jobNames = await Job.distinct("name");
      const jobNeighborhoodMap = await getJobNeighborhoodMap();
      const allNeighborhoods = await Neighborhood.find();

      // Populate technician with form data to re-render with errors
      technician.jobName = req.body.jobName;
      technician.neighborhoodNames = Array.isArray(req.body.neighborhoodNames)
        ? req.body.neighborhoodNames
        : [req.body.neighborhoodNames];
      technician.mainTitle = req.body.mainTitle;
      technician.description = req.body.description;
      technician.phoneNumber = req.body.phoneNumber;

      return res.render("dashboard/technicians/form", {
        technician,
        jobNames,
        neighborhoods: allNeighborhoods,
        jobNeighborhoodMap: JSON.stringify(jobNeighborhoodMap),
        errors, // pass as array
      });
    }

    const job = await Job.findOne({ name: req.body.jobName });
    if (!job) throw new Error("Job not found");

    technician.jobName = job._id;
    technician.neighborhoodNames = Array.isArray(req.body.neighborhoodNames)
      ? req.body.neighborhoodNames
      : [req.body.neighborhoodNames];
    technician.mainTitle = req.body.mainTitle;
    technician.description = req.body.description;
    technician.phoneNumber = req.body.phoneNumber;

    if (req.file) {
      technician.jobTechnicianPhoto = req.file.path;
    }

    await technician.save();
    res.redirect(
      "/dashboard/technicians?message=تم تعديل فنى بنجاح&messageType=edit"
    );
  } catch (err) {
    console.error(err);

    const jobNames = await Job.distinct("name");
    const jobNeighborhoodMap = await getJobNeighborhoodMap();
    const allNeighborhoods = await Neighborhood.find();

    res.render("dashboard/technicians/form", {
      technician: null,
      jobNames,
      neighborhoods: allNeighborhoods,
      jobNeighborhoodMap: JSON.stringify(jobNeighborhoodMap),
      errors: [err.message || "An error occurred while updating technician"],
    });
  }
};

// Delete all technicians
const deleteAllTechnicians = async (req, res) => {
  try {
    await Technician.deleteMany({});
    res.redirect(
      "/dashboard/technicians?message=تم حذف جميع الفنيين بنجاح&messageType=delete"
    );
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
  }
};

// Delete single technician
const deleteTechnician = async (req, res) => {
  try {
    await Technician.findByIdAndDelete(req.params.id);
    res.redirect(
      "/dashboard/technicians?message=تم حذف فنى بنجاح&messageType=delete"
    );
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/technicians");
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
