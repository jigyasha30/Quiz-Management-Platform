const express = require("express");

const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  addQuestionToQuiz,
  removeQuestionFromQuiz,
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quizController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET ALL QUIZZES
// ==========================================
// Logged-in users can view quizzes
// Students only get published quizzes
// ==========================================
router.get(
  "/",
  protect,
  getAllQuizzes
);

// ==========================================
// GET SINGLE QUIZ
// ==========================================
router.get(
  "/:id",
  protect,
  getQuizById
);

// ==========================================
// CREATE QUIZ
// ==========================================
// Admin Only
// ==========================================
router.post(
  "/",
  protect,
  adminOnly,
  createQuiz
);

// ==========================================
// ADD QUESTION TO QUIZ
// ==========================================
// Admin Only
//
// Body:
// {
//   "quizId": "...",
//   "questionId": "..."
// }
// ==========================================
router.post(
  "/add-question",
  protect,
  adminOnly,
  addQuestionToQuiz
);

// ==========================================
// REMOVE QUESTION FROM QUIZ
// ==========================================
// Admin Only
//
// Body:
// {
//   "quizId": "...",
//   "questionId": "..."
// }
// ==========================================
router.delete(
  "/remove-question",
  protect,
  adminOnly,
  removeQuestionFromQuiz
);

// ==========================================
// UPDATE QUIZ
// ==========================================
// Admin Only
// ==========================================
router.put(
  "/:id",
  protect,
  adminOnly,
  updateQuiz
);

// ==========================================
// DELETE QUIZ
// ==========================================
// Admin Only
// ==========================================
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteQuiz
);

// ==========================================
// EXPORT
// ==========================================
module.exports = router;