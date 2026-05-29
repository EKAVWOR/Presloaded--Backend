const User = require("../models/User");
const Course = require("../models/Course");
const Order = require("../models/Order");
const Contact = require("../models/Contact");
const Newsletter = require("../models/Newsletter");

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: "student" });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const offlineCourses = await Course.countDocuments({ courseType: "offline" });
    const onlineCourses = await Course.countDocuments({ courseType: "online" });

    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({
      paymentStatus: "completed",
    });
    const pendingOrders = await Order.countDocuments({
      paymentStatus: "pending",
    });

    // Revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const unreadMessages = await Contact.countDocuments({ isRead: false });
    const totalSubscribers = await Newsletter.countDocuments({ isActive: true });

    // Recent orders
    const recentOrders = await Order.find({ paymentStatus: "completed" })
      .populate("user", "name email")
      .sort("-createdAt")
      .limit(5);

    // Popular courses
    const popularCourses = await Course.find({ isPublished: true })
      .sort("-studentsEnrolled")
      .limit(5)
      .select("title studentsEnrolled courseType price thumbnail");

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        publishedCourses,
        offlineCourses,
        onlineCourses,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        unreadMessages,
        totalSubscribers,
        monthlyRevenue,
        recentOrders,
        popularCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, verified, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (verified === "true") query.isEmailVerified = true;
    if (verified === "false") query.isEmailVerified = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .populate("purchasedCourses", "title courseType")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "purchasedCourses",
      "title courseType price"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = await Order.find({ user: req.params.id })
      .sort("-createdAt")
      .populate("courses.courseId", "title");

    res.status(200).json({
      success: true,
      user,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    next(error);
  }
};