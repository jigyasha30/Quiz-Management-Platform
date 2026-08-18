const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");

// =========================================================
// START ATTEMPT
// =========================================================

const startAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;

    // =======================================================
    // VALIDATE QUIZ ID
    // =======================================================

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "Quiz ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
      });
    }

    // =======================================================
    // FIND QUIZ + POPULATE QUESTIONS
    // =======================================================

    const quiz = await Quiz.findById(quizId).populate({
      path: "questions",
      match: { isActive: true },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (quiz.isPublished === false) {
      return res.status(400).json({
        success: false,
        message: "This quiz is not published",
      });
    }

    // =======================================================
    // AUTHENTICATED USER
    // =======================================================

    const studentId =
      req.user?._id ||
      req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // =======================================================
    // QUESTIONS
    // =======================================================

    const quizQuestions = Array.isArray(quiz.questions)
      ? quiz.questions.filter(Boolean)
      : [];

    if (quizQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This quiz has no active questions",
      });
    }

    // =======================================================
    // TOTAL POINTS
    // Question model uses "marks", NOT "points"
    // =======================================================

    const totalPoints = quizQuestions.reduce(
      (total, question) => {
        const marks =
          Number(question.marks) > 0
            ? Number(question.marks)
            : 1;

        return total + marks;
      },
      0
    );

    // =======================================================
    // ATTEMPT NUMBER
    // =======================================================

    const previousAttempts =
      await Attempt.countDocuments({
        student: studentId,
        quiz: quizId,
      });

    const attemptNumber =
      previousAttempts + 1;

    // =======================================================
    // CREATE ATTEMPT
    // =======================================================

    const attempt = await Attempt.create({
      student: studentId,

      quiz: quizId,

      answers: [],

      score: 0,

      totalPoints,

      percentage: 0,

      correctAnswers: 0,

      wrongAnswers: 0,

      unanswered: quizQuestions.length,

      status: "in-progress",

      startedAt: new Date(),

      submittedAt: null,

      timeTaken: 0,

      attemptNumber,
    });

    // =======================================================
    // LOG
    // =======================================================

    console.log(
      "========================================"
    );

    console.log(
      "✅ ATTEMPT STARTED"
    );

    console.log(
      "Attempt ID:",
      attempt._id.toString()
    );

    console.log(
      "Quiz ID:",
      quizId
    );

    console.log(
      "Questions:",
      quizQuestions.length
    );

    console.log(
      "Total Marks:",
      totalPoints
    );

    console.log(
      "========================================"
    );

    // =======================================================
    // RESPONSE
    // =======================================================

    return res.status(201).json({
      success: true,

      message:
        "Quiz attempt started successfully",

      attempt,
    });
  } catch (error) {
    console.error(
      "❌ Start Attempt Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while starting attempt",

      error: error.message,
    });
  }
};

// =========================================================
// SUBMIT ATTEMPT
// =========================================================

const submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      answers,
      timeTaken,
    } = req.body;

    console.log(
      "\n========================================"
    );

    console.log(
      "📝 SUBMIT ATTEMPT"
    );

    console.log(
      "Attempt ID:",
      id
    );

    console.log(
      "Received Answers:",
      JSON.stringify(
        answers,
        null,
        2
      )
    );

    console.log(
      "Time Taken:",
      timeTaken
    );

    console.log(
      "========================================\n"
    );

    // =======================================================
    // VALIDATE ATTEMPT ID
    // =======================================================

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID",
      });
    }

    // =======================================================
    // FIND ATTEMPT
    // =======================================================

    const attempt =
      await Attempt.findById(id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    // =======================================================
    // OWNER CHECK
    // =======================================================

    const currentUserId =
      req.user?._id?.toString() ||
      req.user?.id?.toString();

    const attemptStudentId =
      attempt.student?.toString();

    if (
      currentUserId &&
      attemptStudentId &&
      currentUserId !== attemptStudentId
    ) {
      return res.status(403).json({
        success: false,

        message:
          "You are not authorized to submit this attempt",
      });
    }

    // =======================================================
    // STATUS CHECK
    // =======================================================

    if (attempt.status === "completed") {
      return res.status(400).json({
        success: false,

        message:
          "This attempt has already been submitted",
      });
    }

    // =======================================================
    // GET QUIZ WITH QUESTIONS
    //
    // IMPORTANT:
    // Questions are stored as ObjectId references.
    // We MUST populate them.
    // =======================================================

    const quiz =
      await Quiz.findById(
        attempt.quiz
      ).populate({
        path: "questions",
        match: {
          isActive: true,
        },
      });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // =======================================================
    // QUESTIONS
    // =======================================================

    const quizQuestions =
      Array.isArray(quiz.questions)
        ? quiz.questions.filter(Boolean)
        : [];

    if (quizQuestions.length === 0) {
      return res.status(400).json({
        success: false,

        message:
          "This quiz has no active questions",
      });
    }

    console.log(
      "📚 Questions loaded:",
      quizQuestions.length
    );

    // =======================================================
    // SUBMITTED ANSWERS
    // =======================================================

    const submittedAnswers =
      Array.isArray(answers)
        ? answers
        : [];

    // =======================================================
    // QUESTION MAP
    // =======================================================

    const questionMap =
      new Map();

    quizQuestions.forEach(
      (question) => {
        questionMap.set(
          question._id.toString(),
          question
        );
      }
    );

    // =======================================================
    // RESULT VARIABLES
    // =======================================================

    let score = 0;

    let correctAnswers = 0;

    let wrongAnswers = 0;

    let unanswered = 0;

    const finalAnswers = [];

    // =======================================================
    // TRACK SUBMITTED QUESTION IDS
    // =======================================================

    const submittedQuestionIds =
      new Set();

    // =======================================================
    // CHECK SUBMITTED ANSWERS
    // =======================================================

    submittedAnswers.forEach(
      (submitted, submittedIndex) => {
        // ===================================================
        // QUESTION ID
        // ===================================================

        const questionId =
          submitted?.questionId
            ? String(
                submitted.questionId
              )
            : "";

        if (questionId) {
          submittedQuestionIds.add(
            questionId
          );
        }

        // ===================================================
        // FIND QUESTION
        // ===================================================

        const question =
          questionMap.get(
            questionId
          );

        if (!question) {
          console.error(
            `⚠️ Answer ${
              submittedIndex + 1
            } has invalid questionId:`,
            questionId
          );

          return;
        }

        // ===================================================
        // CORRECT ANSWER
        // ===================================================

        const correctAnswer =
          typeof question.correctAnswer ===
          "string"
            ? question.correctAnswer.trim()
            : "";

        // ===================================================
        // MARKS
        //
        // IMPORTANT:
        // Question schema uses "marks"
        // ===================================================

        const marks =
          Number(question.marks) > 0
            ? Number(question.marks)
            : 1;

        // ===================================================
        // USER ANSWER
        // ===================================================

        let selectedAnswer =
          submitted?.selectedAnswer ??
          submitted?.answer ??
          submitted?.selectedOption ??
          "";

        if (
          selectedAnswer === null ||
          selectedAnswer === undefined
        ) {
          selectedAnswer = "";
        }

        selectedAnswer =
          String(
            selectedAnswer
          ).trim();

        // ===================================================
        // ANSWER STATUS
        // ===================================================

        const hasAnswer =
          selectedAnswer.length > 0;

        let isCorrect = false;

        let earnedPoints = 0;

        // ===================================================
        // UNANSWERED
        // ===================================================

        if (!hasAnswer) {
          unanswered++;

          console.log(
            `Q${
              submittedIndex + 1
            }: UNANSWERED`
          );
        }

        // ===================================================
        // NO CORRECT ANSWER IN DATABASE
        // ===================================================

        else if (!correctAnswer) {
          wrongAnswers++;

          console.error(
            `⚠️ Q${
              submittedIndex + 1
            }: Database has no correctAnswer`
          );
        }

        // ===================================================
        // CHECK ANSWER
        // ===================================================

        else {
          const normalizedSelected =
            selectedAnswer
              .trim()
              .toLowerCase();

          const normalizedCorrect =
            correctAnswer
              .trim()
              .toLowerCase();

          isCorrect =
            normalizedSelected ===
            normalizedCorrect;

          // =================================================
          // CORRECT
          // =================================================

          if (isCorrect) {
            correctAnswers++;

            earnedPoints =
              marks;

            score += marks;
          }

          // =================================================
          // WRONG
          // =================================================

          else {
            wrongAnswers++;
          }

          // =================================================
          // LOG
          // =================================================

          console.log(
            `Q${
              submittedIndex + 1
            }:`,
            {
              questionId:
                question._id.toString(),

              selectedAnswer,

              correctAnswer,

              normalizedSelected,

              normalizedCorrect,

              isCorrect,

              marks,

              earnedPoints,
            }
          );
        }

        // ===================================================
        // SAVE ANSWER
        // ===================================================

        finalAnswers.push({
          questionId:
            question._id,

          selectedAnswer:
            hasAnswer
              ? selectedAnswer
              : null,

          correctAnswer,

          isCorrect,

          points: marks,

          earnedPoints,
        });
      }
    );

    // =======================================================
    // HANDLE QUESTIONS NOT SUBMITTED
    // =======================================================

    quizQuestions.forEach(
      (question) => {
        const questionId =
          question._id.toString();

        if (
          !submittedQuestionIds.has(
            questionId
          )
        ) {
          const marks =
            Number(question.marks) > 0
              ? Number(question.marks)
              : 1;

          unanswered++;

          finalAnswers.push({
            questionId:
              question._id,

            selectedAnswer:
              null,

            correctAnswer:
              typeof question.correctAnswer ===
              "string"
                ? question.correctAnswer.trim()
                : "",

            isCorrect: false,

            points: marks,

            earnedPoints: 0,
          });

          console.log(
            `Q ${questionId}: NOT SUBMITTED`
          );
        }
      }
    );

    // =======================================================
    // TOTAL POINTS
    // =======================================================

    const totalPoints =
      quizQuestions.reduce(
        (total, question) => {
          const marks =
            Number(question.marks) > 0
              ? Number(question.marks)
              : 1;

          return total + marks;
        },
        0
      );

    // =======================================================
    // PERCENTAGE
    // =======================================================

    const percentage =
      totalPoints > 0
        ? Number(
            (
              (score /
                totalPoints) *
              100
            ).toFixed(2)
          )
        : 0;

    // =======================================================
    // TIME TAKEN
    // =======================================================

    let safeTimeTaken =
      Number(timeTaken) || 0;

    safeTimeTaken =
      Math.max(
        0,
        safeTimeTaken
      );

    const quizDurationSeconds =
      (Number(
        quiz.duration
      ) || 0) * 60;

    if (
      quizDurationSeconds > 0
    ) {
      safeTimeTaken =
        Math.min(
          safeTimeTaken,
          quizDurationSeconds
        );
    }

    // =======================================================
    // UPDATE ATTEMPT
    // =======================================================

    attempt.answers =
      finalAnswers;

    attempt.score =
      score;

    attempt.totalPoints =
      totalPoints;

    attempt.percentage =
      percentage;

    attempt.correctAnswers =
      correctAnswers;

    attempt.wrongAnswers =
      wrongAnswers;

    attempt.unanswered =
      unanswered;

    attempt.status =
      "completed";

    attempt.submittedAt =
      new Date();

    attempt.timeTaken =
      safeTimeTaken;

    await attempt.save();

    // =======================================================
    // FINAL LOG
    // =======================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "✅ QUIZ SUBMITTED SUCCESSFULLY"
    );

    console.log(
      "Attempt ID:",
      attempt._id.toString()
    );

    console.log(
      "Score:",
      score
    );

    console.log(
      "Total Points:",
      totalPoints
    );

    console.log(
      "Percentage:",
      percentage
    );

    console.log(
      "Correct:",
      correctAnswers
    );

    console.log(
      "Wrong:",
      wrongAnswers
    );

    console.log(
      "Unanswered:",
      unanswered
    );

    console.log(
      "Time:",
      safeTimeTaken
    );

    console.log(
      "Final Answers:",
      JSON.stringify(
        finalAnswers,
        null,
        2
      )
    );

    console.log(
      "========================================\n"
    );

    // =======================================================
    // RESPONSE
    // =======================================================

    return res.status(200).json({
      success: true,

      message:
        "Quiz submitted successfully",

      result: {
        attemptId:
          attempt._id,

        quizId:
          quiz._id,

        quizTitle:
          quiz.title,

        category:
          quiz.category,

        difficulty:
          quiz.difficulty,

        totalQuestions:
          quizQuestions.length,

        score,

        totalPoints,

        percentage,

        correctAnswers,

        wrongAnswers,

        unanswered,

        timeTaken:
          safeTimeTaken,

        passed:
          percentage >= 60,
      },

      attempt,
    });
  } catch (error) {
    console.error(
      "\n❌ SUBMIT ATTEMPT ERROR"
    );

    console.error(
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while submitting attempt",

      error:
        error.message,
    });
  }
};

