// server/controllers/courseController.js
const Course = require("../models/Course");
const cloudinary = require("../config/cloudinary");
const { deleteFromCloudinary } = require("../services/uploadService");

// ============================================================
// HELPERS
// ============================================================

const normalizeCourseType = (v) => {
  if (!v) return undefined;
  const x = String(v).trim().toLowerCase();
  return x === "offline" ? "offline" : "online";
};

const normalizeLevel = (v) => {
  if (!v) return undefined;
  return String(v).trim().toLowerCase();
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pick = (obj, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
};

// ✅ Detect video type from URL
const detectVideoType = (url) => {
  if (!url) return "";
  const u = String(url).toLowerCase();

  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("cloudinary.com")) return "cloudinary";
  if (u.includes("vimeo.com")) return "vimeo";

  return "";
};

// ✅ Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
};

const buildCoursePayload = (body) => {
  const allowedFields = [
    "title",
    "shortDescription",
    "description",
    "courseType",
    "category",
    "level",
    "duration",
    "thumbnail",
    "thumbnailPublicId",
    "price",
    "discountPrice",
    "isFree",
    "instructor",
    "language",
    "location",
    "schedule",
    "startDate",
    "onlinePlatformUrl",
    "curriculum",
    "whatYouWillLearn",
    "requirements",
    "tags",
    "isPublished",
    "isFeatured",
    "hasCertificate",
    "previewVideoUrl",
  ];

  const payload = pick(body, allowedFields);

  if (payload.courseType !== undefined)
    payload.courseType = normalizeCourseType(payload.courseType);
  if (payload.level !== undefined)
    payload.level = normalizeLevel(payload.level);
  if (payload.price !== undefined) payload.price = toNumber(payload.price, 0);
  if (payload.discountPrice !== undefined)
    payload.discountPrice = toNumber(payload.discountPrice, 0);
  if (payload.startDate === "") payload.startDate = undefined;
  if (payload.startDate) payload.startDate = new Date(payload.startDate);

  // Trim string fields
  for (const k of [
    "title",
    "shortDescription",
    "description",
    "category",
    "duration",
    "thumbnail",
    "location",
    "schedule",
    "onlinePlatformUrl",
    "instructor",
    "language",
  ]) {
    if (payload[k] !== undefined && typeof payload[k] === "string") {
      payload[k] = payload[k].trim();
    }
  }

  // Clean offline curriculum
  if (Array.isArray(payload.curriculum)) {
    payload.curriculum = payload.curriculum
      .map((m) => ({
        title: (m?.title || "").trim(),
        lessons: Array.isArray(m?.lessons)
          ? m.lessons
              .map((l) => ({
                title: (l?.title || "").trim(),
                duration: (l?.duration || "").trim(),
                videoUrl: (l?.videoUrl || "").trim(),
              }))
              .filter((l) => l.title)
          : [],
      }))
      .filter((m) => m.title);
  }

  // Clean array fields
  if (Array.isArray(payload.whatYouWillLearn)) {
    payload.whatYouWillLearn = payload.whatYouWillLearn
      .map((s) => String(s).trim())
      .filter(Boolean);
  }

  if (Array.isArray(payload.requirements)) {
    payload.requirements = payload.requirements
      .map((s) => String(s).trim())
      .filter(Boolean);
  }

  if (Array.isArray(payload.tags)) {
    payload.tags = payload.tags.map((s) => String(s).trim()).filter(Boolean);
  }

  // Clamp discount
  if (
    typeof payload.price === "number" &&
    typeof payload.discountPrice === "number" &&
    payload.discountPrice >= payload.price
  ) {
    payload.discountPrice = 0;
  }

  return payload;
};

const validateDeliveryFields = ({ courseType, location }) => {
  if (courseType === "offline") {
    if (!location || !String(location).trim()) {
      return "Offline courses require a location";
    }
  }
  return null;
};

const cleanupDeliveryFields = (docOrPayload, courseType) => {
  if (courseType === "online") {
    docOrPayload.location = "";
    docOrPayload.schedule = "";
    docOrPayload.startDate = undefined;
  }
  if (courseType === "offline") {
    docOrPayload.onlinePlatformUrl = "";
  }
};

