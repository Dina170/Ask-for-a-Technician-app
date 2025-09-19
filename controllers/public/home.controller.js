const Job = require("../../models/job");
const Technician = require("../../models/technician");
const Neighborhood = require("../../models/neighborhood"); // إضافة نموذج الحي
const Blog = require("../../models/blog");
const Post = require("../../models/post");

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

    // الحصول على قائمة فريدة من أسماء الفنيين
    const uniqueTechnicians = await Technician.aggregate([
      {
        $group: {
          _id: "$mainTitle",
          technicianId: { $first: "$_id" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // الحصول على قائمة فريدة من الأحياء
    const uniqueNeighborhoods = await Neighborhood.find({})
      .select('name')
      .sort({ name: 1 });

    const jobId = req.query.jobId || "";
    const technician = req.query.technician || "";
    const neighborhood = req.query.neighborhood || "";

    const query = {};

    if (jobId) {
      query.jobName = jobId;
    }

    if (technician.trim()) {
      query.mainTitle = technician.trim();
    }

    const techniciansRaw = await Technician.find(query)
      .populate("jobName")
      .populate("neighborhoodNames"); 

    const technicians = neighborhood.trim()
      ? techniciansRaw.filter((t) =>
          t.neighborhoodNames.some((n) =>
            n.name === neighborhood.trim()
          )
        )
      : techniciansRaw;

    res.render("landingpage/index", {
      jobs: uniqueJobs,
      technicians,
      uniqueTechnicians, // إرسال قائمة الفنيين الفريدة
      uniqueNeighborhoods, // إرسال قائمة الأحياء الفريدة
      technician,
      neighborhood,
      selectedJobId: jobId || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.autocompleteTechnicians = async (req, res) => {
  try {
    const search = req.query.q?.trim() || "";
    const type = req.query.type || "technician";

    if (!search) return res.json([]);

    if (type === "technician") {
      const technicianResults = await Technician.find({
        mainTitle: { $regex: search, $options: "i" },
      })
        .select("mainTitle")
        .limit(10);

      const technicianNames = technicianResults.map((t) => t.mainTitle);
      return res.json(technicianNames);
    } else if (type === "neighborhood") {
      const neighborhoodResults = await Technician.aggregate([
        { $unwind: "$neighborhoodNames" },
        {
          $lookup: {
            from: "neighborhoods",
            localField: "neighborhoodNames",
            foreignField: "_id",
            as: "neighborhoodInfo",
          },
        },
        { $unwind: "neighborhoodInfo" },
        {
          $match: {
            "neighborhoodInfo.name": { $regex: search, $options: "i" },
          },
        },
        {
          $group: {
            _id: "neighborhoodInfo.name",
          },
        },
        { $limit: 10 },
      ]);

      const neighborhoodNames = neighborhoodResults.map((n) => n._id);
      return res.json(neighborhoodNames);
    } else {
      return res.status(400).json({ error: "Invalid type parameter" });
    }
  } catch (err) {
    console.error("Autocomplete error:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.autocompletePosts = async (req, res) => {
  try {
    const search = req.query.q?.trim() || "";
    
    if (!search) {
      return res.json([]);
    }
    const searchRegex = new RegExp(search.split(' ').join('|'), 'i');
    
    const posts = await Post.find({
      $or: [
        { title: { $regex: searchRegex } },
        { name: { $regex: searchRegex } },
      ]
    })
    .select("title name permaLink content") 
    .limit(10);

    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      title: post.title || "",
      name: post.name || "",
      permaLink: post.permaLink,
      content: post.content || "",
      displayText: post.title && post.name 
        ? `${post.title} - ${post.name}`
        : post.title || post.name || "بدون عنوان"
    }));

    return res.json(formattedPosts);
    
  } catch (err) {
    console.error("Autocomplete error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
};

exports.getBlogPosts = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).send("Blog not found");
    const posts = await require("../../models/post").find({ blog: blogId });
    res.render("public/blogPosts", { blog, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getPostDetails = async (req, res) => {
  try {
    const permaLink = req.params.slug;
    const post = await require("../../models/post")
      .findOne({ permaLink })
      .populate("blog");
    if (!post) return res.status(404).send("Post not found");
    res.render("public/postDetails", { post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getPrivacyPolicy = (req, res) => {
  res.render("public/privacyPolicy");
};