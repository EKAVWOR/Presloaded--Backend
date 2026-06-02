// // server/services/uploadService.js
// const cloudinary = require("../config/cloudinary");
// const multer = require("multer");
// const path = require("path");

// // Memory storage
// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
//   const allowed = [
//     "mp4", "mov", "avi", "mkv", "webm", // videos
//     "jpeg", "jpg", "png", "webp",       // images
//     "pdf", "doc", "docx", "zip"         // docs
//   ];
//   if (allowed.includes(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Unsupported file type: .${ext}`), false);
//   }
// };

// // 1GB limit
// const upload = multer({
//   storage,
//   limits: { fileSize: 1024 * 1024 * 1024 },
//   fileFilter,
// });

// // Upload video to Cloudinary
// const uploadVideo = (buffer, folder = "courses/videos") => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         resource_type: "video",
//         folder,
//         chunk_size: 6000000, // 6MB chunks
//         eager: [{ streaming_profile: "full_hd", format: "m3u8" }],
//         eager_async: true,
//       },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result);
//       }
//     );
//     stream.end(buffer);
//   });
// };

// // Upload image
// const uploadImage = (buffer, folder = "courses/thumbnails") => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         resource_type: "image",
//         folder,
//         transformation: [{ width: 1280, height: 720, crop: "fill" }],
//       },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result);
//       }
//     );
//     stream.end(buffer);
//   });
// };

// // Upload resource (PDF, etc)
// const uploadResource = (buffer, originalName, folder = "courses/resources") => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         resource_type: "raw",
//         folder,
//         public_id: `${Date.now()}-${originalName}`,
//       },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result);
//       }
//     );
//     stream.end(buffer);
//   });
// };

// // Delete from Cloudinary
// const deleteFromCloudinary = async (publicId, resourceType = "image") => {
//   try {
//     await cloudinary.uploader.destroy(publicId, {
//       resource_type: resourceType,
//     });
//   } catch (error) {
//     console.error("Cloudinary delete error:", error.message);
//   }
// };

// module.exports = {
//   upload,
//   uploadVideo,
//   uploadImage,
//   uploadResource,
//   deleteFromCloudinary,
// };

// server/services/uploadService.js
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const path = require("path");

// ============================================================
// MULTER — Memory Storage
// ============================================================

// ✅ Only for images, docs and resources
// ✅ Videos are NO longer handled here — go directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

  const allowed = [
    "mp4", "mov", "avi", "mkv", "webm", // videos
    "jpeg", "jpg", "png", "webp",   // images
    "pdf", "doc", "docx", "zip",    // docs
  ];

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: .${ext}`), false);
  }
};

// ✅ Reduced from 1GB to 10mb — no videos go through server anymore
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10mb max
  fileFilter,
});

// ============================================================
// CLOUDINARY UPLOADS
// ============================================================

// ✅ REMOVED uploadVideo — videos now go directly from
//    browser to Cloudinary using useCloudinaryVideoUpload hook

// @desc   Upload image to Cloudinary (thumbnail etc)
// @param  buffer  — file buffer from multer
// @param  folder  — Cloudinary folder name
const uploadImage = (buffer, folder = "tech-academy/courses/thumbnails") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        transformation: [
          { width: 800, height: 450, crop: "fill" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// @desc   Upload resource file (PDF, DOC, ZIP) to Cloudinary
// @param  buffer        — file buffer from multer
// @param  originalName  — original file name
// @param  folder        — Cloudinary folder name
const uploadResource = (
  buffer,
  originalName,
  folder = "tech-academy/courses/resources"
) => {
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

// @desc   Delete any file from Cloudinary
// @param  publicId      — the public_id returned by Cloudinary
// @param  resourceType  — "image" | "video" | "raw"
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      console.warn(
        `Cloudinary delete warning for ${publicId}:`,
        result.result
      );
    }

    return result;
  } catch (error) {
    console.error(
      `Cloudinary delete error for ${publicId}:`,
      error.message
    );
    throw error; // ✅ Throw so caller knows it failed
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  upload,           // ✅ Multer — for images and docs only
  uploadImage,      // ✅ Cloudinary image upload
  uploadResource,   // ✅ Cloudinary resource upload (PDF, ZIP etc)
  deleteFromCloudinary, // ✅ Cloudinary delete
  // ❌ uploadVideo REMOVED — videos bypass server
};