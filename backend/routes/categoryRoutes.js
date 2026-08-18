const express = require("express");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET ALL CATEGORIES
// =====================================================

router.get("/", protect, getCategories);

// =====================================================
// GET SINGLE CATEGORY
// =====================================================

router.get("/:id", protect, getCategoryById);

// =====================================================
// CREATE CATEGORY - ADMIN ONLY
// =====================================================

router.post("/", protect, adminOnly, createCategory);

// =====================================================
// UPDATE CATEGORY - ADMIN ONLY
// =====================================================

router.put("/:id", protect, adminOnly, updateCategory);

// =====================================================
// ACTIVATE / DEACTIVATE CATEGORY - ADMIN ONLY
// =====================================================

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateCategoryStatus
);

// =====================================================
// DELETE CATEGORY - ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteCategory
);

module.exports = router;