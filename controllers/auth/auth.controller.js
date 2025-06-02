const User = require("../../models/user");
const crypto = require("crypto");
const { sendResetEmail } = require("../../utils/mailer");

const renderLoginPage = (req, res) => {
  res.render("auth/login");
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    res.render("auth/login", { error: "email and password are required" });
  const user = await User.findOne({ email });
  if (!user || !(await User.comparePassword(password)))
    res.render("auth/login", { error: "Invalid credentials" });
  req.session.user = { id: user._id, isAdmin: user.isAdmin };
  res.redirect("/dashboard/neighborhoods");
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
};

const renderForgotPassPage = (req, res) => {
  res.render("auth/forgot-password");
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) res.render("auth/forgot-password");
  const user = await User.findOne({ email });
  if (!user)
    res.render("auth/forgot-password", { error: "No account with that email" });
  const token = User.createPasswordResetToken();
  await user.save();
  await sendResetEmail(user.email, token);
  res.render("auth/login", { success: "Reset link sent to your email" });
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

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.render("auth/login", { success: "Password updated" });
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
