const mongoose = require("mongoose");
const User = require("../models/User");
const Attempt = require("../models/Attempt");

// ==========================================
// HELPER - VALIDATE MONGODB ID
// ==========================================
const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// GET ALL USERS
// ADMIN ONLY
// Supports search by name or email
// ==========================================
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const searchTerm = search.trim();

      filter.$or = [
        {
          name: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// ==========================================
// GET USER BY ID
// ADMIN ONLY
// ==========================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY PROFILE
// ==========================================
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get My Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE MY PROFILE
// ==========================================
const updateMyProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: user._id,
          },
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }

      user.email = normalizedEmail;
    }

    await user.save();

    const safeUser =
      await User.findById(user._id).select(
        "-password"
      );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update My Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating profile",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE USER ROLE
// ADMIN ONLY
// ==========================================
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Use student or admin",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admin cannot change their own role
    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    user.role = role;

    await user.save();

    const safeUser =
      await User.findById(user._id).select(
        "-password"
      );

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update User Role Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating user role",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE USER STATUS
// ACTIVATE / DEACTIVATE
// ADMIN ONLY
// ==========================================
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cannot change own status
    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status",
      });
    }

    user.isActive = isActive;

    await user.save();

    const safeUser =
      await User.findById(user._id).select(
        "-password"
      );

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update User Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating user status",
      error: error.message,
    });
  }
};

// ==========================================
// GET USER ATTEMPTS
// ADMIN ONLY
// ==========================================
const getUserAttempts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const attempts = await Attempt.find({
      student: id,
      status: "completed",
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
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error(
      "Get User Attempts Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching user attempts",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE USER
// ADMIN ONLY
// ==========================================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cannot delete own account
    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account",
      });
    }

    // Delete student's attempts first
    await Attempt.deleteMany({
      student: user._id,
    });

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting user",
      error: error.message,
    });
  }
};

// ==========================================
// GET USER STATISTICS
// ADMIN ONLY
// ==========================================
const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const attempts = await Attempt.find({
      student: id,
      status: "completed",
    });

    const totalAttempts =
      attempts.length;

    const totalScore =
      attempts.reduce(
        (sum, attempt) =>
          sum +
          (Number(attempt.score) || 0),
        0
      );

    const totalPoints =
      attempts.reduce(
        (sum, attempt) =>
          sum +
          (Number(attempt.totalPoints) || 0),
        0
      );

    const averagePercentage =
      totalAttempts > 0
        ? Number(
            (
              attempts.reduce(
                (sum, attempt) =>
                  sum +
                  (Number(
                    attempt.percentage
                  ) || 0),
                0
              ) / totalAttempts
            ).toFixed(2)
          )
        : 0;

    const bestPercentage =
      totalAttempts > 0
        ? Math.max(
            ...attempts.map(
              (attempt) =>
                Number(
                  attempt.percentage
                ) || 0
            )
          )
        : 0;

    const passedAttempts =
      attempts.filter(
        (attempt) =>
          (Number(
            attempt.percentage
          ) || 0) >= 40
      ).length;

    const failedAttempts =
      totalAttempts -
      passedAttempts;

    return res.status(200).json({
      success: true,

      stats: {
        totalAttempts,
        totalScore,
        totalPoints,
        averagePercentage,
        bestPercentage,
        passedAttempts,
        failedAttempts,
      },
    });
  } catch (error) {
    console.error(
      "Get User Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching user statistics",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  getUsers,
  getUserById,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus,
  getUserAttempts,
  deleteUser,
  getUserStats,
};