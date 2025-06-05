const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const Technician = require("../../models/technician");
const { buildSearchQuery } = require("../../utils/searchFilters");

// Get all neighborhoods
const getAllNeighborhoods = async (req, res) => {
  try {
    // Build query using only the search term for the 'name' field
    const search = req.query.search || '';
    const query = buildSearchQuery({ search: req.query.search || '' }, 'name', false);

    const neighborhoods = await Neighborhood.find(query);
    const neighborhoodNames = await Neighborhood.distinct("name");
    res.render("dashboard/neighborhoods/index", { neighborhoods, filters: { search } ,neighborhoodNames});
    const neighborhoods = await Neighborhood.find();
    const message = req.query.message || '';
    const messageType = req.query.messageType || '';
    res.render("dashboard/neighborhoods/index", {
      neighborhoods,
      message,
      messageType
    });
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
    res.render("dashboard/neighborhoods/show", {
      neighborhood,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Render new neighborhood form
const newNeighborhood = (req, res) => {
  res.render("dashboard/neighborhoods/form", {
    neighborhood: null,
    error: null,
  });
};

// Create a new neighborhood
const createNeighborhood = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !req.file) {
      return res.render("dashboard/neighborhoods/form", {
        neighborhood: null,
        error: "Name and photo are required",
      });
    }

    const neighborhood = new Neighborhood({
      name,
      neighborhoodPhoto: req.file.filename,
    });

    await neighborhood.save();
    res.redirect("/dashboard/neighborhoods?message=تم إضافة حي بنجاح&messageType=add");
  } catch (err) {
    console.error(err);

    let errorMessage = "Failed to create neighborhood";
    if (err.code === 11000) {
      errorMessage = "Neighborhood name must be unique";
    }

    res.render("dashboard/neighborhoods/form", {
      neighborhood: null,
      error: errorMessage,
    });
  }
};

// Delete all neighborhoods
const deleteAllNeighborhoods = async (req, res) => {
  try {
    await Neighborhood.deleteMany({});
    await Job.updateMany({}, { $unset: { neighborhoodName: "" } });
    await Technician.updateMany({}, { $unset: { neighborhoodNames: "" } });
    res.redirect("/dashboard/neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods");
  }
};

// Delete single neighborhood
const deleteNeighborhood = async (req, res) => {
  try {
    const neighborhoodId = req.params.id;
    await Neighborhood.findByIdAndDelete(neighborhoodId);
    await Job.updateMany(
      { neighborhoodName: neighborhoodId },
      { $unset: { neighborhoodName: "" } }
    );
    await Technician.updateMany(
      { neighborhoodNames: neighborhoodId },
      { $pull: { neighborhoodNames: neighborhoodId } }
    );
    res.redirect("/dashboard/neighborhoods");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/neighborhoods?");
  }
};

// Render edit neighborhood form
const editNeighborhood = async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    if (!neighborhood) {
      return res.redirect("/dashboard/neighborhoods");
    }
    res.render("dashboard/neighborhoods/form", { neighborhood, error: null });
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

    let errorMessage = "Failed to update neighborhood";
    if (err.code === 11000) {
      errorMessage = "Neighborhood name must be unique";
    }

    const neighborhood = await Neighborhood.findById(req.params.id); // fetch again to re-render form
    res.render("dashboard/neighborhoods/form", {
      neighborhood,
      error: errorMessage,
    });
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
