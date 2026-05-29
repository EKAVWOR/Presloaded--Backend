// server/routes/courseRoutes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/courseController");

// 🔍 DEBUG — temporary
console.log("===== Course Controller Functions =====");
Object.keys(controller).forEach((key) => {
  console.log(`${key}: ${typeof controller[key]}`);
});
console.log("=======================================");

const {
  getCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
  uploadThumbnail,
  getCurriculum,
  addSection,
  updateSection,
  deleteSection,
  addLesson,
  updateLesson,
  deleteLesson,
  uploadLessonVideo,
  addReview,
  deleteReview,

// ... rest of your routes file unchanged
} = require("../controllers/courseController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const { courseValidation } = require("../middleware/validate");
const upload = require("../middleware/upload");
const { upload: multipartUpload } = require("../services/uploadService");

// ============================================================
// PUBLIC — no auth needed
// ============================================================
router.get("/", getCourses);

// ============================================================
// ADMIN — static paths FIRST (before any /:param)
// ============================================================
router.get("/admin/all", protect, adminOnly, getAllCoursesAdmin);

router.post(
  "/upload-thumbnail",
  protect,
  adminOnly,
  upload.single("thumbnail"),
  uploadThumbnail
);

// Create course
router.post("/", protect, adminOnly, courseValidation, createCourse);

// ============================================================
// ADMIN — /:id routes (before /:slug catch-all)
// ============================================================

// Update / Delete course
router.put("/:id", protect, adminOnly, updateCourse);
router.delete("/:id", protect, adminOnly, deleteCourse);

// ── Curriculum ──────────────────────────────────────────────
router.get(
  "/:id/curriculum",
  protect,
  adminOnly,
  getCurriculum
);

// Sections
router.post(
  "/:id/sections",
  protect,
  adminOnly,
  addSection
);
router.put(
  "/:id/sections/:sectionId",
  protect,
  adminOnly,
  updateSection
);
router.delete(
  "/:id/sections/:sectionId",
  protect,
  adminOnly,
  deleteSection
);

// Lessons
router.post(
  "/:id/sections/:sectionId/lessons",
  protect,
  adminOnly,
  addLesson
);
router.put(
  "/:id/sections/:sectionId/lessons/:lessonId",
  protect,
  adminOnly,
  updateLesson
);
router.delete(
  "/:id/sections/:sectionId/lessons/:lessonId",
  protect,
  adminOnly,
  deleteLesson
);

// Video upload (1GB — uses uploadService multer, not middleware/upload)
router.post(
  "/:id/sections/:sectionId/lessons/:lessonId/video",
  protect,
  adminOnly,
  multipartUpload.single("video"),
  uploadLessonVideo
);

// ============================================================
// PROTECTED — Reviews (enrolled students only)
// ============================================================
router.post("/:slug/reviews", protect, addReview);
router.delete("/:slug/reviews/:reviewId", protect, deleteReview);

// ============================================================
// PUBLIC — /:slug MUST be last (catch-all param)
// ============================================================
router.get("/:slug", getCourseBySlug);

module.exports = router;