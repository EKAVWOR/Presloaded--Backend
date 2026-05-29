// server/routes/enrollmentRoutes.js
const express = require("express");
const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  getEnrollment,
  updateProgress,
  getProgress,
  getCertificate,
  verifyCertificate,
  getLessonComments,
  addLessonComment,
  replyToComment,
  deleteComment,
  getAllEnrollmentsAdmin,
} = require("../controllers/enrollmentController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

// ============================================================
// PUBLIC
// ============================================================
router.get(
  "/verify-certificate/:certificateNumber",
  verifyCertificate
);

// ============================================================
// ADMIN
// ============================================================
router.get("/admin/all", protect, adminOnly, getAllEnrollmentsAdmin);

// ============================================================
// PROTECTED — static paths first
// ============================================================
router.get("/my-courses", protect, getMyEnrollments);

// Enroll in free course
router.post("/:courseId", protect, enrollInCourse);

// Get single enrollment + full progress
router.get("/:courseId", protect, getEnrollment);

// Progress
router.post("/:courseId/progress/:lessonId", protect, updateProgress);
router.get("/:courseId/progress", protect, getProgress);

// Certificate
router.get("/:courseId/certificate", protect, getCertificate);

// Comments
router.get("/:courseId/lessons/:lessonId/comments", protect, getLessonComments);
router.post("/:courseId/lessons/:lessonId/comments", protect, addLessonComment);
router.post("/:courseId/lessons/:lessonId/comments/:commentId/replies", protect, replyToComment);
router.delete("/:courseId/lessons/:lessonId/comments/:commentId", protect, deleteComment);

module.exports = router;