// =========================================================
// GET MY ATTEMPTS
// =========================================================

const getMyAttempts = async (
  req,
  res
) => {
  try {
    const studentId =
      req.user?._id ||
      req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,

        message:
          "User not authenticated",
      });
    }

    const attempts =
      await Attempt.find({
        student: studentId,
      })
        .populate(
          "quiz",
          "title description category difficulty duration totalPoints"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count:
        attempts.length,

      attempts,
    });
  } catch (error) {
    console.error(
      "Get My Attempts Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while loading attempts",

      error:
        error.message,
    });
  }
};

// =========================================================
// GET SINGLE ATTEMPT
// =========================================================

const getAttemptById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid attempt ID",
      });
    }

    const attempt =
      await Attempt.findById(id)
        .populate(
          {
            path: "quiz",
            select:
              "title description category difficulty duration totalPoints questions",
            populate: {
              path: "questions",
              select:
                "questionText options correctAnswer explanation marks isActive",
            },
          }
        )
        .populate(
          "student",
          "name email role"
        );

    if (!attempt) {
      return res.status(404).json({
        success: false,

        message:
          "Attempt not found",
      });
    }

    // =======================================================
    // OWNER CHECK
    // =======================================================

    const currentUserId =
      req.user?._id?.toString() ||
      req.user?.id?.toString();

    const attemptStudentId =
      attempt.student?._id?.toString() ||
      attempt.student?.toString();

    const isAdmin =
      req.user?.role ===
      "admin";

    if (
      !isAdmin &&
      currentUserId !==
        attemptStudentId
    ) {
      return res.status(403).json({
        success: false,

        message:
          "You are not authorized to view this attempt",
      });
    }

    // =======================================================
    // RESULT RESPONSE
    // =======================================================

    return res.status(200).json({
      success: true,

      attempt,

      result: {
        attemptId:
          attempt._id,

        quizId:
          attempt.quiz?._id,

        quizTitle:
          attempt.quiz?.title ||
          "Quiz",

        category:
          attempt.quiz?.category ||
          "General",

        difficulty:
          attempt.quiz?.difficulty ||
          "Beginner",

        totalQuestions:
          Array.isArray(
            attempt.quiz?.questions
          )
            ? attempt.quiz.questions.length
            : 0,

        score:
          Number(
            attempt.score
          ) || 0,

        totalPoints:
          Number(
            attempt.totalPoints
          ) || 0,

        percentage:
          Number(
            attempt.percentage
          ) || 0,

        correctAnswers:
          Number(
            attempt.correctAnswers
          ) || 0,

        wrongAnswers:
          Number(
            attempt.wrongAnswers
          ) || 0,

        unanswered:
          Number(
            attempt.unanswered
          ) || 0,

        timeTaken:
          Number(
            attempt.timeTaken
          ) || 0,

        passed:
          Number(
            attempt.percentage
          ) >= 60,

        submittedAt:
          attempt.submittedAt,

        completedAt:
          attempt.submittedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get Attempt Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while loading attempt",

      error:
        error.message,
    });
  }
};

