const mongoose = require("mongoose");

// ==========================================
// QUIZ SCHEMA
// ==========================================
const quizSchema = new mongoose.Schema(
  {
    // ========================================
    // TITLE
    // ========================================
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      minlength: [
        3,
        "Quiz title must be at least 3 characters",
      ],
      maxlength: [
        100,
        "Quiz title cannot exceed 100 characters",
      ],
    },

    // ========================================
    // DESCRIPTION
    // ========================================
    description: {
      type: String,
      required: [true, "Quiz description is required"],
      trim: true,
      maxlength: [
        500,
        "Description cannot exceed 500 characters",
      ],
    },

    // ========================================
    // CATEGORY
    // ========================================
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    // ========================================
    // DIFFICULTY
    // ========================================
    difficulty: {
      type: String,
      required: [true, "Difficulty is required"],
      enum: {
        values: [
          "Easy",
          "Intermediate",
          "Hard",
        ],
        message:
          "Difficulty must be Easy, Intermediate or Hard",
      },
    },

    // ========================================
    // DURATION
    // ========================================
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [
        1,
        "Duration must be at least 1 minute",
      ],
    },

    // ========================================
    // QUESTIONS
    // Separate Question Collection References
    // ========================================
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    // ========================================
    // TOTAL POINTS
    // ========================================
    totalPoints: {
      type: Number,
      default: 0,
      min: [0, "Total points cannot be negative"],
    },

    // ========================================
    // PUBLISHED
    // ========================================
    isPublished: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // ACTIVE / INACTIVE
    // ========================================
    isActive: {
      type: Boolean,
      default: true,
    },

    // ========================================
    // CREATED BY
    // ========================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Quiz creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// EXPORT MODEL
// ==========================================
module.exports = mongoose.model(
  "Quiz",
  quizSchema
);