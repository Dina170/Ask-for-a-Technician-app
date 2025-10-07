const Technician = require("../../models/technician");
const Neighborhood = require("../../models/neighborhood");
const Job = require("../../models/job");
const Blog = require("../../models/blog"); // استدعاء موديل البلوج
const mongoose = require("mongoose");
const getSlug = require("speakingurl"); // مكتبة السلاج

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

// exports.getTechnicianDetails = async (req, res) => {
//   try {
//     const technician = await Technician.findOne({ mainTitle: req.params.title })
//       .populate("jobName")
//       .populate("neighborhoodNames");

//     if (!technician) return res.status(404).send("Technician not found");

//     const job = technician.jobName || null;

//     const common = await getCommonData();
//     res.render("public/technicianDetails", { technician, job,searchType: "technician", ...common });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Internal Server Error");
//   }
// };

exports.getTechnicianDetails = async (req, res) => {
  try {
    const technician = await Technician.findOne({ slug: req.params.slug })
      .populate("jobName")
      .populate("neighborhoodNames");

    if (!technician) {
      const hasTechnician = await Technician.findOne({ jobName: job._id });
      const common = await getCommonData();

      return res.render("landingpage/index", {
        jobs: jobsList,
        uniqueTechnicians,
        uniqueNeighborhoods,
        technicians: [],
        technician: "",
        neighborhood: neighborhood ? neighborhood.name : "",
        selectedJobId,
        selectedJobName,
        selectedNeighborhoodName,
        searchType: "technician",
        blogs: common.blogs,
        getSlug,
        message: hasTechnician
          ? `المهنة "${job.name}" غير متوفرة في الحي "${neighborhoodParam || "المحدد"}".`
          : `لا يوجد أي فنيين حالياً للمهنة "${job.name}".`,
        ...common,
      });
    }

    const common = await getCommonData();
    return res.render("public/technicianDetails", {
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

    // لو فيه searchQuery على حي
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
