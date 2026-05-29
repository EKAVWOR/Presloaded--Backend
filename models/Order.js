// const mongoose = require("mongoose");

// const orderCourseSchema = new mongoose.Schema(
//   {
//     courseId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Course",
//       required: true,
//     },
//     title: { type: String, required: true },
//     price: { type: Number, required: true },
//   },
//   { _id: false }
// );

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     courses: [orderCourseSchema],
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "completed", "failed", "refunded"],
//       default: "pending",
//     },
//     paystackReference: {
//       type: String,
//       required: true,
//     },
//     paystackTransactionId: {
//       type: String,
//       default: "",
//     },
//     paystackChannel: {
//       type: String,
//       default: "",
//     },
//     admissionLetterSent: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");

const orderCourseSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ faster queries for getMyOrders
    },
    courses: [orderCourseSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true, // ✅ faster admin queries by status
    },
    paystackReference: {
      type: String,
      required: true,
      unique: true,  // ✅ prevents duplicate orders for same payment
      index: true,   // ✅ faster lookup during verification
    },
    paystackTransactionId: {
      type: String,
      default: "",
    },
    paystackChannel: {
      type: String,
      default: "",
    },
    admissionLetterSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Compound index for admin queries (status + date)
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

// ✅ Compound index for user order history
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);