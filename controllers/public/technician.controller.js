const Technician = require("../../models/technician");
const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const mongoose = require("mongoose");

exports.getTechnicianNeighborhoods = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id)
      .populate("jobName")
      .populate("neighborhoodNames");

    if (!tech) return res.status(404).send("Technician not found");

    const neighborhoodsWithJobs = await Promise.all(
      tech.neighborhoodNames.map(async (neigh) => {
        const job = await Job.findOne({
          name: tech.jobName.name,
          neighborhoodName: neigh._id,
        });
        return {
          neighborhood: neigh,
          job: job || null,
        };
      })
    );

    res.render("public/technicianNeighborhoods", {
      technician: tech,
      neighborhoodsWithJobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

exports.getNeighborhoodDetails = async (req, res) => {
  try {
    const { techId, neighId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(techId) ||
      !mongoose.Types.ObjectId.isValid(neighId)
    ) {
      return res.status(400).send("Invalid Technician or Neighborhood ID");
    }

    const technician = await Technician.findById(techId).populate("jobName");
    if (!technician) return res.status(404).send("Technician not found");

    const neighborhood = await Neighborhood.findById(neighId);
    if (!neighborhood) return res.status(404).send("Neighborhood not found");

    const job = await Job.findOne({
      name: technician.jobName.name,
      neighborhoodName: neighborhood._id,
    });

    if (!job)
      return res.status(404).send("Job not found for this neighborhood");

    res.render("public/neighborhoodDetails", {
      technician,
      neighborhood,
      job,
      type: "technicians",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

exports.getTechnicianDetails = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.techId)
      .populate("jobName")
      .populate("neighborhoodNames");

    if (!technician) return res.status(404).send("Technician not found");

    const job = technician.jobName || null;

    res.render("public/technicianDetails", { technician, job });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllTechnicians = async (req, res) => {
  try {
    const search = req.query.search || "";

    const query = {};
    if (search.trim()) {
      query.mainTitle = { $regex: search.trim(), $options: "i" };
    }

    const technicians = await Technician.find(query).populate(
      "jobName neighborhoodNames"
    );

    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      const suggestions = technicians.map((tech) => ({
        id: tech._id,
        name: tech.mainTitle,
      }));
      return res.json(suggestions);
    }

    res.render("public/showMoreTechnicians", {
      technicians,
      search,
      type: "technicians",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getSeeMoreTechnicianNeighborhoods = async (req, res) => {
  try {
    const technicianId = req.params.techId;
    const searchQuery = req.query.search?.trim().toLowerCase() || "";

    const tech = await Technician.findById(technicianId)
      .populate("jobName")
      .populate("neighborhoodNames");

    if (!tech) return res.status(404).send("Technician not found");

    let filteredNeighborhoods = tech.neighborhoodNames;
    if (searchQuery) {
      filteredNeighborhoods = filteredNeighborhoods.filter(
        (neigh) =>
          neigh.name && neigh.name.toLowerCase().includes(searchQuery)
      );
    }

    const neighborhoodsWithJobs = await Promise.all(
      filteredNeighborhoods.map(async (neigh) => {
        const job = await Job.findOne({
          name: tech.jobName.name,
          neighborhoodName: neigh._id,
        });
        return {
          neighborhood: neigh,
          job: job || null,
        };
      })
    );

    res.render("public/seeMoreTechnicianNeighborhoods", {
      technician: tech,
      neighborhoodsWithJobs,
      searchQuery,
      type: "neighborhoods",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};