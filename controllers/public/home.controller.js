const Job = require('../../models/job');
const Technician = require('../../models/technician');

exports.getHomePage = async (req, res) => {
  try {
    // Get distinct job names with one representative document each
    const uniqueJobs = await Job.aggregate([
      {
        $group: {
          _id: "$name",
          jobId: { $first: "$_id" }, // for use in query string
          jobPhoto: { $first: "$jobPhoto" },
        }
      }
    ]);

    const jobId = req.query.jobId;

    const technicians = jobId
      ? await Technician.find({ jobName: jobId }).populate('jobName neighborhoodNames')
      : await Technician.find().populate('jobName neighborhoodNames');

    res.render('public/home', { jobs: uniqueJobs, technicians });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