// =========================================================
// LEADERBOARD
// =========================================================

const getLeaderboard = async (
  req,
  res
) => {
  try {
    const leaderboard =
      await Attempt.aggregate([
        {
          $match: {
            status:
              "completed",
          },
        },

        {
          $lookup: {
            from: "users",

            localField:
              "student",

            foreignField:
              "_id",

            as:
              "studentData",
          },
        },

        {
          $unwind: {
            path:
              "$studentData",

            preserveNullAndEmptyArrays:
              false,
          },
        },

        {
          $match: {
            "studentData.role":
              "student",

            "studentData.isActive":
              true,
          },
        },

        {
          $group: {
            _id:
              "$studentData._id",

            name: {
              $first:
                "$studentData.name",
            },

            email: {
              $first:
                "$studentData.email",
            },

            attempts: {
              $sum: 1,
            },

            averageScore: {
              $avg: {
                $ifNull: [
                  "$percentage",
                  0,
                ],
              },
            },

            highestScore: {
              $max: {
                $ifNull: [
                  "$percentage",
                  0,
                ],
              },
            },

            totalScore: {
              $sum: {
                $ifNull: [
                  "$score",
                  0,
                ],
              },
            },
          },
        },

        {
          $project: {
            _id: 1,

            name: 1,

            email: 1,

            attempts: 1,

            averageScore: {
              $round: [
                "$averageScore",
                0,
              ],
            },

            highestScore: {
              $round: [
                "$highestScore",
                0,
              ],
            },

            totalScore: 1,
          },
        },

        {
          $sort: {
            averageScore:
              -1,

            highestScore:
              -1,

            attempts:
              -1,

            name: 1,
          },
        },

        {
          $limit: 10,
        },
      ]);

    const rankedLeaderboard =
      leaderboard.map(
        (
          student,
          index
        ) => ({
          rank:
            index + 1,

          ...student,
        })
      );

    return res.status(200).json({
      success: true,

      count:
        rankedLeaderboard.length,

      leaderboard:
        rankedLeaderboard,
    });
  } catch (error) {
    console.error(
      "Leaderboard Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while loading leaderboard",

      error:
        error.message,
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptById,
  getLeaderboard,
};