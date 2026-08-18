const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");

// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalQuizzes,
      publishedQuizzes,
      draftQuizzes,
      totalAttempts,
      completedAttempts,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "student",
      }),

      User.countDocuments({
        role: "admin",
      }),

      Quiz.countDocuments(),

      Quiz.countDocuments({
        isPublished: true,
      }),

      Quiz.countDocuments({
        isPublished: false,
      }),

      Attempt.countDocuments(),

      Attempt.countDocuments({
        status: "completed",
      }),
    ]);

    // ==========================================
    // SCORE STATISTICS
    // ==========================================
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
            $avg: "$score",
          },
          averagePercentage: {
            $avg: "$percentage",
          },
          highestScore: {
            $max: "$score",
          },
          lowestScore: {
            $min: "$score",
          },
        },
      },
    ]);

    const scores = scoreStats[0] || {
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
    };

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          admins: totalAdmins,
        },

        quizzes: {
          total: totalQuizzes,
          published: publishedQuizzes,
          drafts: draftQuizzes,
        },

        attempts: {
          total: totalAttempts,
          completed: completedAttempts,
          inProgress: totalAttempts - completedAttempts,
        },

        performance: {
          averageScore: Number(
            scores.averageScore.toFixed(2)
          ),
          averagePercentage: Number(
            scores.averagePercentage.toFixed(2)
          ),
          highestScore: scores.highestScore,
          lowestScore: scores.lowestScore,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard statistics",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL ATTEMPTS
// ==========================================
const getAllAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find()
      .populate(
        "student",
        "name email role"
      )
      .populate(
        "quiz",
        "title category difficulty totalPoints"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error("Get All Attempts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching all attempts",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL USERS
// ==========================================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllAttempts,
  getAllUsers,
};