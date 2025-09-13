const User = require("../models/user");

async function seedAdmin() {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.warn("No ADMIN credentials in .env file");
      return;
    }

    let admin = await User.findOne({ email: ADMIN_EMAIL });

    if (!admin) {
      admin = new User({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        isAdmin: true,
      });
      await admin.save();
      console.log("Admin user created:", ADMIN_EMAIL);
    } else {
      console.log("Admin already exists:", ADMIN_EMAIL);
    }
  } catch (err) {
    console.error("Error seeding admin:", err.message);
  }
}

module.exports = seedAdmin;
