const express = require("express");
const router = express.Router();
const {
  submitContact,
  getMessages,
  markAsRead,
  deleteMessage,
} = require("../controllers/contactController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const { contactValidation } = require("../middleware/validate");

router.post("/", contactValidation, submitContact);
router.get("/", protect, adminOnly, getMessages);
router.put("/:id/read", protect, adminOnly, markAsRead);
router.delete("/:id", protect, adminOnly, deleteMessage);

module.exports = router;