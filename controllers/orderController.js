// server/controllers/orderController.js
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Course = require("../models/Course");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const { verifyTransaction } = require("../services/paystackService");
const { generateAdmissionLetter } = require("../services/pdfService");
const {
  sendPurchaseConfirmation,
  sendAdmissionLetterEmail,
} = require("../services/emailService");

// ===== Helper: safely convert to ObjectId =====
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { courses, totalAmount, paystackReference } = req.body;
    const userId = req.user._id;

    // ✅ Check email verification
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before making a purchase",
      });
    }

    // ✅ Validate payload
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No courses in order",
      });
    }

    if (!paystackReference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    // ✅ Check for existing reference
    const existingOrder = await Order.findOne({ paystackReference });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "This payment reference has already been used",
      });
    }

    // ✅ Extract & convert course IDs (support multiple formats)
    const courseIds = courses
      .map((c) => c.courseId || c._id || c.id)
      .filter(Boolean)
      .map(toObjectId)
      .filter(Boolean);

    if (courseIds.length !== courses.length) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid course payload. courseId is missing or invalid for one or more items.",
      });
    }

    // 🔍 DEBUG (remove in production)
    console.log("=== Create Order ===");
    console.log("courseIds:", courseIds.map((id) => id.toString()));

    // ✅ Find all matching courses
    const allMatchingCourses = await Course.find({ _id: { $in: courseIds } });

    console.log(
      "Found in DB:",
      allMatchingCourses.length,
      "of",
      courses.length
    );

    if (allMatchingCourses.length !== courses.length) {
      const foundIds = allMatchingCourses.map((c) => c._id.toString());
      const missingIds = courseIds
        .map((id) => id.toString())
        .filter((id) => !foundIds.includes(id));

      return res.status(400).json({
        success: false,
        message: `Course(s) not found in database: ${missingIds.join(", ")}`,
      });
    }

    // ✅ Validate each course (published, paid)
    const invalidCourses = [];
    for (const c of allMatchingCourses) {
      const reasons = [];
      if (!c.isPublished) reasons.push("not published");
      if (c.isFree === true) reasons.push("free (no purchase needed)");
      if (!["online", "offline"].includes(c.courseType)) {
        reasons.push("invalid course type");
      }
      if (reasons.length > 0) {
        invalidCourses.push(`${c.title} (${reasons.join(", ")})`);
      }
    }

    if (invalidCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot purchase: ${invalidCourses.join("; ")}`,
      });
    }

    const dbCourses = allMatchingCourses;

    // ✅ Check if already purchased
    const purchasedSet = new Set(
      (req.user.purchasedCourses || []).map((id) => id.toString())
    );
    const alreadyPurchased = dbCourses.filter((c) =>
      purchasedSet.has(c._id.toString())
    );

    if (alreadyPurchased.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You already purchased: ${alreadyPurchased
          .map((c) => c.title)
          .join(", ")}`,
      });
    }

    // ✅ Verify server-side total
    const serverTotal = dbCourses.reduce(
      (sum, c) => sum + (c.discountPrice > 0 ? c.discountPrice : c.price),
      0
    );

    if (Math.abs(serverTotal - totalAmount) > 1) {
      return res.status(400).json({
        success: false,
        message: `Price mismatch. Expected ₦${serverTotal}, got ₦${totalAmount}. Please refresh and try again.`,
      });
    }

    // ✅ Create order
    const order = await Order.create({
      user: userId,
      courses: dbCourses.map((c) => ({
        courseId: c._id,
        title: c.title,
        price: c.discountPrice > 0 ? c.discountPrice : c.price,
      })),
      totalAmount: serverTotal,
      paystackReference,
      paymentStatus: "pending",
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    next(error);
  }
};

