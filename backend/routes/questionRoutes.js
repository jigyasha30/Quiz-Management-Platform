const express = require("express");

const {
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  getQuestionById,
  updateQuestion,
  updateQuestionStatus,
  deleteQuestion,
} = require("../controllers/questionController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getQuestions);

router.post(
  "/bulk",
  protect,
  adminOnly,
  bulkCreateQuestions
);

router.post(
  "/",
  protect,
  adminOnly,
  createQuestion
);

router.get(
  "/:id",
  protect,
  getQuestionById
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateQuestion
);

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateQuestionStatus
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteQuestion
);

module.exports = router;