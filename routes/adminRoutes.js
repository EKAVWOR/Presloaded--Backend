const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require("../controllers/adminController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;