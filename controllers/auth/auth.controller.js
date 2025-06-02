const User = require("../../models/user");
const crypto = require("crypto");
const { sendResetEmail } = require("../../utils/mailer");

const renderLoginPage = (req, res) => {
  res.render("auth/login", { error: null, success: null });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.render("auth/login", {
      error: "email and password are required",
      success: null,
    });
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePasswords(password)))
    return res.render("auth/login", {
      error: "Invalid credentials",
      success: null,
    });

  req.session.user = { id: user._id, isAdmin: user.isAdmin };
  res.redirect("/dashboard/neighborhoods");
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect("/auth/login"));
};

const renderForgotPassPage = (req, res) => {
  res.render("auth/forgot-password", { error: null, success: null });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.render("auth/forgot-password", { error: "Email is required" });
  const user = await User.findOne({ email });
  if (!user)
    return res.render("auth/forgot-password", {
      error: "No account with that email",
    });
  const token = user.createPasswordResetToken();
  await user.save();
  await sendResetEmail(user.email, token);
  res.render("auth/login", {
    success: "Reset link sent to your email",
    error: null,
  });
};

const renderResetPassPage = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.render("auth/forgot-password", {
      error: "Token expired or invalid",
      success: null,
    });

  res.render("auth/reset-password", { token: req.params.token });
};

const resetPassword = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.render("auth/forgot-password", {
      error: "Token expired or invalid",
    });
  if (!req.body.password || !req.body.confirmPassword)
    return res.render("auth/reset-password", {
      error: "Password and confirm password are required",
      token: req.params.token,
    });
  if (req.body.password !== req.body.confirmPassword)
    return res.render("auth/reset-password", {
      error: "Passwords do not match",
      token: req.params.token,
    });
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.render("auth/login", { success: "Password updated", error: null });
};

module.exports = {
  renderLoginPage,
  login,
  logout,
  renderForgotPassPage,
  forgotPassword,
  renderResetPassPage,
  resetPassword,
};
