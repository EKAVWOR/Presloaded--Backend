// server/models/Enrollment.js
const mongoose = require("mongoose");

// ============================================================
// Reply sub-schema
// ============================================================
const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ============================================================
// Comment sub-schema
// ============================================================
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ============================================================
// Lesson Progress sub-schema
// ============================================================
const lessonProgressSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // ✅ Optional now
    },
    completed: {
      type: Boolean,
      default: false,
    },
    watchedDuration: {
      type: Number, // seconds
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    comments: { type: [commentSchema], default: [] },
  },
  { _id: false }
);

// ============================================================
// Main Enrollment Schema
// ============================================================
const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    progress: { type: [lessonProgressSchema], default: [] },

    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    certificateNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    certificateIssuedAt: {
      type: Date,
      default: null,
    },

    admissionLetterSent: {
      type: Boolean,
      default: false,
    },

    lastViewedSectionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    lastLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// Virtuals
// ============================================================
enrollmentSchema.virtual("isCompleted").get(function () {
  return this.completionPercentage >= 100;
});

// ============================================================
// Indexes
// ============================================================
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ user: 1, completionPercentage: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);