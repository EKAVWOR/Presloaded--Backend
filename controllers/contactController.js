const Contact = require("../models/Contact");
const {
  sendContactConfirmation,
  sendAdminContactNotification,
} = require("../services/emailService");

// @desc    Submit contact form (public)
// @route   POST /api/contact
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = await Contact.create({ name, email, subject, message });

    // Send emails
    try {
      await sendContactConfirmation(contact);
    } catch (err) {
      console.error("Contact confirmation email failed:", err.message);
    }

    try {
      await sendAdminContactNotification(contact);
    } catch (err) {
      console.error("Admin notification email failed:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages (admin)
// @route   GET /api/contact
exports.getMessages = async (req, res, next) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;

    const query = {};
    if (read === "true") query.isRead = true;
    if (read === "false") query.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Contact.countDocuments(query);

    const messages = await Contact.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Contact.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      messages,
      unreadCount,
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

// @desc    Mark message as read (admin)
// @route   PUT /api/contact/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const msg = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!msg) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({ success: true, message: msg });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message (admin)
// @route   DELETE /api/contact/:id
exports.deleteMessage = async (req, res, next) => {
  try {
    const msg = await Contact.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await msg.deleteOne();
    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};