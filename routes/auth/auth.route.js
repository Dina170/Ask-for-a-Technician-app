const router = require("express").Router();

const {
  renderLoginPage,
  login,
  logout,
  renderForgotPassPage,
  forgotPassword,
  renderResetPassPage,
  resetPassword,
} = require("../../controllers/auth/auth.controller");

// GET login page
router.get("/login", renderLoginPage);
// POST login
router.post("/login", login);
// GET logout
router.get("/logout", logout);
// GET forgot password page
router.get("/forgot-password", renderForgotPassPage);
// POST forgot password
router.post("/forgot-password", forgotPassword);
// GET reset password page
router.get("/reset-password/:token", renderResetPassPage);
// POST reset password
router.post("/reset-password/:token", resetPassword);

module.exports = router;
