const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/jobs" });

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

// GET all jobs
router.get("/", getAllJobs);

// GET new job form
router.get("/new", renderNewJobForm);

// POST create job
router.post("/", upload.single("jobPhoto"), createJob);

// GET edit job form
router.get("/:id/edit", renderEditJobForm);

// PUT update job
router.put("/:id", upload.single("jobPhoto"), updateJob);

// DELETE single job
router.delete("/:id", deleteJob);

// DELETE all jobs
router.delete("/", deleteAllJobs);

// GET single job by ID
router.get("/:id", getJobById);

// router.get("/", isAdmin, getAllJobs);

// // GET new job form
// router.get("/new", isAdmin, renderNewJobForm);

// // POST create job
// router.post("/", isAdmin, upload.single("jobPhoto"), createJob);

// // GET edit job form
// router.get("/:id/edit", isAdmin, renderEditJobForm);

// // PUT update job
// router.put("/:id", isAdmin, upload.single("jobPhoto"), updateJob);

// // DELETE single job
// router.delete("/:id", isAdmin, deleteJob);

// // DELETE all jobs
// router.delete("/", isAdmin, deleteAllJobs);

// // GET single job by ID
// router.get("/:id", isAdmin, getJobById);

module.exports = router;
