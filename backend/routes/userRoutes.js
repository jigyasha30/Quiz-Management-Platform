const express = require("express");

const {
  getUsers,
  getUserById,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus,
  getUserAttempts,
  deleteUser,
  getUserStats,
} = require("../controllers/userController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// MY PROFILE
// ==========================================

router.get(
  "/profile",
  protect,
  getMyProfile
);

router.put(
  "/profile",
  protect,
  updateMyProfile
);

// ==========================================
// ADMIN - ALL USERS
// ==========================================

router.get(
  "/",
  protect,
  adminOnly,
  getUsers
);

// ==========================================
// ADMIN - USER PROFILE
// ==========================================

router.get(
  "/:id",
  protect,
  adminOnly,
  getUserById
);

// ==========================================
// ADMIN - USER STATISTICS
// ==========================================

router.get(
  "/:id/stats",
  protect,
  adminOnly,
  getUserStats
);

// ==========================================
// ADMIN - USER ATTEMPT HISTORY
// ==========================================

router.get(
  "/:id/attempts",
  protect,
  adminOnly,
  getUserAttempts
);

// ==========================================
// ADMIN - UPDATE USER ROLE
// ==========================================

router.put(
  "/:id/role",
  protect,
  adminOnly,
  updateUserRole
);

// ==========================================
// ADMIN - ACTIVATE / DEACTIVATE USER
// ==========================================

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateUserStatus
);

// ==========================================
// ADMIN - DELETE USER
// ==========================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteUser
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;