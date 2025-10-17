const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
require("dotenv").config();
const expressLayouts = require("express-ejs-layouts");
const seedAdmin = require("./utils/seedAdmin");
const MongoStore = require("connect-mongo");

const app = express();
app.disable("x-powered-by");

// Routers
const neighborhoodRouter = require("./routes/dashboard/neighborhood.route");
const jobRouter = require("./routes/dashboard/job.route");
const technicianRouter = require("./routes/dashboard/technician.route");
const blogRouter = require("./routes/dashboard/blog.route");
const postRouter = require("./routes/dashboard/post.route");
const Job = require("./models/job");
const Neighborhood = require("./models/neighborhood");
const Technician = require("./models/technician");

const publicHomeRouter = require("./routes/public/home.route");
const publicTechnicianRouter = require("./routes/public/technician.route");
const authRouter = require("./routes/auth/auth.route");

const loadBlogs = require("./middlewares/loadBlogs");
const technician = require("./models/technician");
const post = require("./models/post");
const blog = require("./models/blog");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await seedAdmin();
    const blogs = await blog.find({});

    for (const blog of blogs) {
      // only set slug if it doesn't exist
      if (!blog.slug) {
        blog.slug = blog.blog.trim().replace(/\s+/g, "-");
        await blog.save();
        console.log(`Updated slug for: ${blog.blog}`);
      }
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan("dev"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      // secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  })
);

// Middleware: إضافة رقم أول فني بشكل جلوبال للفيوز
app.use(async (req, res, next) => {
  try {
    const technician = await Technician.findOne();
    res.locals.mainPhone = technician ? technician.phoneNumber : "05075813050";
  } catch (err) {
    console.error("Error fetching technician:", err);
    res.locals.mainPhone = "05075813050";
  }
  next();
});

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "secret",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

app.use(express.static("public"));
// cashing static files
app.use(express.static("public", {
  maxAge: "30d", 
  etag: true,
  lastModified: true
}));

// chache control for all routes
app.use((req, res, next) => {
  res.set("Cache-Control", "public, max-age=31536000"); // 1 year
  next();
});


app.use("/uploads", express.static("uploads"));
app.use("/uploads/posts", express.static("uploads/posts"));
app.use("/static", express.static("public"));
app.use(loadBlogs);

// ---------------- Dashboard Routes ----------------
app.use(
  "/dashboard/neighborhoods",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  neighborhoodRouter
);

app.use(
  "/dashboard/jobs",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  jobRouter
);

app.use(
  "/dashboard/technicians",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  technicianRouter
);

app.use(
  "/dashboard/blogs",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  blogRouter
);

app.use(
  "/dashboard/posts",
  expressLayouts,
  (req, res, next) => {
    res.locals.layout = "dashboard/layouts/sidebar";
    next();
  },
  postRouter
);

// ---------------- Public Routes ----------------
app.use("/", publicHomeRouter); //landing page
app.use("/technicians", publicTechnicianRouter);
app.use("/auth", authRouter);

// ---------------- Error Handling ----------------

app.use((req, res, next) => {
  next(createError.NotFound());
});

// تصحيح Error Handler - ليعرض صفحة خطأ بدلاً من JSON
app.use((err, req, res, next) => {
  console.error("❌ Internal Error:", err.stack || err);

  // Show full error details in browser (⚠️ remove in production!)
  res.status(500).send(`
    <h1>Internal Server Error</h1>
    <pre>${err.stack || err}</pre>
  `);
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running @ http://localhost:${PORT}`));
