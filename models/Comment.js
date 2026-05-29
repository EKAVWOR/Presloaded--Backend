// server/models/Comment.js
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    content: { type: String, required: true, trim: true },
    replies: [replySchema],
    isInstructor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ course: 1, lessonId: 1 });
commentSchema.index({ user: 1 });

module.exports = mongoose.model("Comment", commentSchema);