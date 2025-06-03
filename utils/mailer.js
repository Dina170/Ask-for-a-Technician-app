const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendResetEmail = async (to, token) => {
  const resetURL = `http://localhost:3000/auth/reset-password/${token}`;
  await transporter.sendMail({
    to,
    from: process.env.EMAIL,
    subject: "Password Reset",
    html: `<p>Click here to reset your password: <a href="${resetURL}">${resetURL}</a></p>`,
  });
};
