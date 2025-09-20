const Job = require("../../models/job");
const Technician = require("../../models/technician");
const Neighborhood = require("../../models/neighborhood"); // إضافة نموذج الحي
const Blog = require("../../models/blog");
const Post = require("../../models/post");
const getSlug = require("speakingurl");

exports.getHomePage = async (req, res) => {
  try {
    // الحصول على الوظائف
    const uniqueJobs = await Job.aggregate([
      {
        $group: {
          _id: "$name",
          jobId: { $first: "$_id" },
          jobPhoto: { $first: "$jobPhoto" },
        },
      },
    ]);

    // الحصول على قائمة الفنيين المميزة
    const uniqueTechnicians = await Technician.aggregate([
      { $group: { _id: "$mainTitle", mainTitle: { $first: "$mainTitle" } } },
      { $sort: { _id: 1 } }
    ]);

    // الحصول على قائمة الأحياء المميزة
    const uniqueNeighborhoods = await Technician.aggregate([
      { $unwind: "$neighborhoodNames" },
      {
        $lookup: {
          from: "neighborhoods",
          localField: "neighborhoodNames",
          foreignField: "_id",
          as: "neighborhoodInfo",
        },
      },
      { $unwind: "$neighborhoodInfo" },
      { $group: { _id: "$neighborhoodInfo.name", name: { $first: "$neighborhoodInfo.name" } } },
      { $sort: { name: 1 } }
    ]);

    const jobId = req.query.jobId || "";
    const technician = req.query.technician || "";
    const neighborhood = req.query.neighborhood || "";

    const query = {};
    if (jobId) query.jobName = jobId;
    if (technician.trim()) query.mainTitle = { $regex: technician.trim(), $options: "i" };

    const techniciansRaw = await Technician.find(query)
      .populate("jobName")
      .populate("neighborhoodNames");

    const technicians = neighborhood.trim()
      ? techniciansRaw.filter((t) =>
          t.neighborhoodNames.some((n) => n.name === neighborhood.trim())
        )
      : techniciansRaw;

    const blogs = await Blog.find({});

    res.render("landingpage/index", {
      jobs: uniqueJobs,
      technicians,
      uniqueTechnicians,
      uniqueNeighborhoods,
      technician,
      neighborhood,
      selectedJobId: jobId || "",
      blogs,
      getSlug
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
      return res.json(technicianResults.map((t) => t.mainTitle));
    } else if (type === "neighborhood") {
      const neighborhoodResults = await Technician.aggregate([
        { $unwind: "$neighborhoodNames" },
        {
          $lookup: {
            from: "neighborhoods",
            from: "neighborhoods",
            localField: "neighborhoodNames",
            foreignField: "_id",
            as: "neighborhoodInfo",
          },
        },
        { $unwind: "neighborhoodInfo" },
        { $match: { "neighborhoodInfo.name": { $regex: search, $options: "i" } } },
        { $group: { _id: "$neighborhoodInfo.name" } },
        { $limit: 10 },
      ]);
      return res.json(neighborhoodResults.map((n) => n._id));
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
    if (!search) return res.json([]);

    const searchRegex = new RegExp(search.split(" ").join("|"), "i");
    const posts = await Post.find({
      $or: [{ title: { $regex: searchRegex } }, { name: { $regex: searchRegex } }],
    })
    .select("title name permaLink content") 
    .limit(10);

    const formattedPosts = posts.map((post) => ({
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
    const blogs = await Blog.find({});
    if (!blogs.length) {
      return res.render("public/blogPosts", { posts: [], blog: { blog: "لا توجد مدونات" }, getSlug });
    }

    const blog = blogs[0]; // أول مدونة
    const posts = await Post.find({ blog: blog._id }).sort({ createdAt: -1 });

    res.render("public/blogPosts", { posts, blog, getSlug });
  } catch (err) {
    console.error(err);
    res.status(500).send("حدث خطأ في جلب المقالات");
  }
};

exports.getBlogPosts = async (req, res) => {
  try {
    const blogs = await Blog.find({});
    const blog = blogs.find(
  (b) => getSlug(b.blog, { lang: false, uric: true }) === req.params.blog
);

    if (!blog) return res.status(404).render("public/404", { message: "Blog not found" });

    const posts = await Post.find({ blog: blog._id }).sort({ createdAt: -1 });
    res.render("public/blogPosts", { blog, posts, getSlug });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.getPostDetails = async (req, res) => {
  try {
    const permaLink = req.params.slug;

    // جيب البوست المطلوب
    const post = await Post.findOne({ permaLink }).populate("blog");
    if (!post) return res.status(404).send("Post not found");

    // جيب كل المدونات للهيدر
    const blogs = await Blog.find({});

    res.render("public/postDetails", { 
      post, 
      blogs,  // مهم للهيدر
      getSlug // عشان slugify يشتغل
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};


exports.getPrivacyPolicy = async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.render("public/privacyPolicy", { blogs, getSlug });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};