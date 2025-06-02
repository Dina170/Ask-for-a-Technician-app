const User = require("../../models/user");
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
