const Attempt = require("../models/Attempt");
const User = require("../models/User");
const Quiz = require("../models/Quiz");

// ==========================================
// GET GLOBAL LEADERBOARD
// ==========================================
const getGlobalLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Attempt.aggregate([
      {
        $match: {
          status: "completed",
        },
      },

      {
        $group: {
          _id: "$student",
          totalScore: {
            $sum: "$score",
          },
          totalPoints: {
            $sum: "$totalPoints",
          },
          attempts: {
            $sum: 1,
          },
          averagePercentage: {
            $avg: "$percentage",
          },
        },
      },

      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ["$totalPoints", 0] },
              {
                $multiply: [
                  { $divide: ["$totalScore", "$totalPoints"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },

      {
        $sort: {
          percentage: -1,
          totalScore: -1,
        },
      },

      {
        $limit: 50,
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },

      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,
          studentId: "$_id",
          name: "$student.name",
          email: "$student.email",
          totalScore: 1,
          totalPoints: 1,
          attempts: 1,
          averagePercentage: {
            $round: ["$averagePercentage", 2],
          },
          percentage: {
            $round: ["$percentage", 2],
          },
        },
      },
    ]);

    const rankedLeaderboard = leaderboard.map((student, index) => ({
      rank: index + 1,
      ...student,
    }));

    return res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Get Global Leaderboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching leaderboard",
      error: error.message,
    });
  }
};

// ==========================================
// GET QUIZ LEADERBOARD
// ==========================================
const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const leaderboard = await Attempt.aggregate([
      {
        $match: {
          quiz: quiz._id,
          status: "completed",
        },
      },

      {
        $sort: {
          percentage: -1,
          score: -1,
          timeTaken: 1,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },

      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          studentId: "$student._id",
          name: "$student.name",
          email: "$student.email",
          score: 1,
          totalPoints: 1,
          percentage: 1,
          correctAnswers: 1,
          wrongAnswers: 1,
          unanswered: 1,
          timeTaken: 1,
          submittedAt: 1,
        },
      },

      {
        $limit: 50,
      },
    ]);

    const rankedLeaderboard = leaderboard.map((student, index) => ({
      rank: index + 1,
      ...student,
    }));

    return res.status(200).json({
      success: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalPoints: quiz.totalPoints,
      },
      count: rankedLeaderboard.length,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Get Quiz Leaderboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching quiz leaderboard",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY RANK
// ==========================================
const getMyRank = async (req, res) => {
  try {
    const completedAttempts = await Attempt.find({
      status: "completed",
      student: req.user._id,
    }).sort({
      percentage: -1,
      score: -1,
    });

    if (completedAttempts.length === 0) {
      return res.status(200).json({
        success: true,
        rank: null,
        message: "No completed attempts found",
      });
    }

    const allStudents = await Attempt.aggregate([
      {
        $match: {
          status: "completed",
        },
      },

      {
        $group: {
          _id: "$student",
          totalScore: {
            $sum: "$score",
          },
          totalPoints: {
            $sum: "$totalPoints",
          },
        },
      },

      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ["$totalPoints", 0] },
              {
                $multiply: [
                  { $divide: ["$totalScore", "$totalPoints"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },

      {
        $sort: {
          percentage: -1,
          totalScore: -1,
        },
      },
    ]);

    const rankIndex = allStudents.findIndex(
      (student) =>
        student._id.toString() === req.user._id.toString()
    );

    if (rankIndex === -1) {
      return res.status(200).json({
        success: true,
        rank: null,
        message: "Rank not available",
      });
    }

    const currentStudent = allStudents[rankIndex];

    return res.status(200).json({
      success: true,
      rank: rankIndex + 1,
      totalStudents: allStudents.length,
      totalScore: currentStudent.totalScore,
      totalPoints: currentStudent.totalPoints,
      percentage: Number(
        currentStudent.percentage.toFixed(2)
      ),
    });
  } catch (error) {
    console.error("Get My Rank Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching rank",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  getGlobalLeaderboard,
  getQuizLeaderboard,
  getMyRank,
};