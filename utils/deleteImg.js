const { cloudinary } = require("../config/cloudinary");

function deleteImg(imageUrl) {
  const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
  cloudinary.uploader.destroy(publicId, (err, result) => {
    if (err) console.error("Failed to delete image from Cloudinary:", err);
  });
}
module.exports = deleteImg;
