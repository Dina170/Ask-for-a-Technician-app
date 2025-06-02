const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
require("dotenv").config();
const expressLayouts = require('express-ejs-layouts');
const app = express();
const neighborhoodRouter = require("./routes/dashboard/neighborhood.route");
const jobRouter = require("./routes/dashboard/job.route");
const technicianRouter = require("./routes/dashboard/technician.route");
const publicHomeRouter = require("./routes/public/home.route");
const publicTechnicianRouter = require("./routes/public/technician.route");

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
app.use(expressLayouts);
// Serve files from the uploads folder statically
app.use('/uploads', express.static('uploads'));
app.use("/static", express.static("public"));

app.use("/dashboard/neighborhoods", neighborhoodRouter);
app.use("/dashboard/jobs", jobRouter);
app.use("/dashboard/technicians", technicianRouter);

app.use("/", publicHomeRouter); // homepage + job-based filtering
app.use("/technicians", publicTechnicianRouter); // technician + neighborhood pages


// app.get("/", async (req, res, next) => {
//   res.send({ message: "Awesome it works 🐻" });
// });

// app.use("/api", require("./routes/api.route"));

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
