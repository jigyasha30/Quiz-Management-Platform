const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getAllAttempts,
  getAllUsers,
} = require("../controllers/adminController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  protect,
  adminOnly,
  getDashboardStats
);

// ==========================================
// ALL ATTEMPTS
// ==========================================

router.get(
  "/attempts",
  protect,
  adminOnly,
  getAllAttempts
);

// ==========================================
// ALL USERS
// ==========================================

router.get(
  "/users",
  protect,
  adminOnly,
  getAllUsers
);

module.exports = router;