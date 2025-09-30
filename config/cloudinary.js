const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Ask-for-a-Technician", // Folder name in Cloudinary
    allowed_formats: ["jpeg", "jpg", "png", "gif", "svg", "webp"], // Supported image formats
  },
});

module.exports = { cloudinary, storage };
