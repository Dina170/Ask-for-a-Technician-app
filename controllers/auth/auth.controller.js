const User = require("../../models/user");

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
