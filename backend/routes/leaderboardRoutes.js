const express = require("express");

const {
  getGlobalLeaderboard,
  getQuizLeaderboard,
  getMyRank,
} = require("../controllers/leaderboardController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET GLOBAL LEADERBOARD
// ==========================================
router.get("/", protect, getGlobalLeaderboard);

// ==========================================
// GET MY RANK
// ==========================================
router.get("/my-rank", protect, getMyRank);

// ==========================================
// GET QUIZ LEADERBOARD
// ==========================================
router.get("/quiz/:quizId", protect, getQuizLeaderboard);

// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;