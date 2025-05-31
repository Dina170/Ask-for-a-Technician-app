// controllers/public/home.controller.js

const Job = require('../../models/job');
const Technician = require('../../models/technician');

exports.getHomePage = async (req, res) => {
  const jobs = await Job.find();

  const jobId = req.query.jobId;

  const technicians = jobId
    ? await Technician.find({ jobName: jobId }).populate('jobName neighborhoodNames')
    : await Technician.find().populate('jobName neighborhoodNames');

  res.render('public/home', { jobs, technicians });
};
