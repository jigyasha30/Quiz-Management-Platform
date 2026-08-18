const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

// ==========================================
// CREATE QUIZ - Admin Only
// ==========================================
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      isPublished,
    } = req.body;

    // ------------------------------------------
    // Basic validation
    // ------------------------------------------
    if (
      !title ||
      !description ||
      !category ||
      !difficulty ||
      !duration
    ) {
      return res.status(400).json({
        success: false,
        message: "All quiz fields are required",
      });
    }

    // ------------------------------------------
    // Create quiz
    // ------------------------------------------
    const quiz = await Quiz.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      difficulty,
      duration: Number(duration),
      questions: [],
      totalPoints: 0,
      isPublished: Boolean(isPublished),
      isActive: true,
      createdBy: req.user._id,
    });

    // ------------------------------------------
    // Success response
    // ------------------------------------------
    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    console.error("=================================");
    console.error("❌ CREATE QUIZ ERROR");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Stack:", error.stack);
    console.error("=================================");

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: "Quiz validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating quiz",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL QUIZZES
// ==========================================
const getAllQuizzes = async (req, res) => {
  try {
    const {
      category,
      difficulty,
      published,
    } = req.query;

    const filter = {};

    // ------------------------------------------
    // Students only see published quizzes
    // ------------------------------------------
    if (
      req.user &&
      req.user.role === "student"
    ) {
      filter.isPublished = true;
      filter.isActive = true;
    }

    // ------------------------------------------
    // Admin published filter
    // ------------------------------------------
    if (
      req.user &&
      req.user.role === "admin" &&
      published !== undefined
    ) {
      filter.isPublished =
        published === "true";
    }

    // ------------------------------------------
    // Category filter
    // ------------------------------------------
    if (category) {
      filter.category = category;
    }

    // ------------------------------------------
    // Difficulty filter
    // ------------------------------------------
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // ------------------------------------------
    // Get quizzes
    // ------------------------------------------
    const quizzes = await Quiz.find(filter)
      .populate(
        "createdBy",
        "name email"
      )
      .populate({
        path: "questions",
        select:
          "questionText options points marks category difficulty explanation isActive",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .sort({
        createdAt: -1,
      });

    // ------------------------------------------
    // Success
    // ------------------------------------------
    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  } catch (error) {
    console.error(
      "Get Quizzes Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching quizzes",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE QUIZ
// ==========================================
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(
      req.params.id
    )
      .populate(
        "createdBy",
        "name email"
      )
      .populate({
        path: "questions",
        select:
          "questionText options points marks category difficulty explanation isActive",
        populate: {
          path: "category",
          select: "name",
        },
      });

    // ------------------------------------------
    // Quiz not found
    // ------------------------------------------
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // ------------------------------------------
    // Students can only access published quizzes
    // ------------------------------------------
    if (
      req.user?.role === "student" &&
      !quiz.isPublished
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This quiz is not published",
      });
    }

    // ------------------------------------------
    // Success
    // ------------------------------------------
    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error(
      "Get Quiz Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching quiz",
      error: error.message,
    });
  }
};

