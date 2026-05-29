// server/models/Certificate.js
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
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
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    certificateNumber: {
      type: String,
      unique: true, // ✅ this already creates an index
      required: true,
    },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String, default: "" },
    pdfPublicId: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Removed duplicate: certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);