// @desc    Verify payment
// @route   POST /api/orders/verify-payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const reference = req.body.reference || req.params.reference;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    // ✅ Find order
    const order = await Order.findOne({ paystackReference: reference });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this reference",
      });
    }

    // ✅ Idempotent — skip if already done
    if (order.paymentStatus === "completed") {
      return res.status(200).json({
        success: true,
        order,
        message: "Payment already verified",
      });
    }

    // ✅ Verify with Paystack
    let paystackResponse;
    try {
      paystackResponse = await verifyTransaction(reference);
    } catch (paystackError) {
      console.error("Paystack API error:", paystackError.message);
      return res.status(502).json({
        success: false,
        message:
          paystackError.message ||
          "Could not verify payment with Paystack. Please contact support.",
      });
    }

    // ✅ Check Paystack response
    if (
      !paystackResponse ||
      !paystackResponse.status ||
      paystackResponse.data?.status !== "success"
    ) {
      order.paymentStatus = "failed";
      await order.save();

      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${
          paystackResponse?.data?.status || "unknown"
        }`,
      });
    }

    // ✅ Verify amount
    const paidAmountNaira = paystackResponse.data.amount / 100;
    if (Math.abs(paidAmountNaira - order.totalAmount) > 1) {
      order.paymentStatus = "failed";
      await order.save();

      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Expected ₦${order.totalAmount}, got ₦${paidAmountNaira}`,
      });
    }

    // ✅ Mark order completed
    order.paymentStatus = "completed";
    order.paystackTransactionId = paystackResponse.data.id?.toString() || "";
    order.paystackChannel = paystackResponse.data.channel || "";
    await order.save();

    // ✅ Add courses to user's purchased list
    const courseIds = order.courses.map((c) => c.courseId);

    await User.findByIdAndUpdate(order.user, {
      $addToSet: { purchasedCourses: { $each: courseIds } },
    });

    // ✅ Increment enrollment count
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $inc: { studentsEnrolled: 1 } }
    );

    // ✅ Fetch full course documents
    const fullCourses = await Course.find({ _id: { $in: courseIds } });

    // ✅ AUTO-ENROLL in any online courses
    try {
      const onlineCourses = fullCourses.filter(
        (c) => c.courseType === "online"
      );

      for (const onlineCourse of onlineCourses) {
        const existing = await Enrollment.findOne({
          user: order.user,
          course: onlineCourse._id,
        });

        if (!existing) {
          await Enrollment.create({
            user: order.user,
            course: onlineCourse._id,
            order: order._id,
            progress: [],
            completionPercentage: 0,
          });
        }
      }
    } catch (enrollErr) {
      console.error("Auto-enrollment failed:", enrollErr.message);
    }

    // ✅ Fetch full user
    const user = await User.findById(order.user);

    // ✅ Send purchase confirmation email
    try {
      await sendPurchaseConfirmation(user, order);
    } catch (emailErr) {
      console.error("Purchase confirmation email failed:", emailErr.message);
    }

    // ✅ Generate and send admission letter (offline only)
    try {
      const offlineCourses = fullCourses.filter(
        (c) => c.courseType === "offline"
      );

      if (offlineCourses.length > 0) {
        const pdfBuffer = await generateAdmissionLetter(
          user,
          order,
          offlineCourses
        );
        await sendAdmissionLetterEmail(user, order, pdfBuffer);
        order.admissionLetterSent = true;
        await order.save();
      }
    } catch (pdfErr) {
      console.error("Admission letter generation failed:", pdfErr.message);
    }

    res.status(200).json({
      success: true,
      order,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    next(error);
  }
};

// @desc    Get current user's orders
// @route   GET /api/orders/my-orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort("-createdAt")
      .populate(
        "courses.courseId",
        "title slug thumbnail courseType duration"
      );

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "courses.courseId",
      "title slug thumbnail courseType duration"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Download admission letter
// @route   GET /api/orders/:orderId/admission-letter/:courseId
exports.downloadAdmissionLetter = async (req, res, next) => {
  try {
    const { orderId, courseId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (order.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    const orderCourse = order.courses.find(
      (c) => c.courseId.toString() === courseId
    );
    if (!orderCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found in this order",
      });
    }

    const user = await User.findById(order.user);
    const fullCourse = await Course.findById(courseId);

    if (!fullCourse) {
      return res.status(404).json({
        success: false,
        message: "Course no longer exists",
      });
    }

    if (fullCourse.courseType !== "offline") {
      return res.status(400).json({
        success: false,
        message: "Admission letters are only available for offline courses",
      });
    }

    const pdfBuffer = await generateAdmissionLetter(user, order, [fullCourse]);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Admission_Letter_${user.name.replace(
        /\s+/g,
        "_"
      )}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
exports.getAllOrdersAdmin = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.paymentStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .populate("courses.courseId", "title courseType")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const revenueStats = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          completedOrders: { $sum: 1 },
        },
      },
    ]);

    const stats = revenueStats[0] || { totalRevenue: 0, completedOrders: 0 };

    res.status(200).json({
      success: true,
      orders,
      stats: {
        totalOrders: total,
        totalRevenue: stats.totalRevenue,
        completedOrders: stats.completedOrders,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};