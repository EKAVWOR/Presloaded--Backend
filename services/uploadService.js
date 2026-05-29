// server/services/uploadService.js
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const path = require("path");

// Memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const allowed = [
    "mp4", "mov", "avi", "mkv", "webm", // videos
    "jpeg", "jpg", "png", "webp",       // images
    "pdf", "doc", "docx", "zip"         // docs
  ];
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: .${ext}`), false);
  }
};

// 1GB limit
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter,
});

// Upload video to Cloudinary
const uploadVideo = (buffer, folder = "courses/videos") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder,
        chunk_size: 6000000, // 6MB chunks
        eager: [{ streaming_profile: "full_hd", format: "m3u8" }],
        eager_async: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Upload image
const uploadImage = (buffer, folder = "courses/thumbnails") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        transformation: [{ width: 1280, height: 720, crop: "fill" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Upload resource (PDF, etc)
const uploadResource = (buffer, originalName, folder = "courses/resources") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        public_id: `${Date.now()}-${originalName}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

module.exports = {
  upload,
  uploadVideo,
  uploadImage,
  uploadResource,
  deleteFromCloudinary,
};