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
    res.render('public/technicianNeighborhoods', {
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
