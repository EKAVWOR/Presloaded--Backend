const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const protect = require("../middleware/auth");
const { registerValidation, loginValidation } = require("../middleware/validate");

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;