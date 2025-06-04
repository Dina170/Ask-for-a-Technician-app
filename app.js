const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
require("dotenv").config();

const app = express();
const neighborhoodRouter = require("./routes/dashboard/neighborhood.route");
const jobRouter = require("./routes/dashboard/job.route");
const technicianRouter = require("./routes/dashboard/technician.route");
const Job = require("./models/job");
const Neighborhood = require("./models/neighborhood");
const Technician = require("./models/technician");



const publicHomeRouter = require("./routes/public/home.route");
const publicTechnicianRouter = require("./routes/public/technician.route");
const authRouter = require("./routes/auth/auth.route");

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

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Serve files from the uploads folder statically
app.use("/uploads", express.static("uploads"));

app.use("/dashboard/neighborhoods", neighborhoodRouter);
app.use("/dashboard/jobs", jobRouter);
app.use("/dashboard/technicians", technicianRouter);

// app.use("/", publicHomeRouter); // homepage + job-based filtering
app.use("/technicians", publicTechnicianRouter); // technician + neighborhood pages
app.use("/auth", authRouter); // authentication routes

// app.get("/", async (req, res, next) => {
//   res.send({ message: "Awesome it works 🐻" });
// });

// app.use("/api", require("./routes/api.route"));


//frontend routes
// Route: to render the landing page with technicians and search functionality
app.get("/", async (req, res) => {
  try {
    const { jobTitle, neighborhood } = req.query;
    let techniciansQuery = {};

    // filtering by job title
    if (jobTitle) {
      techniciansQuery.jobName = jobTitle;
    }

    // filtering by neighborhood
    if (neighborhood) {
      const neighborhoodDoc = await Neighborhood.findOne({ name: neighborhood });
      if (neighborhoodDoc) {
        techniciansQuery.neighborhoodNames = neighborhoodDoc._id;
      }
    }

    const technicians = await Technician.find(techniciansQuery)
      .populate("neighborhoodNames")
      .limit(6);

    const jobs = await Job.find();
    const neighborhoods = await Neighborhood.find();
    const isFiltered = jobTitle || neighborhood;

    res.render("landingpage/index", {
      technicians,
      jobs,
      neighborhoods,
      type: "technicians",
      isFiltered,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
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
