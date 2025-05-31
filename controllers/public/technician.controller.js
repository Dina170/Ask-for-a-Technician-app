const Technician = require('../../models/technician');
const Neighborhood = require('../../models/neighborhood');

exports.getTechnicianNeighborhoods = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id)
      .populate('jobName')               // to get job details (description, image)
      .populate('neighborhoodNames');    // to get neighborhoods

    if (!tech) return res.status(404).send('Technician not found');

    res.render('public/technicianNeighborhoods', { technician: tech });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

exports.getNeighborhoodDetails = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.techId).populate('jobName');
    const neighborhood = await Neighborhood.findById(req.params.neighId);

    if (!tech || !neighborhood) return res.status(404).send('Not found');

    res.render('public/neighborhoodDetails', {
      technician: tech,
      neighborhood,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
