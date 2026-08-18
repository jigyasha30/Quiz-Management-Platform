const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const Category = require("../models/Category");

// =====================================================
// CREATE QUESTION
// ADMIN ONLY
// =====================================================

const createQuestion = async (req, res) => {
  try {
    const {
      quiz,
      category,
      questionText,
      options,
      correctAnswer,
      explanation,
      marks,
    } = req.body;

    if (!quiz) {
      return res.status(400).json({
        success: false,
        message: "Quiz is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question text is required",
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 options are required",
      });
    }

    if (options.length > 6) {
      return res.status(400).json({
        success: false,
        message: "Maximum 6 options are allowed",
      });
    }

    if (!correctAnswer || !correctAnswer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Correct answer is required",
      });
    }

    // CHECK QUIZ
    const existingQuiz = await Quiz.findById(quiz);

    if (!existingQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // CHECK CATEGORY
    const existingCategory = await Category.findById(category);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // CLEAN OPTIONS
    const cleanedOptions = options
      .map((option) =>
        typeof option === "string" ? option.trim() : ""
      )
      .filter(Boolean);

    if (cleanedOptions.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 valid options are required",
      });
    }

    // DUPLICATE OPTIONS
    const normalizedOptions = cleanedOptions.map((option) =>
      option.toLowerCase()
    );

    if (
      new Set(normalizedOptions).size !==
      normalizedOptions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Question options must be unique",
      });
    }

    // CHECK CORRECT ANSWER
    const trimmedCorrectAnswer = correctAnswer.trim();

    const correctAnswerExists = cleanedOptions.some(
      (option) =>
        option.toLowerCase() ===
        trimmedCorrectAnswer.toLowerCase()
    );

    if (!correctAnswerExists) {
      return res.status(400).json({
        success: false,
        message:
          "Correct answer must match one of the options",
      });
    }

    // DUPLICATE QUESTION CHECK
    const duplicate = await Question.findOne({
      quiz,
      questionText: {
        $regex: `^${questionText
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This question already exists in this quiz",
      });
    }

    // CREATE QUESTION
    const question = await Question.create({
      quiz,
      category,
      questionText: questionText.trim(),
      options: cleanedOptions,
      correctAnswer: trimmedCorrectAnswer,
      explanation: explanation?.trim() || "",
      marks: Number(marks) || 1,
      isActive: true,
    });

    // ADD QUESTION TO QUIZ
    existingQuiz.questions.push(question._id);
    existingQuiz.totalPoints += Number(marks) || 1;

    await existingQuiz.save();

    // POPULATE
    const populatedQuestion = await Question.findById(
      question._id
    )
      .populate("quiz", "title")
      .populate("category", "name");

    const updatedQuiz = await Quiz.findById(quiz).populate(
      "questions"
    );

    return res.status(201).json({
      success: true,
      message:
        "Question created and added to quiz successfully",

      question: populatedQuestion,

      quiz: {
        _id: updatedQuiz._id,
        title: updatedQuiz.title,
        questionCount: updatedQuiz.questions.length,
        totalPoints: updatedQuiz.totalPoints,
      },
    });
  } catch (error) {
    console.error("Create Question Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message,
    });
  }
};

// =====================================================
// BULK CREATE QUESTIONS
// ADMIN ONLY
// =====================================================

const bulkCreateQuestions = async (req, res) => {
  try {
    const { quiz, questions } = req.body;

    if (!quiz) {
      return res.status(400).json({
        success: false,
        message: "Quiz is required",
      });
    }

    const existingQuiz = await Quiz.findById(quiz);

    if (!existingQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required",
      });
    }

    const createdQuestions = [];
    const skippedQuestions = [];

    for (const item of questions) {
      try {
        const {
          category,
          questionText,
          options,
          correctAnswer,
          explanation,
          marks,
        } = item;

        if (
          !category ||
          !questionText ||
          !Array.isArray(options) ||
          options.length < 2 ||
          !correctAnswer
        ) {
          skippedQuestions.push({
            questionText,
            reason: "Invalid question data",
          });
          continue;
        }

        const existingCategory =
          await Category.findById(category);

        if (!existingCategory) {
          skippedQuestions.push({
            questionText,
            reason: "Category not found",
          });
          continue;
        }

        const cleanedOptions = options
          .map((option) =>
            typeof option === "string"
              ? option.trim()
              : ""
          )
          .filter(Boolean);

        if (cleanedOptions.length < 2) {
          skippedQuestions.push({
            questionText,
            reason: "At least 2 valid options are required",
          });
          continue;
        }

        const normalizedOptions =
          cleanedOptions.map((option) =>
            option.toLowerCase()
          );

        if (
          new Set(normalizedOptions).size !==
          normalizedOptions.length
        ) {
          skippedQuestions.push({
            questionText,
            reason: "Question options must be unique",
          });
          continue;
        }

        const trimmedCorrectAnswer =
          String(correctAnswer).trim();

        const correctAnswerExists =
          cleanedOptions.some(
            (option) =>
              option.toLowerCase() ===
              trimmedCorrectAnswer.toLowerCase()
          );

        if (!correctAnswerExists) {
          skippedQuestions.push({
            questionText,
            reason:
              "Correct answer does not match options",
          });
          continue;
        }

        // DUPLICATE QUESTION CHECK
        const duplicate = await Question.findOne({
          quiz,
          questionText: {
            $regex: `^${questionText
              .trim()
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        });

        if (duplicate) {
          skippedQuestions.push({
            questionText,
            reason: "Duplicate question",
          });
          continue;
        }

        const questionMarks = Number(marks) || 1;

        const newQuestion = await Question.create({
          quiz,
          category,
          questionText: questionText.trim(),
          options: cleanedOptions,
          correctAnswer: trimmedCorrectAnswer,
          explanation: explanation?.trim() || "",
          marks: questionMarks,
          isActive: true,
        });

        existingQuiz.questions.push(newQuestion._id);

        existingQuiz.totalPoints += questionMarks;

        createdQuestions.push(newQuestion);
      } catch (questionError) {
        skippedQuestions.push({
          questionText: item.questionText,
          reason: questionError.message,
        });
      }
    }

    await existingQuiz.save();

    const updatedQuiz = await Quiz.findById(quiz)
      .populate("questions");

    return res.status(201).json({
      success: true,
      message:
        "Questions created and added to quiz successfully",

      createdCount: createdQuestions.length,

      skippedCount: skippedQuestions.length,

      createdQuestions,

      skippedQuestions,

      quiz: {
        _id: updatedQuiz._id,
        title: updatedQuiz.title,
        questionCount: updatedQuiz.questions.length,
        totalPoints: updatedQuiz.totalPoints,
      },
    });
  } catch (error) {
    console.error(
      "Bulk Create Questions Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create questions",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL QUESTIONS
// =====================================================

const getQuestions = async (req, res) => {
  try {
    const {
      quiz,
      category,
      search,
      isActive,
    } = req.query;

    const filter = {};

    if (quiz) {
      filter.quiz = quiz;
    }

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search && search.trim()) {
      filter.questionText = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const questions = await Question.find(filter)
      .populate("quiz", "title")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get Questions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE QUESTION
// =====================================================

const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("quiz", "title")
      .populate("category", "name");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Get Question Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE QUESTION
// ADMIN ONLY
// =====================================================

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      quiz,
      category,
      questionText,
      options,
      correctAnswer,
      explanation,
      marks,
    } = req.body;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (quiz) {
      const existingQuiz = await Quiz.findById(quiz);

      if (!existingQuiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }

      question.quiz = quiz;
    }

    if (category) {
      const existingCategory =
        await Category.findById(category);

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      question.category = category;
    }

    if (questionText !== undefined) {
      if (!questionText.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question text cannot be empty",
        });
      }

      question.questionText = questionText.trim();
    }

    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 options are required",
        });
      }

      if (options.length > 6) {
        return res.status(400).json({
          success: false,
          message: "Maximum 6 options are allowed",
        });
      }

      const cleanedOptions = options
        .map((option) =>
          typeof option === "string"
            ? option.trim()
            : ""
        )
        .filter(Boolean);

      if (cleanedOptions.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least 2 valid options are required",
        });
      }

      const normalizedOptions =
        cleanedOptions.map((option) =>
          option.toLowerCase()
        );

      if (
        new Set(normalizedOptions).size !==
        normalizedOptions.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Question options must be unique",
        });
      }

      question.options = cleanedOptions;
    }

    if (correctAnswer !== undefined) {
      if (!correctAnswer.trim()) {
        return res.status(400).json({
          success: false,
          message: "Correct answer cannot be empty",
        });
      }

      question.correctAnswer = correctAnswer.trim();
    }

    const correctAnswerExists =
      question.options.some(
        (option) =>
          option.toLowerCase() ===
          question.correctAnswer.toLowerCase()
      );

    if (!correctAnswerExists) {
      return res.status(400).json({
        success: false,
        message:
          "Correct answer must match one of the options",
      });
    }

    if (explanation !== undefined) {
      question.explanation = explanation.trim();
    }

    if (marks !== undefined) {
      const numericMarks = Number(marks);

      if (
        Number.isNaN(numericMarks) ||
        numericMarks < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Marks must be a number greater than 0",
        });
      }

      question.marks = numericMarks;
    }

    await question.save();

    const updatedQuestion =
      await Question.findById(question._id)
        .populate("quiz", "title")
        .populate("category", "name");

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Update Question Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE / DEACTIVATE QUESTION
// =====================================================

const updateQuestionStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const question =
      await Question.findByIdAndUpdate(
        req.params.id,
        { isActive },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("quiz", "title")
        .populate("category", "name");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Question activated successfully"
        : "Question deactivated successfully",
      question,
    });
  } catch (error) {
    console.error(
      "Update Question Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update question status",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE QUESTION
// ADMIN ONLY
// =====================================================

const deleteQuestion = async (req, res) => {
  try {
    const question =
      await Question.findByIdAndDelete(
        req.params.id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // REMOVE QUESTION FROM QUIZ
    await Quiz.findByIdAndUpdate(
      question.quiz,
      {
        $pull: {
          questions: question._id,
        },
        $inc: {
          totalPoints: -(question.marks || 1),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Question Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  getQuestionById,
  updateQuestion,
  updateQuestionStatus,
  deleteQuestion,
};