// ==========================================
// ADD QUESTION TO QUIZ
// ==========================================
// Admin Only
// ==========================================
const addQuestionToQuiz = async (
  req,
  res
) => {
  try {
    const {
      quizId,
      questionId,
    } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------
    if (!quizId || !questionId) {
      return res.status(400).json({
        success: false,
        message:
          "Quiz ID and Question ID are required",
      });
    }

    // ------------------------------------------
    // Find quiz
    // ------------------------------------------
    const quiz = await Quiz.findById(
      quizId
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // ------------------------------------------
    // Find question
    // ------------------------------------------
    const question =
      await Question.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // ------------------------------------------
    // Check duplicate
    // ------------------------------------------
    const alreadyAdded =
      quiz.questions.some(
        (id) =>
          id.toString() ===
          questionId.toString()
      );

    if (alreadyAdded) {
      return res.status(400).json({
        success: false,
        message:
          "Question is already added to this quiz",
      });
    }

    // ------------------------------------------
    // Add question
    // ------------------------------------------
    quiz.questions.push(questionId);

    // ------------------------------------------
    // Calculate total points
    // ------------------------------------------
    quiz.totalPoints =
      quiz.questions.length;

    // Better calculation from Question marks
    const allQuestions =
      await Question.find({
        _id: {
          $in: quiz.questions,
        },
      }).select("marks points");

    quiz.totalPoints =
      allQuestions.reduce(
        (total, item) =>
          total +
          Number(
            item.marks ??
              item.points ??
              1
          ),
        0
      );

    await quiz.save();

    // ------------------------------------------
    // Populate response
    // ------------------------------------------
    await quiz.populate({
      path: "questions",
      select:
        "questionText options points marks category difficulty explanation isActive",
      populate: {
        path: "category",
        select: "name",
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Question added to quiz successfully",
      quiz,
    });
  } catch (error) {
    console.error(
      "Add Question To Quiz Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while adding question to quiz",
      error: error.message,
    });
  }
};

// ==========================================
// REMOVE QUESTION FROM QUIZ
// ==========================================
// Admin Only
// ==========================================
const removeQuestionFromQuiz = async (
  req,
  res
) => {
  try {
    const {
      quizId,
      questionId,
    } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------
    if (!quizId || !questionId) {
      return res.status(400).json({
        success: false,
        message:
          "Quiz ID and Question ID are required",
      });
    }

    // ------------------------------------------
    // Find quiz
    // ------------------------------------------
    const quiz = await Quiz.findById(
      quizId
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // ------------------------------------------
    // Check question
    // ------------------------------------------
    const exists =
      quiz.questions.some(
        (id) =>
          id.toString() ===
          questionId.toString()
      );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message:
          "Question is not attached to this quiz",
      });
    }

    // ------------------------------------------
    // Remove question
    // ------------------------------------------
    quiz.questions =
      quiz.questions.filter(
        (id) =>
          id.toString() !==
          questionId.toString()
      );

    // ------------------------------------------
    // Recalculate total points
    // ------------------------------------------
    const allQuestions =
      await Question.find({
        _id: {
          $in: quiz.questions,
        },
      }).select("marks points");

    quiz.totalPoints =
      allQuestions.reduce(
        (total, item) =>
          total +
          Number(
            item.marks ??
              item.points ??
              1
          ),
        0
      );

    await quiz.save();

    res.status(200).json({
      success: true,
      message:
        "Question removed from quiz successfully",
      quiz,
    });
  } catch (error) {
    console.error(
      "Remove Question From Quiz Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while removing question",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE QUIZ - Admin Only
// ==========================================
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(
      req.params.id
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const {
      title,
      description,
      category,
      difficulty,
      duration,
      isPublished,
      isActive,
    } = req.body;

    // ------------------------------------------
    // Update fields
    // ------------------------------------------

    if (title !== undefined) {
      quiz.title = title.trim();
    }

    if (description !== undefined) {
      quiz.description =
        description.trim();
    }

    if (category !== undefined) {
      quiz.category =
        category.trim();
    }

    if (difficulty !== undefined) {
      quiz.difficulty =
        difficulty;
    }

    if (duration !== undefined) {
      const numericDuration =
        Number(duration);

      if (
        !Number.isFinite(
          numericDuration
        ) ||
        numericDuration < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duration must be at least 1 minute",
        });
      }

      quiz.duration =
        numericDuration;
    }

    if (isPublished !== undefined) {
      quiz.isPublished =
        Boolean(isPublished);
    }

    if (isActive !== undefined) {
      quiz.isActive =
        Boolean(isActive);
    }

    // ------------------------------------------
    // Recalculate total points
    // ------------------------------------------
    const allQuestions =
      await Question.find({
        _id: {
          $in: quiz.questions,
        },
      }).select("marks points");

    quiz.totalPoints =
      allQuestions.reduce(
        (total, item) =>
          total +
          Number(
            item.marks ??
              item.points ??
              1
          ),
        0
      );

    // ------------------------------------------
    // Save
    // ------------------------------------------
    await quiz.save();

    // ------------------------------------------
    // Populate response
    // ------------------------------------------
    await quiz.populate([
      {
        path: "createdBy",
        select: "name email",
      },
      {
        path: "questions",
        select:
          "questionText options points marks category difficulty explanation isActive",
        populate: {
          path: "category",
          select: "name",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message:
        "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    console.error(
      "================================="
    );
    console.error(
      "❌ UPDATE QUIZ ERROR"
    );
    console.error(error);
    console.error(
      "================================="
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      const errors =
        Object.values(
          error.errors
        ).map(
          (err) => err.message
        );

      return res.status(400).json({
        success: false,
        message:
          "Quiz validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Server error while updating quiz",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE QUIZ - Admin Only
// ==========================================
const deleteQuiz = async (
  req,
  res
) => {
  try {
    const quiz =
      await Quiz.findById(
        req.params.id
      );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // ------------------------------------------
    // Delete quiz
    // ------------------------------------------
    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Quiz deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Quiz Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while deleting quiz",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  addQuestionToQuiz,
  removeQuestionFromQuiz,
  updateQuiz,
  deleteQuiz,
};