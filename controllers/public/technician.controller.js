const Technician = require('../../models/technician');
const Neighborhood = require('../../models/neighborhood');
const Job = require('../../models/job');
const mongoose = require('mongoose');

exports.getTechnicianNeighborhoods = async (req, res) => {
  try {
    // 1. Get technician with job and neighborhoods populated
    const tech = await Technician.findById(req.params.id)
      .populate('jobName')
      .populate('neighborhoodNames');

    if (!tech) return res.status(404).send('Technician not found');

    // 2. For each neighborhood, find the matching job
    // Build an array of neighborhoods enriched with job info
    const neighborhoodsWithJobs = await Promise.all(
      tech.neighborhoodNames.map(async (neigh) => {
        // Find job matching technician job name & neighborhood id
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

    // 3. Render with enriched data
    res.render('partials/neighborhoodCard', {
      technician: tech,
      neighborhoodsWithJobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};



exports.getNeighborhoodDetails = async (req, res) => {
  try {
    const { techId, neighId } = req.params;

    // Validate IDs (optional but recommended)
    if (!mongoose.Types.ObjectId.isValid(techId) || !mongoose.Types.ObjectId.isValid(neighId)) {
      return res.status(400).send('Invalid Technician or Neighborhood ID');
    }

    // Get technician with job populated
    const technician = await Technician.findById(techId).populate('jobName');
    if (!technician) return res.status(404).send('Technician not found');

    // Get neighborhood
    const neighborhood = await Neighborhood.findById(neighId);
    if (!neighborhood) return res.status(404).send('Neighborhood not found');

    // Find Job that matches technician's jobName and neighborhood
    // Assuming jobName has a "name" field and Job model has fields: name and neighborhoodName (ref to Neighborhood)
    const job = await Job.findOne({
      name: technician.jobName.name,
      neighborhoodName: neighborhood._id,
    });

    if (!job) return res.status(404).send('Job not found for this neighborhood');

    // Render with all info
    res.render('public/neighborhoodDetails', {
      technician,
      neighborhood,
      job,
      type: 'technicians', 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


// Get all technicians with optional search (autocomplete) 
exports.getAllTechnicians = async (req, res) => {
  try {
    const search = req.query.search || '';

    const query = {};
    if (search.trim()) {
      query.mainTitle = { $regex: search.trim(), $options: 'i' };
    }

    const technicians = await Technician.find(query)
      .populate('jobName neighborhoodNames');

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const suggestions = technicians.map(tech => ({
        id: tech._id,
        name: tech.mainTitle,
      }));
      return res.json(suggestions);
    }

    res.render('pages/alltechnicians', {
      technicians,
      search,
      type: 'technicians',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};


//TechnicianNeighborhoods + filtration
exports.getSeeMoreTechnicianNeighborhoods = async (req, res) => {
  try {
    const technicianId = req.params.id;
    const searchQuery = req.query.search?.trim().toLowerCase() || '';

    // 1. Get technician with jobs and neighborhoods populated
    const tech = await Technician.findById(technicianId)
      .populate('jobName')
      .populate('neighborhoodNames');

    if (!tech) return res.status(404).send('Technician not found');

    // 2. Filter neighborhoods by search query if provided
    let filteredNeighborhoods = tech.neighborhoodNames;
    if (searchQuery) {
      filteredNeighborhoods = filteredNeighborhoods.filter(neigh =>
        neigh.name && neigh.name.toLowerCase().includes(searchQuery)
      );
    }

    // 3. For each filtered neighborhood, find matching job
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

    // 4. Render the page with filtered data and pass search term back to template
    res.render('pages/allneighborhoods', {
      technician: tech,
      neighborhoodsWithJobs,
      searchQuery,
      type: 'neighborhoods'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};