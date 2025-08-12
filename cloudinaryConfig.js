const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "watchbuddy_videos", // folder name in Cloudinary
    resource_type: "video", // important for non-image files
    allowed_formats: ["mp4", "webm", "ogg"],
  },
});

module.exports = { cloudinary, storage };
