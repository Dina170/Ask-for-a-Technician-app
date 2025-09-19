const router = require("express").Router();
const multer = require("multer");
const { storage } = require("../../config/cloudinary");
const upload = multer({ storage });

const {
  getAllJobs,
  getJobById,
  renderNewJobForm,
  createJob,
  renderEditJobForm,
  updateJob,
  deleteJob,
  deleteAllJobs,
} = require("../../controllers/dashboard/job.controller");
const isAdmin = require("../../middlewares/isAdmin");

router.get("/", isAdmin, getAllJobs);

router.get("/new", isAdmin, renderNewJobForm);

router.post("/", isAdmin, upload.single("jobPhoto"), createJob);

router.get("/:id/edit", isAdmin, renderEditJobForm);

router.put("/:id", isAdmin, upload.single("jobPhoto"), updateJob);

router.delete("/:id", isAdmin, deleteJob);

router.delete("/", isAdmin, deleteAllJobs);

router.get("/:id", isAdmin, getJobById);

module.exports = router;
