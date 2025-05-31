const Neighborhood = require("../models/neighborhood");
const Job = require("../models/job");
const Technician = require("../models/technician");

// Get all neighborhoods
const getAllNeighborhoods = async (req, res) => {
  try {
    const neighborhoods = await Neighborhood.find();
    res.render("neighborhoods/index", { neighborhoods });
  } catch (err) {
    console.error(err);
    res.redirect("/neighborhoods");
  }
};

// Get neighborhood by ID
const getNeighborhoodById = async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    if (!neighborhood) {
      return res.status(404).send("Neighborhood not found");
    }
    res.render("neighborhoods/show", { neighborhood });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const newNeighborhood = (req, res) => {
  res.render("neighborhoods/form", { neighborhood: null });
};

// Create a new neighborhood
const createNeighborhood = async (req, res) => {
  try {
    const { name } = req.body;
    const neighborhood = new Neighborhood({
      name,
      neighborhoodPhoto: req.file ? req.file.filename : null,
    });
    await neighborhood.save();
    res.redirect("neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect("/neighborhoods");
  }
};

const deleteAllNeighborhoods = async (req, res) => {
  await Neighborhood.deleteMany({});
  res.redirct("/neighborhoods");
};

const deleteNeighborhood = async (req, res) => {
  await Neighborhood.findByIdAndDelete(req.params.id);
  res.redirect("/neighborhoods");
};

const editNeighborhood = async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    res.render("neighborhoods/form", { neighborhood });
  } catch (err) {
    console.error(err);
    res.redirect("/neighborhoods");
  }
};

const updateNeighborhood = async (req, res) => {
  try {
    const { name } = req.body;
    const update = { name };

    if (req.file) update.neighborhoodPhoto = req.file.filename;

    await Neighborhood.findByIdAndUpdate(req.params.id, update, { new: true });
    res.redirect("/neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect("/neighborhoods");
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
