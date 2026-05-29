const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  downloadAdmissionLetter,
  getAllOrdersAdmin,
} = require("../controllers/orderController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const { orderValidation } = require("../middleware/validate");

// Protected
router.post("/", protect, orderValidation, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my-orders", protect, getMyOrders);
router.get(
  "/:orderId/admission-letter/:courseId",
  protect,
  downloadAdmissionLetter
);

// Admin
router.get("/admin/all", protect, adminOnly, getAllOrdersAdmin);

// Generic by ID — put last
router.get("/:id", protect, getOrderById);

module.exports = router;