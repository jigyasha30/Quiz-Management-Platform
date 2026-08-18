const User = require("../models/User");
const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");

// =========================================================
// ADMIN ANALYTICS
// =========================================================

const getAdminAnalytics = async (req, res) => {
  try {
    // =======================================================
    // BASIC COUNTS
    // =======================================================

    const totalStudents = await User.countDocuments({
      role: "student",
    });

    const totalUsers = await User.countDocuments();

    const totalQuizzes = await Quiz.countDocuments();

    const totalAttempts = await Attempt.countDocuments({
      status: "completed",
    });

    // =======================================================
    // STUDENT REGISTRATIONS
    // =======================================================

    const registrationData = await User.aggregate([
      {
        $match: {
          role: "student",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // =======================================================
    // ATTEMPTS OVER TIME
    // =======================================================

    const attemptsOverTime = await Attempt.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          attempts: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // =======================================================
    // SCORE STATS
    // =======================================================

    const scoreStats = await Attempt.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,

          averageScore: {
            $avg: "$percentage",
          },

          totalScore: {
            $sum: "$score",
          },

          totalPoints: {
            $sum: "$totalPoints",
          },
        },
      },
    ]);

    const averageScore =
      scoreStats.length > 0
        ? Number(
            (scoreStats[0].averageScore || 0).toFixed(2)
          )
        : 0;

    const totalScore =
      scoreStats.length > 0
        ? Number(scoreStats[0].totalScore || 0)
        : 0;

    const totalPoints =
      scoreStats.length > 0
        ? Number(scoreStats[0].totalPoints || 0)
        : 0;

    // =======================================================
    // PASS / FAIL
    // =======================================================

    const passedAttempts = await Attempt.countDocuments({
      status: "completed",
      percentage: {
        $gte: 40,
      },
    });

    const failedAttempts =
      totalAttempts - passedAttempts;

    const passRate =
      totalAttempts > 0
        ? Number(
            (
              (passedAttempts / totalAttempts) *
              100
            ).toFixed(2)
          )
        : 0;

    const failRate =
      totalAttempts > 0
        ? Number(
            (
              (failedAttempts / totalAttempts) *
              100
            ).toFixed(2)
          )
        : 0;

    // =======================================================
    // POPULAR QUIZZES
    // =======================================================

    const popularQuizzes = await Attempt.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$quiz",

          attempts: {
            $sum: 1,
          },

          averageScore: {
            $avg: "$percentage",
          },
        },
      },
      {
        $sort: {
          attempts: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "_id",
          as: "quiz",
        },
      },
      {
        $unwind: {
          path: "$quiz",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,

          attempts: 1,

          averageScore: {
            $round: [
              {
                $ifNull: [
                  "$averageScore",
                  0,
                ],
              },
              2,
            ],
          },

          title: {
            $ifNull: [
              "$quiz.title",
              "Unknown Quiz",
            ],
          },

          category: {
            $ifNull: [
              "$quiz.category",
              "Unknown",
            ],
          },
        },
      },
    ]);

    // =======================================================
    // POPULAR CATEGORIES
    // =======================================================

    const popularCategories =
      await Attempt.aggregate([
        {
          $match: {
            status: "completed",
          },
        },
        {
          $lookup: {
            from: "quizzes",
            localField: "quiz",
            foreignField: "_id",
            as: "quiz",
          },
        },
        {
          $unwind: {
            path: "$quiz",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$quiz.category",

            attempts: {
              $sum: 1,
            },

            averageScore: {
              $avg: "$percentage",
            },
          },
        },
        {
          $sort: {
            attempts: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            _id: 0,

            category: {
              $ifNull: [
                "$_id",
                "Unknown",
              ],
            },

            attempts: 1,

            averageScore: {
              $round: [
                {
                  $ifNull: [
                    "$averageScore",
                    0,
                  ],
                },
                2,
              ],
            },
          },
        },
      ]);

    // =======================================================
    // DIFFICULTY
    // =======================================================

    const difficultyStats =
      await Quiz.aggregate([
        {
          $group: {
            _id: "$difficulty",

            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $project: {
            _id: 0,

            difficulty: {
              $ifNull: [
                "$_id",
                "Unknown",
              ],
            },

            count: 1,
          },
        },
      ]);

    // =======================================================
    // ACTIVE / INACTIVE STUDENTS
    // =======================================================

    const activeStudents =
      await User.countDocuments({
        role: "student",
        isActive: true,
      });

    const inactiveStudents =
      await User.countDocuments({
        role: "student",
        isActive: false,
      });

    // =======================================================
    // RESPONSE
    // =======================================================

    return res.status(200).json({
      success: true,

      analytics: {
        overview: {
          totalStudents,
          totalUsers,
          totalQuizzes,
          totalAttempts,
          averageScore,
          totalScore,
          totalPoints,
          passedAttempts,
          failedAttempts,
          passRate,
          failRate,
          activeStudents,
          inactiveStudents,
        },

        studentRegistrations:
          registrationData.map(
            (item) => ({
              date: item._id,
              count: item.count,
            })
          ),

        attemptsOverTime:
          attemptsOverTime.map(
            (item) => ({
              date: item._id,
              attempts:
                item.attempts,
            })
          ),

        passFailRatio: {
          passed: passedAttempts,
          failed: failedAttempts,
          passRate,
          failRate,
        },

        popularQuizzes,

        popularCategories,

        difficultyStats,
      },
    });
  } catch (error) {
    console.error(
      "Get Admin Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching admin analytics",
      error: error.message,
    });
  }
};

// =========================================================
// STUDENT ANALYTICS
// =========================================================

