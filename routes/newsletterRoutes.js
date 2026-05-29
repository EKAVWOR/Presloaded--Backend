const express = require("express");
const router = express.Router();
const {
  subscribe,
  getSubscribers,
} = require("../controllers/newsletterController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

router.post("/", subscribe);
router.get("/", protect, adminOnly, getSubscribers);

module.exports = router;