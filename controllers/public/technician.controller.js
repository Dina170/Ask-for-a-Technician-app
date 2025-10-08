const Technician = require("../../models/technician");
const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const Blog = require("../../models/blog"); 
const mongoose = require("mongoose");
const getSlug = require("speakingurl"); 

// --------------------- Helper ---------------------
async function getCommonData() {
  const blogs = await Blog.find().lean();
  return { blogs, getSlug };
}

// --------------------- Controllers ---------------------

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

    const common = await getCommonData();
    res.render("public/technicianNeighborhoods", {
      technician: tech,
      neighborhoodsWithJobs,
      ...common,
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

    const common = await getCommonData();
    res.render("public/neighborhoodDetails", {
      technician,
      neighborhood,
      job,
      type: "technicians",
      ...common,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};


exports.getTechnicianDetails = async (req, res) => {
  try {
    const technician = await Technician.findOne({ slug: req.params.slug })
      .populate("jobName")
      .populate("neighborhoodNames");

    if (!technician) return res.status(404).send("Technician not found");

    const job = technician.jobName || null;

    const common = await getCommonData();
    res.render("public/technicianDetails", {
      technician,
      job,
      searchType: "technician",
      ...common,
    });
  } catch (err) {
    console.error("Error in getTechnicianDetails:", err);
    const common = await getCommonData();
    return res.render("landingpage/index", {
      jobs: await Job.find({}),
      uniqueTechnicians: [],
      uniqueNeighborhoods: [],
      technicians: [],
      technician: "",
      neighborhood: "",
      selectedJobId: "",
      selectedJobName: "",
      selectedNeighborhoodName: "",
      searchType: "technician",
      blogs: common.blogs,
      getSlug,
      message: "حدث خطأ غير متوقع، برجاء المحاولة لاحقًا.",
      ...common,
    });
  }
};





exports.getAllTechnicians = async (req, res) => {
  try {
    const rawSearch = req.query.search || "";
    const search = rawSearch.trim();

    if (!search) {
      const technicians = await Technician.find({})
        .populate("jobName")
        .populate("neighborhoodNames");

      const common = await getCommonData();
      return res.render("public/showMoreTechnicians", {
        technicians,
        search: rawSearch,
        type: "technicians",
        searchType: "technician",
        ...common,
      });
    }

    const regex = new RegExp(search, "i");

    const matchingJobs = await Job.find({ name: { $regex: regex } })
      .select("_id")
      .lean();
    const jobIds = matchingJobs.map((j) => j._id);

    const matchingNeighborhoods = await Neighborhood.find({
      name: { $regex: regex },
    })
      .select("_id")
      .lean();
    const neighborhoodIds = matchingNeighborhoods.map((n) => n._id);

    const orConditions = [{ mainTitle: { $regex: regex } }];
    if (jobIds.length) orConditions.push({ jobName: { $in: jobIds } });
    if (neighborhoodIds.length)
      orConditions.push({ neighborhoodNames: { $in: neighborhoodIds } });

    const query = { $or: orConditions };

    const technicians = await Technician.find(query)
      .populate("jobName")
      .populate("neighborhoodNames");

    if (
      req.xhr ||
      (req.headers.accept && req.headers.accept.indexOf("json") > -1)
    ) {
      const suggestions = technicians.map((t) => ({
        id: t._id,
        display: t.jobName && t.jobName.name ? t.jobName.name : t.mainTitle,
      }));
      return res.json(suggestions);
    }

    const common = await getCommonData();
    res.render("public/showMoreTechnicians", {
      technicians,
      search: rawSearch,
      type: "technicians",
      searchType: "technician",
      ...common,
    });
  } catch (err) {
    console.error("Error fetching technicians:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getSeeMoreTechnicianNeighborhoods = async (req, res) => {
  try {
    const searchQuery = req.query.search?.trim().toLowerCase() || "";

    if (decodeURIComponent(req.params.section) === "عرض-الاحياء") {
      let tech = await Technician.findOne({ slug: req.params.slug })
        .populate("jobName")
        .populate({
          path: "neighborhoodNames",
          select: "name neighborhoodPhoto",
        });

      if (!tech) {
        return res.status(404).send("Technician not found");
      }

      // فلترة الأحياء
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

      const common = await getCommonData();
      res.render("public/seeMoreTechnicianNeighborhoods", {
        technician: tech,
        neighborhoodsWithJobs,
        searchQuery,
        type: "neighborhoods",
        searchType: "neighborhood",
        ...common,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};
//
exports.getSeeMoreTechnicianNeighborhoodSearch = async (req, res) => {
  try {
    const { section, slug, neighborhoodSlug } = req.params;
    if (section !== "عرض-الاحياء") return res.status(404).send("Section not found");

    const searchQuery = neighborhoodSlug ? neighborhoodSlug.replace(/-/g, ' ') : "";

    const tech = await Technician.findOne({ slug })
      .populate("jobName")
      .populate({
        path: "neighborhoodNames",
        select: "name neighborhoodPhoto",
      });

    if (!tech) return res.status(404).send("Technician not found");

    let filteredNeighborhoods = tech.neighborhoodNames;
    if (searchQuery) {
      filteredNeighborhoods = filteredNeighborhoods.filter(
        (neigh) =>
          neigh.name && neigh.name.toLowerCase().includes(searchQuery.toLowerCase())
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

    const common = await getCommonData();
    res.render("public/seeMoreTechnicianNeighborhoods", {
      technician: tech,
      neighborhoodsWithJobs,
      searchQuery,
      type: "neighborhoods",
      searchType: "neighborhood",
      ...common,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};


// i used it in search to redirect to tech details page
exports.getTechnicianSlug = async (req, res) => {
  try {
    const { jobId, neighborhood } = req.query;
    if (!jobId) return res.status(400).json({ error: "jobId required" });

    const jobExists = await Job.findById(jobId).lean();
    if (!jobExists) {
      return res.json({
        slug: null,
        jobExists: false,
        neighborhoodExists: false,
      });
    }

    const anyTechnician = await Technician.findOne({ jobName: jobId }).lean();
    if (!anyTechnician) {
      return res.json({
        slug: null,
        jobExists: false,
        neighborhoodExists: false,
      });
    }

    if (neighborhood && neighborhood.trim()) {
      const neighDoc = await Neighborhood.findOne({ name: neighborhood.trim() })
        .select("_id")
        .lean();

      if (neighDoc) {
        const technicianInNeighborhood = await Technician.findOne({
          jobName: jobId,
          neighborhoodNames: neighDoc._id,
        })
          .select("slug")
          .lean();

        if (technicianInNeighborhood) {
          return res.json({
            slug: technicianInNeighborhood.slug,
            jobExists: true,
            neighborhoodExists: true,
          });
        } else {
          return res.json({
            slug: null,
            jobExists: true,
            neighborhoodExists: false,
          });
        }
      }
    }

    return res.json({
      slug: anyTechnician.slug,
      jobExists: true,
      neighborhoodExists: true,
    });
  } catch (err) {
    console.error("Error in getTechnicianSlug:", err);
    return res.status(500).json({ error: "Server error" });
  }
};




exports.autocompleteNeighborhood = async (req, res) => {
  try {
    const search = req.query.q?.trim() || "";
    const techSlug = req.params.slug;

    console.log("Neighborhood Autocomplete:", { search, techSlug })

    if (!search) return res.json([]);

    let neighborhoods = [];

    if (techSlug && techSlug !== 'all') {
      const tech = await Technician.findOne({ slug: techSlug })
        .populate({
          path: "neighborhoodNames",
          select: "name _id",
        })
        .lean();

      if (!tech || !tech.neighborhoodNames) {
        console.log("No technician or neighborhoods found");
        return res.json([]);
      }

      neighborhoods = tech.neighborhoodNames.filter(n => 
        n.name && n.name.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      neighborhoods = await Neighborhood.find({
        name: { $regex: search, $options: "i" },
      })
        .select("name _id")
        .limit(10)
        .lean();
    }

    console.log("Found neighborhoods:", neighborhoods.length); 
    return res.json(neighborhoods);
  } catch (err) {
    console.error("Autocomplete neighborhood error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};