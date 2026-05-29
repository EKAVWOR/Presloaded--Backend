const Newsletter = require("../models/Newsletter");
const { sendNewsletterConfirmation } = require("../services/emailService");

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This email is already subscribed",
      });
    }

    await Newsletter.create({ email });

    try {
      await sendNewsletterConfirmation(email);
    } catch (err) {
      console.error("Newsletter confirmation email failed:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "Subscribed successfully!",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subscribers (admin)
// @route   GET /api/newsletter
exports.getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort(
      "-createdAt"
    );

    res.status(200).json({
      success: true,
      subscribers,
      total: subscribers.length,
    });
  } catch (error) {
    next(error);
  }
};