const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
require("dotenv").config();

const app = express();
const neighborhoodRouter = require("./routes/neighborhood.route");
const jobRouter = require("./routes/job.route");
const technicianRouter = require("./routes/technician.route");
const Job = require("./models/job");
const Neighborhood = require("./models/neighborhood");



// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use("/neighborhoods", neighborhoodRouter);
app.use("/jobs", jobRouter);
app.use("/technicians", technicianRouter);

// Serve files from the uploads folder statically
app.use('/uploads', express.static('uploads'));

// app.get("/", async (req, res, next) => {
//   res.send({ message: "Awesome it works 🐻" });
// });

// app.use("/api", require("./routes/api.route"));


//frontend routes
// Route: to render the landing page with jobs
app.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().populate("neighborhoodName");
    res.render("landingpage/index", { jobs, type: 'jobs' });
  } catch (err) {
    console.error(err);
    res.render("landingpage/index", { jobs: [], type: 'jobs' });
  }
});

// Route: to render neighborhoods according to job name
app.get("/jobs/filter/:jobName", async (req, res) => {
  try {
    const jobName = req.params.jobName;
    const jobs = await Job.find({ name: jobName }).populate("neighborhoodName");

    const neighborhoods = jobs
      .map(job => job.neighborhoodName)
      .filter(Boolean);

    res.render("partials/neighborhoodCard", { neighborhoods, type: 'neighborhoods' }); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching jobs by neighborhood");
  }
});

// Route: to all jobs page
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().populate("neighborhoodName");
    res.render("pages/alljobs", { jobs ,type: 'jobs'});
  } catch (err) {
    console.error(err);
    res.render("pages/alljobs", { jobs: [], type: 'jobs' });
  }
});

// Route: to all neighborhoods page
app.get("/allneighborhoods", async (req, res) => {
  console.log("دخل الراوت /allneighborhoods ✅");
  try {
    // const neighborhoods = await Job.find().populate("neighborhoodName");
     const neighborhoods = await Neighborhood.find();
    res.render("pages/allneighborhoods", { neighborhoods, type: 'neighborhoods' }); 
  } catch (err) {
    console.error(err);
    res.render("pages/allneighborhoods", { neighborhoods: [], type: 'neighborhoods' });
  }
});








app.use(express.static('public'));


app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
