const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
require("dotenv").config();
const expressLayouts = require("express-ejs-layouts");

const app = express();

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static('public'));
app.use("/uploads", express.static("uploads"));
app.use("/uploads/posts", express.static("uploads/posts"));
app.use("/static", express.static("public"));
app.use(loadBlogs);

// ---------------- Dashboard Routes ----------------
app.use("/dashboard/neighborhoods", expressLayouts, (req, res, next) => {
  res.locals.layout = "dashboard/layouts/sidebar";
  next();
}, neighborhoodRouter);

app.use("/dashboard/jobs", expressLayouts, (req, res, next) => {
  res.locals.layout = "dashboard/layouts/sidebar";
  next();
}, jobRouter);

app.use("/dashboard/technicians", expressLayouts, (req, res, next) => {
  res.locals.layout = "dashboard/layouts/sidebar";
  next();
}, technicianRouter);

app.use("/dashboard/blogs", expressLayouts, (req, res, next) => {
  res.locals.layout = "dashboard/layouts/sidebar";
  next();
}, blogRouter);

app.use("/dashboard/posts", expressLayouts, (req, res, next) => {
  res.locals.layout = "dashboard/layouts/sidebar";
  next();
}, postRouter);

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
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // طباعة الخطأ في الكونسول للتشخيص
  console.error(`Error ${status}: ${message}`);
  console.error(`Route: ${req.method} ${req.originalUrl}`);
  
  res.status(status);
  
  // إذا كان الطلب API (يتوقع JSON)
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    res.json({
      status: status,
      message: message,
    });
  } else {
    // إذا كان طلب عادي من المتصفح
    res.render('error', { 
      status: status, 
      message: message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running @ http://localhost:${PORT}`));