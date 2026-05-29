// server/controllers/enrollmentController.js
const mongoose = require("mongoose");
const crypto = require("crypto");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");

// ============================================================
// HELPER: Find course by ObjectId or slug
// ============================================================
const findCourseByIdOrSlug = async (courseIdOrSlug) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(courseIdOrSlug);
  if (isObjectId) {
    return await Course.findById(courseIdOrSlug);
  }
  return await Course.findOne({ slug: courseIdOrSlug });
};

// ============================================================
// HELPER: Filter only published lessons from sections
// ============================================================
const filterPublishedLessons = (sections = []) => {
  if (!Array.isArray(sections) || sections.length === 0) return [];

  return sections
    .map((section) => {
      const sectionData = section.toObject ? section.toObject() : { ...section };
      const lessons = sectionData.lessons || [];

      const publishedLessons = lessons.filter((lesson) => {
        const lessonData = lesson.toObject ? lesson.toObject() : lesson;
        return lessonData.isPublished === true;
      });

      console.log(
        `[Filter] Section "${sectionData.title}": ${lessons.length} total → ${publishedLessons.length} published`
      );

      return {
        ...sectionData,
        lessons: publishedLessons,
      };
    })
    .filter((section) => section.lessons.length > 0);
};

// ============================================================
// HELPER: Generate certificate number
// ============================================================
const generateCertificateNumber = () => {
  return `CERT-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

// ============================================================
// @desc   Enroll in free course
// @route  POST /api/enrollments/:courseId
// @access Private
// ============================================================
exports.enrollInCourse = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.isFree) {
      return res.status(400).json({
        success: false,
        message: "This course requires payment",
      });
    }

    const existing = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already enrolled in this course",
      });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: course._id,
      progress: [],
      completionPercentage: 0,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { purchasedCourses: course._id },
    });

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    console.error("❌ enrollInCourse error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Get single enrollment with PUBLISHED lessons only
// @route  GET /api/enrollments/:courseId
// @access Private
// ============================================================
exports.getEnrollment = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    })
      .populate({
        path: "course",
        select:
          "title slug thumbnail courseType duration level totalLessons totalDuration sections curriculum description",
      })
      .populate("order");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const courseObj = enrollment.course.toObject();
    const filteredSections = filterPublishedLessons(courseObj.sections || []);
    const filteredCurriculum = filterPublishedLessons(courseObj.curriculum || []);

    const totalPublishedLessons =
      filteredSections.reduce((sum, s) => sum + s.lessons.length, 0) ||
      filteredCurriculum.reduce((sum, s) => sum + s.lessons.length, 0);

    const totalPublishedDuration =
      filteredSections.reduce(
        (sum, s) => sum + s.lessons.reduce((d, l) => d + (l.videoDuration || l.duration || 0), 0),
        0
      ) ||
      filteredCurriculum.reduce(
        (sum, s) => sum + s.lessons.reduce((d, l) => d + (l.videoDuration || l.duration || 0), 0),
        0
      );

    console.log(
      `📊 Course: ${courseObj.title} | Published lessons: ${totalPublishedLessons}`
    );

    const enrollmentObj = enrollment.toObject();

    res.status(200).json({
      success: true,
      enrollment: {
        ...enrollmentObj,
        course: {
          ...courseObj,
          sections: filteredSections,
          curriculum: filteredCurriculum,
          totalLessons: totalPublishedLessons,
          totalDuration: totalPublishedDuration,
        },
      },
    });
  } catch (error) {
    console.error("❌ getEnrollment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Update lesson progress
// @route  POST /api/enrollments/:courseId/progress/:lessonId
// @access Private
// ============================================================
exports.updateProgress = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    const { lessonId } = req.params;
    const { completed, watchedDuration } = req.body;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    // Find the section that contains this lesson (for sectionId reference)
    let sectionId = null;
    const sections = course.sections || course.curriculum || [];
    for (const section of sections) {
      const lessonExists = (section.lessons || []).some(
        (l) => l._id?.toString() === lessonId
      );
      if (lessonExists) {
        sectionId = section._id;
        break;
      }
    }

    // Find or create progress entry
    let existingProgress = enrollment.progress.find(
      (p) => p.lessonId?.toString() === lessonId
    );

    if (existingProgress) {
      if (completed !== undefined) existingProgress.completed = completed;
      if (watchedDuration !== undefined)
        existingProgress.watchedDuration = watchedDuration;
      if (completed && !existingProgress.completedAt) {
        existingProgress.completedAt = new Date();
      }
      if (sectionId && !existingProgress.sectionId) {
        existingProgress.sectionId = sectionId;
      }
    } else {
      enrollment.progress.push({
        lessonId,
        sectionId,
        completed: completed ?? false,
        watchedDuration: watchedDuration ?? 0,
        completedAt: completed ? new Date() : null,
      });
    }

    // Update last lesson watched
    enrollment.lastLessonId = lessonId;
    if (sectionId) enrollment.lastViewedSectionId = sectionId;

    // Recalculate based on PUBLISHED lessons only
    const publishedLessons = sections.flatMap((s) =>
      (s.lessons || []).filter((l) => l.isPublished === true)
    );
    const totalLessons = publishedLessons.length || 1;

    const completedLessons = enrollment.progress.filter(
      (p) => p.completed
    ).length;

    enrollment.completionPercentage = Math.min(
      100,
      Math.round((completedLessons / totalLessons) * 100)
    );

    // Issue certificate when complete
    let certificateIssued = false;
    if (
      enrollment.completionPercentage >= 100 &&
      !enrollment.completedAt
    ) {
      enrollment.completedAt = new Date();
      if (!enrollment.certificateNumber) {
        enrollment.certificateNumber = generateCertificateNumber();
        enrollment.certificateIssuedAt = new Date();
        certificateIssued = true;
      }
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      enrollment,
      progress: {
        completed: existingProgress?.completed || completed,
        completionPercentage: enrollment.completionPercentage,
        isCompleted: enrollment.completionPercentage >= 100,
        certificateIssued,
      },
    });
  } catch (error) {
    console.error("❌ updateProgress error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Get progress
// @route  GET /api/enrollments/:courseId/progress
// @access Private
// ============================================================
exports.getProgress = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      success: true,
      progress: enrollment.progress,
      completionPercentage: enrollment.completionPercentage,
      completedAt: enrollment.completedAt,
    });
  } catch (error) {
    console.error("❌ getProgress error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Get certificate
// @route  GET /api/enrollments/:courseId/certificate
// @access Private
// ============================================================
exports.getCertificate = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.completionPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: "You have not completed this course yet",
      });
    }

    res.status(200).json({
      success: true,
      certificate: {
        certificateNumber: enrollment.certificateNumber,
        issuedAt: enrollment.certificateIssuedAt || enrollment.completedAt,
        course: course.title,
        user: req.user.name,
      },
    });
  } catch (error) {
    console.error("❌ getCertificate error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Verify certificate (public)
// @route  GET /api/enrollments/verify-certificate/:certificateNumber
// @access Public
// ============================================================
exports.verifyCertificate = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      certificateNumber: req.params.certificateNumber,
    })
      .populate("user", "name")
      .populate("course", "title");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      certificate: {
        studentName: enrollment.user?.name,
        courseName: enrollment.course?.title,
        issuedAt: enrollment.certificateIssuedAt || enrollment.completedAt,
        certificateNumber: enrollment.certificateNumber,
      },
    });
  } catch (error) {
    console.error("❌ verifyCertificate error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Get lesson comments
// @route  GET /api/enrollments/:courseId/lessons/:lessonId/comments
// @access Private
// ============================================================
exports.getLessonComments = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Get all enrollments for this course (so we see comments from other students too)
    const enrollments = await Enrollment.find({
      course: course._id,
    }).lean();

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({ success: true, comments: [] });
    }

    // Collect all comments for this lesson across all students
    const allComments = [];
    enrollments.forEach((enrollment) => {
      const lessonProgress = enrollment.progress?.find(
        (p) => p.lessonId?.toString() === req.params.lessonId
      );
      if (lessonProgress?.comments?.length > 0) {
        allComments.push(...lessonProgress.comments);
      }
    });

    if (allComments.length === 0) {
      return res.status(200).json({ success: true, comments: [] });
    }

    // Collect all unique user IDs (commenters + repliers)
    const userIds = new Set();
    allComments.forEach((c) => {
      if (c.user) userIds.add(c.user.toString());
      (c.replies || []).forEach((r) => {
        if (r.user) userIds.add(r.user.toString());
      });
    });

    // Fetch user names in one query
    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    })
      .select("name role")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = {
        name: u.name,
        role: u.role,
      };
    });

    // Attach user info to each comment + reply
    const enrichedComments = allComments.map((c) => ({
      ...c,
      user: {
        _id: c.user,
        name: userMap[c.user?.toString()]?.name || "Deleted User",
        role: userMap[c.user?.toString()]?.role || "user",
      },
      replies: (c.replies || []).map((r) => ({
        ...r,
        user: {
          _id: r.user,
          name: userMap[r.user?.toString()]?.name || "Deleted User",
          role: userMap[r.user?.toString()]?.role || "user",
        },
      })),
    }));

    // Sort by newest first
    enrichedComments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      comments: enrichedComments,
    });
  } catch (error) {
    console.error("❌ getLessonComments error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Add lesson comment
// @route  POST /api/enrollments/:courseId/lessons/:lessonId/comments
// @access Private
// ============================================================
exports.addLessonComment = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    let lessonProgress = enrollment.progress.find(
      (p) => p.lessonId?.toString() === req.params.lessonId
    );

    if (!lessonProgress) {
      enrollment.progress.push({
        lessonId: req.params.lessonId,
        completed: false,
        watchedDuration: 0,
        comments: [],
      });
      lessonProgress = enrollment.progress[enrollment.progress.length - 1];
    }

    if (!lessonProgress.comments) {
      lessonProgress.comments = [];
    }

    lessonProgress.comments.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
      replies: [],
    });

    await enrollment.save();

    const newComment = lessonProgress.comments[lessonProgress.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: {
        ...newComment.toObject(),
        user: {
          _id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    console.error("❌ addLessonComment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Reply to comment
// @route  POST /api/enrollments/:courseId/lessons/:lessonId/comments/:commentId/replies
// @access Private
// ============================================================
exports.replyToComment = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply text is required",
      });
    }

    // Find the enrollment (any) that contains this comment
    const enrollments = await Enrollment.find({
      course: course._id,
    });

    let targetEnrollment = null;
    let targetComment = null;

    for (const enrollment of enrollments) {
      const lessonProgress = enrollment.progress?.find(
        (p) => p.lessonId?.toString() === req.params.lessonId
      );

      if (lessonProgress?.comments?.length > 0) {
        const comment = lessonProgress.comments.find(
          (c) => c._id?.toString() === req.params.commentId
        );
        if (comment) {
          targetEnrollment = enrollment;
          targetComment = comment;
          break;
        }
      }
    }

    if (!targetComment || !targetEnrollment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (!targetComment.replies) {
      targetComment.replies = [];
    }

    targetComment.replies.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await targetEnrollment.save();

    const newReply = targetComment.replies[targetComment.replies.length - 1];

    res.status(201).json({
      success: true,
      reply: {
        ...newReply.toObject(),
        user: {
          _id: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    console.error("❌ replyToComment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Delete comment
// @route  DELETE /api/enrollments/:courseId/lessons/:lessonId/comments/:commentId
// @access Private
// ============================================================
exports.deleteComment = async (req, res) => {
  try {
    const course = await findCourseByIdOrSlug(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    const lessonProgress = enrollment.progress.find(
      (p) => p.lessonId?.toString() === req.params.lessonId
    );

    if (!lessonProgress) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const commentIndex = lessonProgress.comments?.findIndex(
      (c) => c._id?.toString() === req.params.commentId
    );

    if (commentIndex === -1 || commentIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const comment = lessonProgress.comments[commentIndex];
    if (
      comment.user?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    lessonProgress.comments.splice(commentIndex, 1);
    await enrollment.save();

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("❌ deleteComment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Get my enrollments
// @route  GET /api/enrollments/my-courses
// @access Private
// ============================================================
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate(
        "course",
        "title slug thumbnail courseType duration level price discountPrice totalLessons"
      )
      .sort("-createdAt");

    res.status(200).json({ success: true, enrollments });
  } catch (error) {
    console.error("❌ getMyEnrollments error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// @desc   Get all enrollments (admin)
// @route  GET /api/enrollments/admin/all
// @access Private/Admin
// ============================================================
exports.getAllEnrollmentsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Enrollment.countDocuments();

    const enrollments = await Enrollment.find()
      .populate("user", "name email")
      .populate("course", "title slug courseType")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      enrollments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("❌ getAllEnrollmentsAdmin error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};