// ============================================================
// PUBLIC ROUTES
// ============================================================

// @desc    Get all published courses (public)
// @route   GET /api/courses
exports.getCourses = async (req, res, next) => {
  try {
    const {
      search,
      courseType,
      category,
      level,
      featured,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isPublished: true };

    if (courseType) query.courseType = normalizeCourseType(courseType);
    if (category) query.category = String(category).trim();
    if (level) query.level = normalizeLevel(level);
    if (featured === "true") query.isFeatured = true;

    if (search) {
      const s = String(search).trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { shortDescription: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
        { category: { $regex: s, $options: "i" } },
      ];
    }

    let sortOption = {};
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "popular":
        sortOption = { studentsEnrolled: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const total = await Course.countDocuments(query);

    const courses = await Course.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select(
        "title slug shortDescription courseType category level price " +
          "discountPrice isFree duration thumbnail isFeatured averageRating " +
          "totalReviews studentsEnrolled location schedule startDate " +
          "onlinePlatformUrl totalLessons totalDuration totalSections " +
          "instructor language createdAt"
      );

    res.status(200).json({
      success: true,
      courses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCourses: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course by slug (public)
// @route   GET /api/courses/:slug
exports.getCourseBySlug = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let courseData = course.toObject();

    // ✅ Hide video URLs for non-enrolled users on online courses
    if (course.courseType === "online") {
      let isEnrolled = false;

      if (req.user) {
        try {
          const Enrollment = require("../models/Enrollment");
          const enrollment = await Enrollment.findOne({
            user: req.user._id,
            course: course._id,
          });
          isEnrolled = !!enrollment;
        } catch (err) {
          isEnrolled = false;
        }
      }

      if (!isEnrolled) {
        courseData.sections = (courseData.sections || []).map((section) => ({
          ...section,
          lessons: (section.lessons || []).map((lesson) => ({
            ...lesson,
            videoUrl: lesson.isFree ? lesson.videoUrl : "",
            videoPublicId: lesson.isFree ? lesson.videoPublicId : "",
            videoType: lesson.isFree ? lesson.videoType : "",
          })),
        }));
      }
    }

    res.status(200).json({ success: true, course: courseData });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN — COURSE CRUD
// ============================================================

// @desc    Get all courses including unpublished (admin)
// @route   GET /api/courses/admin/all
exports.getAllCoursesAdmin = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .sort("-createdAt")
      .select(
        "title slug courseType category level price discountPrice " +
          "isFree thumbnail isPublished isFeatured studentsEnrolled " +
          "totalLessons totalSections averageRating createdAt instructor"
      );

    res.status(200).json({ success: true, courses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course (admin)
// @route   POST /api/courses
exports.createCourse = async (req, res, next) => {
  try {
    const payload = buildCoursePayload(req.body);
    payload.courseType = payload.courseType || "online";

    const msg = validateDeliveryFields(payload);
    if (msg) {
      return res.status(400).json({ success: false, message: msg });
    }

    cleanupDeliveryFields(payload, payload.courseType);

    const course = await Course.create(payload);
    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course (admin)
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const payload = buildCoursePayload(req.body);
    const nextCourseType = payload.courseType || course.courseType;

    course.set({ ...payload, courseType: nextCourseType });

    const msg = validateDeliveryFields({
      courseType: nextCourseType,
      location: course.location,
    });
    if (msg) {
      return res.status(400).json({ success: false, message: msg });
    }

    cleanupDeliveryFields(course, nextCourseType);
    await course.save();

    res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course (admin)
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ✅ Delete only Cloudinary videos (skip YouTube)
    if (course.sections && course.sections.length > 0) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (lesson.videoPublicId && lesson.videoType === "cloudinary") {
            try {
              await deleteFromCloudinary(lesson.videoPublicId, "video");
            } catch (err) {
              console.error(
                `Failed to delete video ${lesson.videoPublicId}:`,
                err.message
              );
            }
          }
        }
      }
    }

    // ✅ Delete thumbnail from Cloudinary
    if (course.thumbnailPublicId) {
      try {
        await deleteFromCloudinary(course.thumbnailPublicId, "image");
      } catch (err) {
        console.error(
          `Failed to delete thumbnail ${course.thumbnailPublicId}:`,
          err.message
        );
      }
    }

    await course.deleteOne();
    res.status(200).json({ success: true, message: "Course deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload course thumbnail (admin)
// @route   POST /api/courses/upload-thumbnail
exports.uploadThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "tech-academy/courses/thumbnails",
          transformation: [
            { width: 800, height: 450, crop: "fill" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN — CURRICULUM BUILDER
// ============================================================

// @desc    Get full course curriculum (admin)
// @route   GET /api/courses/:id/curriculum
exports.getCurriculum = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).select(
      "sections totalLessons totalDuration totalSections title courseType"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      sections: course.sections || [],
      stats: {
        totalLessons: course.totalLessons || 0,
        totalDuration: course.totalDuration || 0,
        totalSections: course.totalSections || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add section to course
// @route   POST /api/courses/:id/sections
exports.addSection = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const { title, description } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Section title is required",
      });
    }

    course.sections.push({
      title: title.trim(),
      description: (description || "").trim(),
      order: course.sections.length,
      lessons: [],
    });

    await course.save();

    const newSection = course.sections[course.sections.length - 1];
    res.status(201).json({ success: true, section: newSection });
  } catch (error) {
    next(error);
  }
};

// @desc    Update section
// @route   PUT /api/courses/:id/sections/:sectionId
exports.updateSection = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const { title, description, order } = req.body;
    if (title && title.trim()) section.title = title.trim();
    if (description !== undefined) section.description = description.trim();
    if (order !== undefined) section.order = Number(order);

    await course.save();
    res.status(200).json({ success: true, section });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete section
// @route   DELETE /api/courses/:id/sections/:sectionId
exports.deleteSection = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // ✅ Delete only Cloudinary videos (skip YouTube)
    for (const lesson of section.lessons) {
      if (lesson.videoPublicId && lesson.videoType === "cloudinary") {
        try {
          await deleteFromCloudinary(lesson.videoPublicId, "video");
        } catch (err) {
          console.error(
            `Failed to delete video ${lesson.videoPublicId}:`,
            err.message
          );
        }
      }
    }

    section.deleteOne();
    await course.save();

    res.status(200).json({ success: true, message: "Section deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Add lesson to section
// @route   POST /api/courses/:id/sections/:sectionId/lessons
exports.addLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const { title, description, isFree } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Lesson title is required",
      });
    }

    section.lessons.push({
      title: title.trim(),
      description: (description || "").trim(),
      isFree: isFree === true || isFree === "true",
      order: section.lessons.length,
      videoUrl: "",
      videoPublicId: "",
      videoType: "",
      videoDuration: 0,
      thumbnailUrl: "",
      isPublished: false,
      resources: [],
    });

    await course.save();

    const newLesson = section.lessons[section.lessons.length - 1];
    res.status(201).json({ success: true, lesson: newLesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lesson details
// @route   PUT /api/courses/:id/sections/:sectionId/lessons/:lessonId
exports.updateLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const lesson = section.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const { title, description, isFree, isPublished, order, resources } =
      req.body;

    if (title && title.trim()) lesson.title = title.trim();
    if (description !== undefined) lesson.description = description.trim();
    if (isFree !== undefined)
      lesson.isFree = isFree === true || isFree === "true";
    if (isPublished !== undefined)
      lesson.isPublished = isPublished === true || isPublished === "true";
    if (order !== undefined) lesson.order = Number(order);
    if (Array.isArray(resources)) lesson.resources = resources;

    await course.save();
    res.status(200).json({ success: true, lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lesson
// @route   DELETE /api/courses/:id/sections/:sectionId/lessons/:lessonId
exports.deleteLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const lesson = section.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // ✅ Delete only Cloudinary videos (skip YouTube)
    if (lesson.videoPublicId && lesson.videoType === "cloudinary") {
      try {
        await deleteFromCloudinary(lesson.videoPublicId, "video");
      } catch (err) {
        console.error(
          `Failed to delete video ${lesson.videoPublicId}:`,
          err.message
        );
      }
    }

    lesson.deleteOne();
    await course.save();

    res.status(200).json({ success: true, message: "Lesson deleted" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✅ SAVE LESSON VIDEO URL (YouTube, Cloudinary, Vimeo)
// @route POST /api/courses/:id/sections/:sectionId/lessons/:lessonId/video
// ============================================================
exports.uploadLessonVideo = async (req, res, next) => {
  try {
    const {
      videoUrl,
      videoPublicId,
      videoDuration,
      thumbnailUrl,
      videoType: providedType,
    } = req.body;

    // ✅ Validate URL exists
    if (!videoUrl || !String(videoUrl).trim()) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required",
      });
    }

    // ✅ Auto-detect video type from URL
    const detectedType = detectVideoType(videoUrl);
    const videoType = providedType || detectedType;

    // ✅ Accept YouTube, Cloudinary, OR Vimeo URLs
    if (!videoType) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid video URL. Must be a YouTube, Cloudinary, or Vimeo URL.",
      });
    }

    // ✅ Validate YouTube URL format if YouTube
    if (videoType === "youtube") {
      const ytId = getYouTubeVideoId(videoUrl);
      if (!ytId) {
        return res.status(400).json({
          success: false,
          message: "Invalid YouTube URL format",
        });
      }
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const lesson = section.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // ✅ Delete old Cloudinary video if replacing (skip YouTube)
    if (
      lesson.videoPublicId &&
      lesson.videoType === "cloudinary" &&
      lesson.videoPublicId !== videoPublicId
    ) {
      try {
        await deleteFromCloudinary(lesson.videoPublicId, "video");
      } catch (err) {
        console.error(
          `Failed to delete old video ${lesson.videoPublicId}:`,
          err.message
        );
      }
    }

    // ✅ Auto-generate YouTube thumbnail if not provided
    let finalThumbnail = thumbnailUrl || "";
    if (videoType === "youtube" && !finalThumbnail) {
      const ytId = getYouTubeVideoId(videoUrl);
      if (ytId) {
        finalThumbnail = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      }
    }

    // ✅ Auto-generate publicId for YouTube
    let finalPublicId = videoPublicId || "";
    if (videoType === "youtube" && !finalPublicId) {
      const ytId = getYouTubeVideoId(videoUrl);
      if (ytId) {
        finalPublicId = ytId;
      }
    }

    // ✅ Save video data
    lesson.videoUrl = videoUrl.trim();
    lesson.videoPublicId = finalPublicId;
    lesson.videoType = videoType;
    lesson.videoDuration = Math.round(Number(videoDuration) || 0);
    lesson.thumbnailUrl = finalThumbnail;
    lesson.isPublished = true;

    await course.save();

    res.status(200).json({
      success: true,
      message: `${
        videoType === "youtube" ? "YouTube" : "Video"
      } URL saved successfully`,
      lesson,
      video: {
        url: lesson.videoUrl,
        publicId: lesson.videoPublicId,
        type: lesson.videoType,
        duration: lesson.videoDuration,
        thumbnailUrl: lesson.thumbnailUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REVIEWS
// ============================================================

// @desc    Add review to course
// @route   POST /api/courses/:slug/reviews
exports.addReview = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Must be enrolled to review
    try {
      const Enrollment = require("../models/Enrollment");
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: course._id,
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: "You must be enrolled in this course to leave a review",
        });
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to leave a review",
      });
    }

    // ✅ One review per user
    const alreadyReviewed = course.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    course.reviews.push({
      user: req.user._id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    course.updateAverageRating();
    await course.save();

    const newReview = course.reviews[course.reviews.length - 1];

    res.status(201).json({
      success: true,
      message: "Review added",
      review: newReview,
      averageRating: course.averageRating,
      totalReviews: course.totalReviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (admin or owner)
// @route   DELETE /api/courses/:slug/reviews/:reviewId
exports.deleteReview = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const review = course.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    review.deleteOne();
    course.updateAverageRating();
    await course.save();

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    next(error);
  }
};