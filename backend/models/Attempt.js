const mongoose = require("mongoose");

// =========================================================
// ANSWER SCHEMA
// =========================================================

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    selectedAnswer: {
      type: String,
      default: "",
      trim: true,
    },

    correctAnswer: {
      type: String,
      default: "",
      trim: true,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    earnedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =========================================================
// ATTEMPT SCHEMA
// =========================================================

const attemptSchema = new mongoose.Schema(
  {
    // -------------------------------------------------------
    // STUDENT
    // -------------------------------------------------------

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // -------------------------------------------------------
    // QUIZ
    // -------------------------------------------------------

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    // -------------------------------------------------------
    // ANSWERS
    // -------------------------------------------------------

    answers: {
      type: [answerSchema],
      default: [],
    },

    // -------------------------------------------------------
    // SCORE
    // -------------------------------------------------------

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    unanswered: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -------------------------------------------------------
    // STATUS
    // -------------------------------------------------------

    status: {
      type: String,
      enum: [
        "in-progress",
        "completed",
        "abandoned",
      ],
      default: "in-progress",
      index: true,
    },

    // -------------------------------------------------------
    // TIME
    // -------------------------------------------------------

    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    // Stored in seconds
    timeTaken: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -------------------------------------------------------
    // ATTEMPT NUMBER
    // -------------------------------------------------------

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
  },

  {
    timestamps: true,
  }
);

// =========================================================
// INDEXES
// =========================================================

attemptSchema.index({
  student: 1,
  quiz: 1,
  createdAt: -1,
});

attemptSchema.index({
  student: 1,
  status: 1,
});

attemptSchema.index({
  quiz: 1,
  status: 1,
});

// =========================================================
// EXPORT
// =========================================================

module.exports = mongoose.model(
  "Attempt",
  attemptSchema
);