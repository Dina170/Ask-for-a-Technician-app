const Job = require('../../models/job');
const Technician = require('../../models/technician');



exports.getHomePage = async (req, res) => {
  try {
    const uniqueJobs = await Job.aggregate([
      {
        $group: {
          _id: "$name",
          jobId: { $first: "$_id" },
          jobPhoto: { $first: "$jobPhoto" },
        },
      },
    ]);

    const jobId = req.query.jobId;
    const technician = req.query.technician || '';
    const neighborhood = req.query.neighborhood || '';

    const query = {};

    if (jobId) {
      query.jobName = jobId;
    }

    if (technician.trim()) {
      query.mainTitle = { $regex: technician.trim(), $options: 'i' };
    }

    // Step 1: Find all matching technicians (we'll filter neighborhoods in JS)
    const techniciansRaw = await Technician.find(query)
      .populate('jobName')
      .populate('neighborhoodNames');

    // Step 2: If neighborhood filter is present, filter after population
    const technicians = neighborhood.trim()
      ? techniciansRaw.filter(t =>
          t.neighborhoodNames.some(n =>
            n.name.toLowerCase().includes(neighborhood.trim().toLowerCase())
          )
        )
      : techniciansRaw;

    res.render('public/home', {
      jobs: uniqueJobs,
      technicians,
      technician,
      neighborhood,
      selectedJobId: jobId || '',
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};




// exports.autocompleteTechnicians = async (req, res) => {
//   try {
//     const search = req.query.q || '';

//     const technicians = await Technician.find({
//       mainTitle: { $regex: search, $options: 'i' }
//     }).select('mainTitle').limit(10);

//     const names = technicians.map(tech => tech.mainTitle);

//     res.json(names);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Internal Server Error");
//   }
// };

// exports.autocompleteTechnicians = async (req, res) => {
//   try {
//     const search = req.query.q?.trim() || '';

//     if (!search) return res.json([]);

//     // Find matching technicians by name
//     const technicianResults = await Technician.find({
//       mainTitle: { $regex: search, $options: 'i' }
//     }).select('mainTitle').limit(10);

//     const technicianNames = technicianResults.map(t => t.mainTitle);

//     // Find matching neighborhoods by name (via $lookup)
//     const neighborhoodResults = await Technician.aggregate([
//       { $unwind: "$neighborhoodNames" },
//       {
//         $lookup: {
//           from: "neighborhoods", // collection name (lowercase and plural)
//           localField: "neighborhoodNames",
//           foreignField: "_id",
//           as: "neighborhoodInfo"
//         }
//       },
//       { $unwind: "$neighborhoodInfo" },
//       {
//         $match: {
//           "neighborhoodInfo.name": { $regex: search, $options: 'i' }
//         }
//       },
//       {
//         $group: {
//           _id: "$neighborhoodInfo.name"
//         }
//       },
//       { $limit: 10 }
//     ]);

//     const neighborhoodNames = neighborhoodResults.map(n => n._id);

//     // Combine and deduplicate results
//     const combined = [...new Set([...technicianNames, ...neighborhoodNames])];

//     res.json(combined);
//   } catch (err) {
//     console.error("Autocomplete error:", err);
//     res.status(500).send("Internal Server Error");
//   }
// };

exports.autocompleteTechnicians = async (req, res) => {
  try {
    const search = req.query.q?.trim() || '';
    const type = req.query.type || 'technician'; // default to technician if not provided

    if (!search) return res.json([]);

    if (type === 'technician') {
      // Find matching technicians by mainTitle
      const technicianResults = await Technician.find({
        mainTitle: { $regex: search, $options: 'i' }
      }).select('mainTitle').limit(10);

      const technicianNames = technicianResults.map(t => t.mainTitle);
      return res.json(technicianNames);

    } else if (type === 'neighborhood') {
      // Find matching neighborhoods by name using aggregation and lookup
      const neighborhoodResults = await Technician.aggregate([
        { $unwind: "$neighborhoodNames" },
        {
          $lookup: {
            from: "neighborhoods",       // MongoDB collection name
            localField: "neighborhoodNames",
            foreignField: "_id",
            as: "neighborhoodInfo"
          }
        },
        { $unwind: "$neighborhoodInfo" },
        {
          $match: {
            "neighborhoodInfo.name": { $regex: search, $options: 'i' }
          }
        },
        {
          $group: {
            _id: "$neighborhoodInfo.name"
          }
        },
        { $limit: 10 }
      ]);

      const neighborhoodNames = neighborhoodResults.map(n => n._id);
      return res.json(neighborhoodNames);

    } else {
      // Invalid type parameter
      return res.status(400).json({ error: "Invalid type parameter" });
    }

  } catch (err) {
    console.error("Autocomplete error:", err);
    res.status(500).send("Internal Server Error");
  }
};
