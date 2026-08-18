const express = require("express");

const router = express.Router();

const {
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptById,
  getLeaderboard,
} = require("../controllers/attemptController");

const { protect } = require("../middleware/authMiddleware");

// =========================================================
// START ATTEMPT
// =========================================================

router.post(
  "/start/:quizId",
  protect,
  startAttempt
);

// =========================================================
// MY ATTEMPTS
// =========================================================

router.get(
  "/my",
  protect,
  getMyAttempts
);

// =========================================================
// LEADERBOARD
// =========================================================

router.get(
  "/leaderboard",
  protect,
  getLeaderboard
);

// =========================================================
// SUBMIT ATTEMPT
// =========================================================

router.post(
  "/:id/submit",
  protect,
  submitAttempt
);

// =========================================================
// GET SINGLE ATTEMPT
// IMPORTANT: Keep this AFTER /my and /leaderboard
// =========================================================

router.get(
  "/:id",
  protect,
  getAttemptById
);

module.exports = router;