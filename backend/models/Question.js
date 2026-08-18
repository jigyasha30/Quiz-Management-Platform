const mongoose = require("mongoose");

// =====================================================
// QUESTION SCHEMA
// =====================================================

const questionSchema = new mongoose.Schema(
  {
    // ===================================================
    // QUIZ
    // ===================================================

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz is required"],
    },

    // ===================================================
    // CATEGORY
    // ===================================================

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    // ===================================================
    // QUESTION TEXT
    // ===================================================

    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [
        5,
        "Question must be at least 5 characters",
      ],
      maxlength: [
        1000,
        "Question cannot exceed 1000 characters",
      ],
    },

    // ===================================================
    // OPTIONS
    // ===================================================

    options: {
      type: [
        {
          type: String,
          trim: true,
          required: true,
        },
      ],
      required: [true, "Question options are required"],

      validate: {
        validator: function (value) {
          return value.length >= 2 && value.length <= 6;
        },

        message:
          "Question must have between 2 and 6 options",
      },
    },

    // ===================================================
    // CORRECT ANSWER
    // ===================================================

    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      trim: true,
    },

    // ===================================================
    // EXPLANATION
    // ===================================================

    explanation: {
      type: String,
      trim: true,

      maxlength: [
        1000,
        "Explanation cannot exceed 1000 characters",
      ],

      default: "",
    },

    // ===================================================
    // MARKS
    // ===================================================

    marks: {
      type: Number,

      required: [true, "Marks are required"],

      min: [
        1,
        "Marks must be at least 1",
      ],

      default: 1,
    },

    // ===================================================
    // ACTIVE / INACTIVE
    // ===================================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// VALIDATE CORRECT ANSWER
// =====================================================

questionSchema.pre("validate", function () {
  if (
    this.correctAnswer &&
    this.options &&
    !this.options.includes(this.correctAnswer)
  ) {
    this.invalidate(
      "correctAnswer",
      "Correct answer must match one of the options"
    );
  }
});

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model(
  "Question",
  questionSchema
);