const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.user._id;

    // =======================================================
    // GET STUDENT COMPLETED ATTEMPTS
    // =======================================================

    const attempts = await Attempt.find({
      user: studentId,
      status: "completed",
    })
      .populate(
        "quiz",
        "title category difficulty duration"
      )
      .sort({
        submittedAt: -1,
        createdAt: -1,
      });

    // =======================================================
    // BASIC STATS
    // =======================================================

    const totalAttempts =
      attempts.length;

    const averageScore =
      totalAttempts > 0
        ? Number(
            (
              attempts.reduce(
                (sum, attempt) =>
                  sum +
                  Number(
                    attempt.percentage || 0
                  ),
                0
              ) / totalAttempts
            ).toFixed(2)
          )
        : 0;

    const passedAttempts =
      attempts.filter(
        (attempt) =>
          Number(
            attempt.percentage || 0
          ) >= 40
      ).length;

    const failedAttempts =
      totalAttempts -
      passedAttempts;

    const passRate =
      totalAttempts > 0
        ? Number(
            (
              (passedAttempts /
                totalAttempts) *
              100
            ).toFixed(2)
          )
        : 0;

    // =======================================================
    // TOTAL TIME
    // =======================================================

    const totalTimeSpent =
      attempts.reduce(
        (total, attempt) =>
          total +
          Math.max(
            0,
            Number(
              attempt.timeTaken || 0
            )
          ),
        0
      );

    // =======================================================
    // BEST SCORE
    // =======================================================

    const bestScore =
      totalAttempts > 0
        ? Math.max(
            ...attempts.map(
              (attempt) =>
                Number(
                  attempt.percentage || 0
                )
            )
          )
        : 0;

    // =======================================================
    // WORST SCORE
    // =======================================================

    const lowestScore =
      totalAttempts > 0
        ? Math.min(
            ...attempts.map(
              (attempt) =>
                Number(
                  attempt.percentage || 0
                )
            )
          )
        : 0;

    // =======================================================
    // SCORE HISTORY
    // =======================================================

    const scoreHistory =
      attempts
        .slice()
        .reverse()
        .map(
          (attempt, index) => ({
            attempt:
              index + 1,

            score: Number(
              attempt.percentage || 0
            ),

            quiz:
              attempt?.quiz?.title ||
              "Quiz",

            date:
              attempt.submittedAt ||
              attempt.createdAt,
          })
        );

    // =======================================================
    // QUIZ PERFORMANCE
    // =======================================================

    const quizPerformance =
      attempts.map(
        (attempt) => ({
          _id: attempt._id,

          quizId:
            attempt?.quiz?._id,

          title:
            attempt?.quiz?.title ||
            "Quiz",

          category:
            attempt?.quiz?.category ||
            "General",

          difficulty:
            attempt?.quiz?.difficulty ||
            "Beginner",

          score: Number(
            attempt.score || 0
          ),

          totalPoints: Number(
            attempt.totalPoints || 0
          ),

          percentage: Number(
            attempt.percentage || 0
          ),

          timeTaken: Number(
            attempt.timeTaken || 0
          ),

          status:
            Number(
              attempt.percentage || 0
            ) >= 40
              ? "passed"
              : "failed",

          date:
            attempt.submittedAt ||
            attempt.createdAt,
        })
      );

    // =======================================================
    // CATEGORY PERFORMANCE
    // =======================================================

    const categoryMap = {};

    attempts.forEach(
      (attempt) => {
        const category =
          attempt?.quiz?.category ||
          "General";

        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            attempts: 0,
            totalScore: 0,
          };
        }

        categoryMap[
          category
        ].attempts += 1;

        categoryMap[
          category
        ].totalScore += Number(
          attempt.percentage || 0
        );
      }
    );

    const categoryPerformance =
      Object.values(
        categoryMap
      ).map(
        (item) => ({
          category:
            item.category,

          attempts:
            item.attempts,

          averageScore:
            Number(
              (
                item.totalScore /
                item.attempts
              ).toFixed(2)
            ),
        })
      );

    // =======================================================
    // RECENT ATTEMPTS
    // =======================================================

    const recentAttempts =
      attempts
        .slice(0, 5)
        .map(
          (attempt) => ({
            _id: attempt._id,

            quiz:
              attempt?.quiz?.title ||
              "Quiz",

            category:
              attempt?.quiz?.category ||
              "General",

            score: Number(
              attempt.score || 0
            ),

            totalPoints: Number(
              attempt.totalPoints || 0
            ),

            percentage: Number(
              attempt.percentage || 0
            ),

            timeTaken: Number(
              attempt.timeTaken || 0
            ),

            status:
              Number(
                attempt.percentage || 0
              ) >= 40
                ? "passed"
                : "failed",

            date:
              attempt.submittedAt ||
              attempt.createdAt,
          })
        );

    // =======================================================
    // RESPONSE
    // =======================================================

    return res.status(200).json({
      success: true,

      analytics: {
        overview: {
          totalAttempts,
          averageScore,
          passedAttempts,
          failedAttempts,
          passRate,
          failRate:
            totalAttempts > 0
              ? Number(
                  (
                    (failedAttempts /
                      totalAttempts) *
                    100
                  ).toFixed(2)
                )
              : 0,
          totalTimeSpent,
          bestScore,
          lowestScore,
        },

        scoreHistory,

        quizPerformance,

        categoryPerformance,

        recentAttempts,
      },
    });
  } catch (error) {
    console.error(
      "Get Student Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching student analytics",
      error: error.message,
    });
  }
};

// =========================================================
// GET ANALYTICS
// ROLE BASED
// =========================================================

const getAnalytics = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return getAdminAnalytics(req, res);
    }

    if (req.user?.role === "student") {
      return getStudentAnalytics(req, res);
    }

    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  } catch (error) {
    console.error(
      "Get Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getAnalytics,
  getAdminAnalytics,
  getStudentAnalytics,
};