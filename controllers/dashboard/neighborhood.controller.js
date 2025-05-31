const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const Technician = require("../../models/technician");

// Get all neighborhoods
const getAllNeighborhoods = async (req, res) => {
  try {
    const neighborhoods = await Neighborhood.find();
    res.render("dashboard/neighborhoods/index", { neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Get neighborhood by ID
const getNeighborhoodById = async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    if (!neighborhood) {
      return res.redirect("/dashboard/neighborhoods");
    }
    res.render("dashboard/neighborhoods/show", { neighborhood });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Render new neighborhood form
const newNeighborhood = (req, res) => {
  res.render("dashboard/neighborhoods/form", { neighborhood: null });
};

// Create a new neighborhood
const createNeighborhood = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !req.file) {
      return res.render("dashboard/neighborhoods/form", {
        neighborhood: null,
        error: "Name and photo are required"
      });
    }

    const neighborhood = new Neighborhood({
      name,
      neighborhoodPhoto: req.file.filename
    });

    await neighborhood.save();
    res.redirect("/dashboard/neighborhoods");
  } catch (err) {
    console.error(err);
    res.render("dashboard/neighborhoods/form", {
      neighborhood: null,
      error: "Failed to create neighborhood"
    });
  }
};

// Delete all neighborhoods
const deleteAllNeighborhoods = async (req, res) => {
  try {
    await Neighborhood.deleteMany({});
    res.redirect("/dashboard/neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Delete single neighborhood
const deleteNeighborhood = async (req, res) => {
  try {
    await Neighborhood.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard/neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Render edit neighborhood form
const editNeighborhood = async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    if (!neighborhood) {
      return res.redirect("/dashboard/neighborhoods");
    }
    res.render("dashboard/neighborhoods/form", { neighborhood });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Update neighborhood
const updateNeighborhood = async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    if (!neighborhood) {
      return res.redirect("/dashboard/neighborhoods");
    }

    neighborhood.name = req.body.name;
    if (req.file) {
      neighborhood.neighborhoodPhoto = req.file.filename;
    }

    await neighborhood.save();
    res.redirect("/dashboard/neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect(`/dashboard/neighborhoods/${req.params.id}/edit`);
  }
};

module.exports = {
  deleteAllNeighborhoods,
  deleteNeighborhood,
  editNeighborhood,
  updateNeighborhood,
  getAllNeighborhoods,
  createNeighborhood,
  getNeighborhoodById,
  newNeighborhood,
};