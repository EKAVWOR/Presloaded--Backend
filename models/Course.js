// server/models/Course.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const normalizeCourseType = (v) => {
  if (!v) return "online";
  const x = String(v).trim().toLowerCase();
  return x === "offline" ? "offline" : "online";
};

const normalizeLevel = (v) => {
  if (!v) return "beginner";
  return String(v).trim().toLowerCase();
};

// ===== Sub-schemas =====

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["pdf", "doc", "zip", "link", "other"],
      default: "other",
    },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    // Legacy offline field
    duration: { type: String, trim: true, default: "" },
    // Online video fields
    videoUrl: { type: String, trim: true, default: "" },
    videoPublicId: { type: String, trim: true, default: "" },
    thumbnailUrl: { type: String, trim: true, default: "" },
    videoDuration: { type: Number, default: 0 }, // seconds
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false }, // preview lesson
    isPublished: { type: Boolean, default: false },
    resources: { type: [resourceSchema], default: [] },
  },
  { timestamps: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    lessons: { type: [lessonSchema], default: [] },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ===== Main Course Schema =====

const courseSchema = new mongoose.Schema(
  {
    // ===== Basic Information =====
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    courseType: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
      set: normalizeCourseType,
    },

    category: {
      type: String,
      required: [true, "Course category is required"],
      trim: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
      set: normalizeLevel,
    },

    instructor: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "English" },

    // ===== Pricing =====
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: [0, "Discount price cannot be negative"],
    },

    isFree: { type: Boolean, default: false },

    // ===== Media =====
    thumbnail: { type: String, trim: true, default: "" },
    thumbnailPublicId: { type: String, trim: true, default: "" },
    previewVideoUrl: { type: String, trim: true, default: "" }, // course trailer

    // ===== Offline Course Fields =====
    location: {
      type: String,
      trim: true,
      default: "",
    },

    schedule: {
      type: String,
      trim: true,
      default: "",
    },

    startDate: { type: Date },

    // ===== Online Course Fields =====
    onlinePlatformUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // ===== Curriculum =====
    // Legacy offline curriculum (kept for backward compatibility)
    curriculum: {
      type: [
        new mongoose.Schema(
          {
            title: { type: String, trim: true, default: "" },
            lessons: {
              type: [
                new mongoose.Schema(
                  {
                    title: { type: String, trim: true, default: "" },
                    duration: { type: String, trim: true, default: "" },
                    videoUrl: { type: String, trim: true, default: "" },
                  },
                  { _id: false }
                ),
              ],
              default: [],
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // New online course curriculum
    sections: { type: [sectionSchema], default: [] },

    // ===== Computed Stats (auto-updated) =====
    totalLessons: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // seconds
    totalSections: { type: Number, default: 0 },

    // ===== Learning Outcomes =====
    whatYouWillLearn: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    // ===== Reviews =====
    reviews: { type: [reviewSchema], default: [] },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    // ===== Flags =====
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    hasCertificate: { type: Boolean, default: true },

    // ===== Metrics =====
    studentsEnrolled: { type: Number, default: 0, min: 0 },

    // Legacy metric fields (kept for backward compatibility)
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// ===== Pre-validate: clean fields based on courseType =====
courseSchema.pre("validate", function () {
  this.courseType = normalizeCourseType(this.courseType);
  this.level = normalizeLevel(this.level);

  if (this.courseType === "online") {
    this.location = "";
    this.schedule = "";
    this.startDate = undefined;
  }

  if (this.courseType === "offline") {
    this.onlinePlatformUrl = "";
  }
});

// ===== Pre-save: slug generation + stats + discount clamp =====
courseSchema.pre("save", function () {
  // Slug
  if (this.isModified("title")) {
    const base = slugify(this.title, { lower: true, strict: true, trim: true });
    this.slug = `${base}-${Date.now().toString(36)}`;
  }

  // Discount clamp
  if (this.discountPrice && this.discountPrice >= this.price) {
    this.discountPrice = 0;
  }

  // Auto-compute online course stats from sections
  if (this.sections && this.sections.length > 0) {
    let totalLessons = 0;
    let totalDuration = 0;

    this.sections.forEach((section) => {
      totalLessons += section.lessons.length;
      section.lessons.forEach((lesson) => {
        totalDuration += lesson.videoDuration || 0;
      });
    });

    this.totalLessons = totalLessons;
    this.totalDuration = totalDuration;
    this.totalSections = this.sections.length;
  }
});

// ===== Pre-update: handle findOneAndUpdate =====
courseSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  const $set = update.$set || update;

  if ($set.title) {
    const base = slugify($set.title, {
      lower: true,
      strict: true,
      trim: true,
    });
    $set.slug = `${base}-${Date.now().toString(36)}`;
  }

  if ($set.courseType) $set.courseType = normalizeCourseType($set.courseType);
  if ($set.level) $set.level = normalizeLevel($set.level);

  if ($set.courseType === "online") {
    $set.location = "";
    $set.schedule = "";
    $set.startDate = undefined;
  }

  if ($set.courseType === "offline") {
    $set.onlinePlatformUrl = "";
  }

  const nextPrice = $set.price;
  const nextDiscount = $set.discountPrice;
  if (
    typeof nextPrice === "number" &&
    typeof nextDiscount === "number" &&
    nextDiscount >= nextPrice
  ) {
    $set.discountPrice = 0;
  }

  if (update.$set) update.$set = $set;
  this.setUpdate(update);
});

// ===== Instance method: update average rating =====
courseSchema.methods.updateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
    this.rating = 0;
    this.reviewsCount = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating =
      Math.round((total / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
    // Keep legacy fields in sync
    this.rating = this.averageRating;
    this.reviewsCount = this.totalReviews;
  }
};

// ===== Indexes =====
courseSchema.index({ courseType: 1, isPublished: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ title: "text", description: "text", shortDescription: "text" });

module.exports = mongoose.model("Course", courseSchema);