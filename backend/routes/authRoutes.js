const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../controllers/authController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// Public Routes
// ==========================================

router.post("/register", registerUser);
router.post("/login", loginUser);

// ==========================================
// Protected Routes
// ==========================================

router.get("/me", protect, getCurrentUser);

// ==========================================
// Admin Only Test Route
// ==========================================

router.get("/admin-test", protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin! 👑",
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;