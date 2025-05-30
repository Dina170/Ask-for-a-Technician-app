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
